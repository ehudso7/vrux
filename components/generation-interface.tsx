import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot,
  Code2,
  Eye,
  Copy,
  Download,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Zap,
  Palette
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import Editor from '@monaco-editor/react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  variant?: number;
}

interface GenerationInterfaceProps {
  darkMode: boolean;
}

const VARIANTS = [
  { 
    id: 'modern',
    name: "Modern", 
    icon: <Sparkles className="w-4 h-4" />, 
    style: "Clean and minimalist"
  },
  { 
    id: 'bold',
    name: "Bold", 
    icon: <Zap className="w-4 h-4" />, 
    style: "Vibrant and dynamic"
  },
  { 
    id: 'elegant',
    name: "Elegant", 
    icon: <Palette className="w-4 h-4" />, 
    style: "Sophisticated and refined"
  }
];

export default function GenerationInterface({ darkMode }: GenerationInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial prompt from URL
  useEffect(() => {
    if (router.query.prompt && !initialPromptProcessed) {
      const urlPrompt = decodeURIComponent(router.query.prompt as string);
      setPrompt(urlPrompt);
      setInitialPromptProcessed(true);
      
      // Auto-submit after a short delay
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }, 500);
    }
  }, [router.query.prompt, initialPromptProcessed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsGenerating(true);
    setGeneratedCode('');
    setVariants([]);
    setStreamingText('');
    setSelectedVariant(0);

    // Add assistant thinking message
    const thinkingMessage: Message = {
      id: Date.now().toString() + '-thinking',
      type: 'assistant',
      content: 'I\'m designing your component with 3 unique variations...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const response = await fetch('/api/generate-ui-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, variants: 3 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate component');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const variantCodes: string[] = ['', '', ''];
      let currentStreamingContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'content' && data.variant === 0) {
                  currentStreamingContent += data.content;
                  setStreamingText(currentStreamingContent);
                }
                
                if (data.type === 'variant_complete') {
                  variantCodes[data.variant] = data.code;
                  setVariants([...variantCodes.filter(c => c)]);
                  if (data.variant === 0) {
                    setGeneratedCode(data.code);
                  }
                  
                  // Add completion message for each variant
                  const variantMessage: Message = {
                    id: Date.now().toString() + `-variant-${data.variant}`,
                    type: 'assistant',
                    content: `✨ ${VARIANTS[data.variant].name} variant completed!`,
                    timestamp: new Date(),
                    variant: data.variant
                  };
                  setMessages(prev => [...prev, variantMessage]);
                }
              } catch {
                // Parse error - ignore
              }
            }
          }
        }
      }
      
      // Remove thinking message and add final message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));
      const finalMessage: Message = {
        id: Date.now().toString() + '-complete',
        type: 'assistant',
        content: 'I\'ve created 3 unique variations of your component. Click on each variant above the preview to see different styles!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, finalMessage]);
      
      toast.success('Components generated successfully!', {
        duration: 3000,
        icon: '✨',
      });
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        type: 'system',
        content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error(error instanceof Error ? error.message : 'Something went wrong', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const handleCopy = async () => {
    const code = variants[selectedVariant] || generatedCode;
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!', {
        duration: 2000,
        icon: '📋',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const code = variants[selectedVariant] || generatedCode;
    if (!code) return;
    
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${VARIANTS[selectedVariant].id}-${Date.now()}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Component downloaded!', {
      duration: 2000,
      icon: '⬇️',
    });
  };

  const deviceFrames = {
    desktop: "w-full h-full",
    tablet: "max-w-[768px] max-h-[1024px] mx-auto",
    mobile: "max-w-[375px] max-h-[667px] mx-auto"
  };

  return (
    <div className={`flex h-[calc(100vh-4rem)] ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Chat Panel */}
      <div className={`w-1/3 flex flex-col border-r ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className="text-lg font-medium mb-2">Start Creating</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Describe the component you want to build
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.type === 'assistant' 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {message.type === 'assistant' ? (
                      <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <span className="text-red-600 dark:text-red-400">!</span>
                    )}
                  </div>
                )}
                
                <div className={`flex-1 ${message.type === 'user' ? 'max-w-[80%]' : ''}`}>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white ml-auto'
                      : message.type === 'system'
                      ? darkMode ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
                      : darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' 
                        ? 'text-purple-200' 
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))
          )}
          
          {isGenerating && streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
              </div>
              <div className={`flex-1 rounded-lg px-4 py-2 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <pre className="text-sm font-mono text-purple-600 dark:text-purple-400 whitespace-pre-wrap">
                  {streamingText}
                </pre>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={`p-4 border-t ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your component..."
              className={`w-full px-4 py-3 pr-12 rounded-lg resize-none ${
                darkMode 
                  ? 'bg-gray-900 text-white placeholder-gray-500 border-gray-700' 
                  : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
              rows={3}
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="absolute right-2 bottom-2 p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Code/Preview Panel */}
      <div className="flex-1 flex flex-col">
        {/* Variant Selector */}
        {variants.length > 0 && (
          <div className={`px-6 py-3 border-b ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
          } flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {VARIANTS.map((variant, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVariant(index)}
                  disabled={!variants[index]}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedVariant === index 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  } ${!variants[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {variant.icon}
                  <span>{variant.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-800 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    } transition-colors`}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  Copy code
                </Tooltip.Content>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleDownload}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-800 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    } transition-colors`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  Download
                </Tooltip.Content>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setFullscreen(!fullscreen)}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-800 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    } transition-colors`}
                  >
                    {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')} className="flex-1 flex flex-col">
          <Tabs.List className={`flex items-center gap-1 px-6 py-2 border-b ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <Tabs.Trigger 
              value="preview" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="code" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </Tabs.Trigger>

            {activeTab === 'preview' && (
              <div className="ml-auto flex items-center gap-2">
                {[
                  { id: 'desktop' as const, icon: Monitor },
                  { id: 'tablet' as const, icon: Tablet },
                  { id: 'mobile' as const, icon: Smartphone },
                ].map((device) => (
                  <Tooltip.Root key={device.id}>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => setDeviceView(device.id)}
                        className={`p-2 rounded transition-all ${
                          deviceView === device.id 
                            ? darkMode
                              ? 'bg-gray-800 text-white shadow-sm' 
                              : 'bg-white shadow-sm'
                            : darkMode
                              ? 'text-gray-400 hover:text-white'
                              : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <device.icon className="w-4 h-4" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                      {device.id.charAt(0).toUpperCase() + device.id.slice(1)} view
                    </Tooltip.Content>
                  </Tooltip.Root>
                ))}
              </div>
            )}
          </Tabs.List>

          <Tabs.Content value="preview" className="flex-1 overflow-hidden">
            <div className={`h-full ${darkMode ? 'bg-gray-950' : 'bg-gray-100'} p-8 overflow-auto`}>
              {generatedCode ? (
                <div className={`${deviceFrames[deviceView]} h-full`}>
                  <div className={`${
                    darkMode ? 'bg-gray-900' : 'bg-white'
                  } rounded-xl shadow-2xl p-8 h-full overflow-auto`}>
                    <LiveProvider 
                      code={variants[selectedVariant] || generatedCode} 
                      scope={{ 
                        React, 
                        useState: React.useState, 
                        useEffect: React.useEffect, 
                        useRef: React.useRef,
                        useCallback: React.useCallback,
                        useMemo: React.useMemo,
                        motion,
                        AnimatePresence
                      }}
                      noInline={false}
                    >
                      <LiveError className="text-red-500 bg-red-50 dark:bg-red-950/50 p-4 rounded-lg text-sm mb-4" />
                      <LivePreview />
                    </LiveProvider>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Code2 className={`w-12 h-12 mx-auto mb-4 ${
                      darkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Your component preview will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="code" className="flex-1 overflow-hidden">
            {generatedCode ? (
              <Editor
                defaultLanguage="javascript"
                value={variants[selectedVariant] || generatedCode}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  readOnly: false,
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Code2 className={`w-12 h-12 mx-auto mb-4 ${
                    darkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Your component code will appear here
                  </p>
                </div>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}