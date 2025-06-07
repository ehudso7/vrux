/**
 * Type definitions for VRUX application
 */

/**
 * API response types
 */
export interface GenerateUIResponse {
  code: string;
  variants?: string[];
  provider?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  remainingRequests?: number;
}

export interface GenerateUIError {
  error: string;
  resetTime?: string;
  remainingRequests?: number;
  details?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  openai: {
    configured: boolean;
  };
  uptime: number;
}

/**
 * Component prop types
 */
export interface AIChatBoxProps {
  onGenerate: (prompt: string) => Promise<void>;
}

export interface PreviewProps {
  code: string;
}

export interface ButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Request types
 */
export interface GenerateUIRequest {
  prompt: string;
}

/**
 * Logger types
 */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  environment: string;
  pid?: number;
  [key: string]: unknown;
}

export interface RequestLogMeta {
  method: string;
  url: string;
  statusCode: number;
  responseTime: string;
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

/**
 * Error types
 */
export interface APIError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Rate limiter types
 */
export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Environment types
 */
export interface EnvironmentVariables {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_TOKEN?: string;
  NETLIFY_TOKEN?: string;
  GITHUB_TOKEN?: string;
  VIEWCOMFY_API_URL?: string;
  VIEWCOMFY_INFER_URL?: string;
  VIEWCOMFY_CLIENT_ID?: string;
  VIEWCOMFY_CLIENT_SECRET?: string;
  TEST_URL?: string;
  SESSION_SECRET?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  MAX_GENERATION_TIME_MS?: string;
  MAX_TOKENS?: string;
  NEXT_PUBLIC_ENABLE_VIEWCOMFY?: string;
  NEXT_PUBLIC_ENABLE_CACHE?: string;
  NEXT_PUBLIC_ENABLE_QUALITY_CHECKS?: string;
  VERCEL_API_URL?: string;
  NETLIFY_API_URL?: string;
}

/**
 * ViewComfy API types
 */
export interface ViewComfyOptions {
  inferUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface ViewComfyParams {
  [key: string]: string | number | File | Blob | unknown;
}

export interface ViewComfyFileOutput {
  filename: string;
  content_type: string;
  data: string;
  size: number;
}

export interface ViewComfyResponse {
  prompt_id: string;
  status: string;
  completed: boolean;
  execution_time_seconds: number;
  prompt: Record<string, unknown>;
  outputs?: ViewComfyFileOutput[];
}

export interface ViewComfyGenerateRequest {
  prompt: string;
  workflowParams?: ViewComfyParams;
  useStreaming?: boolean;
}

export interface ViewComfyGenerateResponse {
  success: boolean;
  promptId?: string;
  outputs?: ViewComfyFileOutput[];
  error?: string;
  executionTime?: number;
} 