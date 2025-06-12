import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import GenerationChat from '../components/GenerationChat';
import GeneratorLayout from '../components/layouts/GeneratorLayout';
import WelcomeScreen from '../components/WelcomeScreen';
import { EnhancedGenerationInterface } from '../components/enhanced-generation-interface';
import type { ChatMessage } from '../lib/store';
import { generateUniqueId } from '../lib/utils';
import { useAuth } from '../lib/auth-context';
import { Loader2, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Generate() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'classic' | 'enhanced'>('enhanced');

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
        <div className="flex-1 flex flex-col">
          {/* Mode Switcher */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold">AI Component Generator</h1>
              <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setMode('enhanced')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    mode === 'enhanced'
                      ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Enhanced
                </button>
                <button
                  onClick={() => setMode('classic')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    mode === 'classic'
                      ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Classic
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {mode === 'enhanced' ? (
              <EnhancedGenerationInterface 
                onGenerate={(code, variant) => {
                  console.log(`Generated variant ${variant}:`, code);
                }}
              />
            ) : (
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
            )}
          </div>
        </div>
      </GeneratorLayout>
    </>
  );
}
