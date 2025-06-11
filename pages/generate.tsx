import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import GenerationChat from '../components/GenerationChat';
import GeneratorLayout from '../components/layouts/GeneratorLayout';
import WelcomeScreen from '../components/WelcomeScreen';
import type { ChatMessage } from '../lib/store';
import { generateUniqueId } from '../lib/utils';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function Generate() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
