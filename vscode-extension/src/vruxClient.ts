import axios, { AxiosInstance } from 'axios';
import { EventSource } from 'eventsource';
import * as vscode from 'vscode';

export interface GenerateOptions {
    model?: string;
    streaming?: boolean;
    temperature?: number;
    onProgress?: (percent: number) => void;
    onToken?: (token: string) => void;
}

export interface GenerateResult {
    code: string;
    model: string;
    provider: string;
    metrics?: {
        promptTokens: number;
        completionTokens: number;
        generationTime: number;
    };
}

export class VruxClient {
    private axios: AxiosInstance;
    private apiKey: string;

    constructor(private apiUrl: string, apiKey: string) {
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL: apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
    }

    updateConfig(apiUrl: string, apiKey: string) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL: apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
    }

    async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
        if (options.streaming) {
            return this.generateStream(prompt, options);
        }

        const response = await this.axios.post('/api/generate-ui', {
            prompt,
            model: options.model,
            temperature: options.temperature
        });

        return {
            code: response.data.code,
            model: response.data.model || options.model || 'gpt-4o',
            provider: response.data.provider || 'openai',
            metrics: response.data.metrics
        };
    }

    private generateStream(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(
                `${this.apiUrl}/api/generate-ui-stream`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let code = '';
            let model = options.model || 'gpt-4o';
            let provider = 'openai';
            let tokenCount = 0;

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'content':
                            code += data.content;
                            tokenCount++;
                            if (options.onToken) {
                                options.onToken(data.content);
                            }
                            if (options.onProgress && tokenCount % 10 === 0) {
                                options.onProgress(Math.min(tokenCount / 500, 0.95) * 100);
                            }
                            break;

                        case 'variant_complete':
                            code = data.code;
                            provider = data.provider || provider;
                            if (options.onProgress) {
                                options.onProgress(100);
                            }
                            break;

                        case 'done':
                            eventSource.close();
                            resolve({
                                code,
                                model,
                                provider,
                                metrics: data.metrics
                            });
                            break;

                        case 'error':
                            eventSource.close();
                            reject(new Error(data.message || 'Generation failed'));
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse SSE data:', error);
                }
            };

            eventSource.onerror = (error) => {
                eventSource.close();
                reject(error);
            };
        });
    }

    async enhance(code: string, action: string): Promise<GenerateResult> {
        const prompts: Record<string, string> = {
            enhance: 'Enhance this React component with better structure, performance optimizations, and best practices',
            typescript: 'Convert this JavaScript React component to TypeScript with proper type definitions',
            styling: 'Add beautiful Tailwind CSS styling to this React component',
            interactive: 'Add interactive features and state management to this React component',
            a11y: 'Improve the accessibility of this React component with ARIA labels and keyboard navigation'
        };

        const prompt = `${prompts[action] || prompts.enhance}:\n\n${code}`;
        return this.generate(prompt);
    }

    async getMarketplaceComponents(search?: string, category?: string): Promise<any[]> {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);

        const response = await this.axios.get('/api/marketplace/components', { params });
        return response.data.components || [];
    }

    async getComponentHistory(): Promise<any[]> {
        const response = await this.axios.get('/api/user/history');
        return response.data.history || [];
    }

    async saveComponent(name: string, code: string, metadata?: any): Promise<void> {
        await this.axios.post('/api/user/components', {
            name,
            code,
            metadata
        });
    }

    async shareComponent(componentId: string, options?: { public?: boolean; description?: string }): Promise<string> {
        const response = await this.axios.post(`/api/share/${componentId}`, options);
        return response.data.shareUrl;
    }
}