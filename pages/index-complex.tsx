import { useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { useStore } from '../lib/store';
import type { GenerateUIResponse, GenerateUIError } from '../lib/types';
import * as Tabs from '@radix-ui/react-tabs';
import { Code2, Eye, History as HistoryIcon, Sparkles } from 'lucide-react';

// Dynamic imports for better performance
const EnhancedAIChat = dynamic(() => import('../components/enhanced-ai-chat'), {
  ssr: true
});

const EnhancedPreview = dynamic(() => import('../components/enhanced-preview'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )
});

const CodeEditor = dynamic(() => import('../components/code-editor'), {
  ssr: false
});

const VariantSelector = dynamic(() => import('../components/variant-selector'), {
  ssr: true
});

const CommandPalette = dynamic(() => import('../components/command-palette'), {
  ssr: false
});

const HistoryTimeline = dynamic(() => import('../components/history-timeline'), {
  ssr: false
});

const Home: NextPage = () => {
  const {
    currentVariants,
    selectedVariant,
    setCurrentVariants,
    selectVariant,
    isGenerating,
    setIsGenerating,
    streamingContent,
    setStreamingContent,
    addMessage,
    pushToHistory,
    selectedTab,
    setSelectedTab,
    commandPaletteOpen,
    setCommandPaletteOpen,
  } = useStore();

  const handleGenerate = async (prompt: string, options?: { variants?: number; stream?: boolean }): Promise<void> => {
    setIsGenerating(true);
    setStreamingContent('');
    setCurrentVariants([]);
    
    try {
      if (options?.stream) {
        // Streaming response
        const res = await fetch('/api/generate-ui-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, variants: options.variants || 3 }),
        });

        if (!res.ok) {
          throw new Error('Failed to generate UI');
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        const variants: string[] = ['', '', ''];

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
                  
                  switch (data.type) {
                    case 'variant_start':
                      // Variant start marker - no action needed
                      break;
                    case 'content':
                      variants[data.variant] += data.content;
                      if (data.variant === 0) {
                        setStreamingContent(variants[0]);
                      }
                      break;
                    case 'variant_complete':
                      const newVariant = {
                        id: Math.random().toString(36).substr(2, 9),
                        prompt,
                        code: data.code,
                        timestamp: new Date(),
                        variant: data.variant
                      };
                      
                      const updated = [...currentVariants];
                      updated[data.variant] = newVariant;
                      setCurrentVariants(updated);
                      
                      if (data.variant === 0) {
                        pushToHistory(newVariant);
                      }
                      break;
                    case 'done':
                      addMessage({
                        role: 'assistant',
                        content: `Generated ${variants.filter(v => v.length > 0).length} component variations!`,
                        components: currentVariants
                      });
                      break;
                    case 'error':
                      throw new Error(data.error);
                  }
                } catch {
                  // Error parsing SSE data
                }
              }
            }
          }
        }
      } else {
        // Regular response (fallback)
        const res = await fetch('/api/generate-ui', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        
        const data: GenerateUIResponse | GenerateUIError = await res.json();
        
        if (!res.ok) {
          throw new Error((data as GenerateUIError).error || 'Failed to generate UI');
        }
        
        const component = {
          id: Math.random().toString(36).substr(2, 9),
          prompt,
          code: (data as GenerateUIResponse).code,
          timestamp: new Date(),
        };
        
        setCurrentVariants([component]);
        pushToHistory(component);
        
        addMessage({
          role: 'assistant',
          content: 'Component generated successfully!',
          components: [component]
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate UI');
      addMessage({
        role: 'assistant',
        content: '❌ Failed to generate component. Please try again.',
      });
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
    }
  };

  const handleElementClick = (element: Element) => {
    // Get element details for targeted modifications
    const tagName = element.tagName.toLowerCase();
    const classes = element.className;
    
    toast(`Selected: <${tagName}> ${classes ? `class="${classes}"` : ''}`, {
      icon: '🎯',
      duration: 2000,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setCommandPaletteOpen(true);
            break;
          case '/':
            e.preventDefault();
            setSelectedTab(selectedTab === 'preview' ? 'code' : 'preview');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTab, setCommandPaletteOpen, setSelectedTab]);

  return (
    <>
      <Head>
        <title>VRUX - AI UI Generator | Create React Components Instantly</title>
        <meta name="description" content="Generate production-ready React components with Tailwind CSS using AI. Describe your UI and get instant, customizable code." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="VRUX - AI UI Generator" />
        <meta property="og:description" content="Generate production-ready React components with AI" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VRUX - AI UI Generator" />
        <meta name="twitter:description" content="Generate production-ready React components with AI" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
        </div>

        {/* Header */}
        <header className="glass border-b border-white/20 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-medium hover-glow cursor-pointer">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="font-bold text-2xl">VRUX</span>
              </div>
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-sm font-medium hover:text-purple-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-purple-600 transition-colors">How it Works</a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-purple-600 transition-colors">GitHub</a>
                <Button variant="outline" size="sm" className="ml-4">
                  Sign In
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12 relative z-10">
          {/* Hero Section */}
          <section className="text-center space-y-8 pt-12 pb-20 animate-slide-up">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-purple-200/20 text-sm font-medium">
              <span className="animate-pulse mr-2">✨</span>
              <span className="text-gradient">Powered by GPT-4</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Build UI Components
              <br />
              <span className="text-gradient">10x Faster with AI</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your ideas into production-ready React components with a single prompt. 
              No more boilerplate, just pure creativity powered by artificial intelligence.
            </p>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button size="lg" className="gradient-primary text-white hover-lift shadow-large">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="hover-lift">
                View Examples
              </Button>
            </div>
          </section>

          {/* Generator Section */}
          <section className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="glass rounded-3xl p-8 md:p-12 shadow-large border border-white/20">
              <EnhancedAIChat onGenerate={handleGenerate} />
            </div>
            
            {/* Streaming Preview */}
            {isGenerating && streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 shadow-large border border-white/20"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="animate-pulse">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm text-gray-600">AI is generating your component...</span>
                </div>
                <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {streamingContent}
                </pre>
              </motion.div>
            )}
            
            {/* Generated Components */}
            {currentVariants.length > 0 && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Variant Selector */}
                {currentVariants.length > 1 && (
                  <VariantSelector
                    variants={currentVariants.map(v => v.code)}
                    selectedIndex={selectedVariant}
                    onSelect={selectVariant}
                  />
                )}

                {/* Tabbed Interface */}
                <Tabs.Root 
                  value={selectedTab} 
                  onValueChange={(value) => setSelectedTab(value as 'preview' | 'code' | 'history')}
                  className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/20"
                >
                  <Tabs.List className="flex items-center bg-gray-900/95 backdrop-blur-xl px-2 py-2">
                    <Tabs.Trigger
                      value="preview"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="code"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Code</span>
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="history"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white"
                    >
                      <HistoryIcon className="w-4 h-4" />
                      <span>History</span>
                    </Tabs.Trigger>
                  </Tabs.List>

                  <AnimatePresence mode="wait">
                    <Tabs.Content value="preview" className="focus:outline-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EnhancedPreview 
                          code={currentVariants[selectedVariant]?.code || ''}
                          variant={selectedVariant}
                          onElementClick={handleElementClick}
                        />
                      </motion.div>
                    </Tabs.Content>

                    <Tabs.Content value="code" className="focus:outline-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CodeEditor 
                          code={currentVariants[selectedVariant]?.code || ''}
                          language="javascript"
                          readOnly
                        />
                      </motion.div>
                    </Tabs.Content>

                    <Tabs.Content value="history" className="focus:outline-none p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HistoryTimeline />
                      </motion.div>
                    </Tabs.Content>
                  </AnimatePresence>
                </Tabs.Root>
              </motion.div>
            )}
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 space-y-16">
            <div className="text-center space-y-4 animate-slide-up">
              <h2 className="text-4xl md:text-5xl font-bold">
                Why Developers <span className="text-gradient">Love VRUX</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built for modern developers who value speed, quality, and innovation
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="⚡"
                title="Lightning Fast"
                description="Generate complete components in seconds. Our AI understands context and creates exactly what you need."
                gradient="from-yellow-400 to-orange-500"
              />
              <FeatureCard
                icon="🎨"
                title="Production Ready"
                description="Get clean, accessible React code with Tailwind CSS. Every component follows best practices."
                gradient="from-purple-400 to-pink-500"
              />
              <FeatureCard
                icon="🔧"
                title="Fully Customizable"
                description="Generated code is yours to modify. No vendor lock-in, just pure React components."
                gradient="from-blue-400 to-cyan-500"
              />
            </div>
          </section>

          {/* How it Works */}
          <section id="how-it-works" className="py-20 space-y-16">
            <div className="text-center space-y-4 animate-slide-up">
              <h2 className="text-4xl md:text-5xl font-bold">
                How It <span className="text-gradient">Works</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Three simple steps to transform your ideas into code
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <StepCard
                number={1}
                title="Describe Your Vision"
                description="Tell us what you want in plain English. Be as detailed or as simple as you like."
                color="purple"
              />
              <StepCard
                number={2}
                title="AI Creates Magic"
                description="Our AI understands your needs and generates clean, modern React components instantly."
                color="pink"
              />
              <StepCard
                number={3}
                title="Ship It"
                description="Copy, customize, and integrate the code directly into your project. It's that simple."
                color="blue"
              />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="glass border-t border-white/20 mt-32">
          <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
                <span className="font-semibold text-lg">VRUX</span>
                <span className="text-gray-600">© 2024</span>
              </div>
              <div className="flex items-center space-x-8 text-sm">
                <a href="/privacy" className="hover:text-purple-600 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-purple-600 transition-colors">Terms</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">Twitter</a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#1F2937',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#1F2937',
            },
          },
        }}
      />
    </>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-8 hover-lift border border-white/20 group animate-slide-up">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-medium`}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-xl mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Step Card Component
interface StepCardProps {
  number: number;
  title: string;
  description: string;
  color: string;
}

function StepCard({ number, title, description, color }: StepCardProps) {
  const colorClasses = {
    purple: 'from-purple-400 to-purple-600',
    pink: 'from-pink-400 to-pink-600',
    blue: 'from-blue-400 to-blue-600'
  };

  return (
    <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: `${number * 0.1}s` }}>
      <div className={`w-20 h-20 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-large hover-glow`}>
        {number}
      </div>
      <h3 className="font-semibold text-xl">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default Home; 