import { useState } from 'react';
import Head from 'next/head';
import GenerationChat from '../components/GenerationChat';
import GeneratorLayout from '../components/layouts/GeneratorLayout';
import WelcomeScreen from '../components/WelcomeScreen';
import type { ChatMessage } from '../lib/store';
import { generateUniqueId } from '../lib/utils';

export default function Generate() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      // Use development endpoint in dev mode
      const endpoint = process.env.NODE_ENV === 'development' 
        ? '/api/generate-ui-dev' 
        : '/api/generate-ui';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate component');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'I\'ve generated your component. You can view and edit it in the preview.',
        components: [{
          id: generateUniqueId(),
          prompt: prompt,
          code: data.code,
          timestamp: new Date()
        }],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'system',
        content: error instanceof Error ? error.message : 'Failed to generate component',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Generate - VRUX</title>
        <meta name="description" content="Generate UI components with AI" />
      </Head>

      <GeneratorLayout>
        <div className="flex-1 flex">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectTemplate={handleGenerate} />
          ) : (
            <GenerationChat
              messages={messages}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </GeneratorLayout>
    </>
  );
}
