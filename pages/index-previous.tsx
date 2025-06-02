import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Sparkles, 
  Code2, 
  Copy, 
  Download, 
  Loader2,
  Send,
  Check,
  Zap,
  Palette,
  Layers,
  ArrowRight,
  Github,
  Twitter,
  Menu,
  X,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import Editor from '@monaco-editor/react';
import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';

const EXAMPLE_PROMPTS = [
  { icon: "📊", text: "Dashboard with real-time analytics" },
  { icon: "🛍️", text: "E-commerce product gallery" },
  { icon: "💳", text: "Modern pricing cards" },
  { icon: "🎯", text: "Landing page hero section" },
  { icon: "📝", text: "Multi-step form wizard" }
];

const VARIANTS = [
  { name: "Modern", icon: <Sparkles className="w-4 h-4" />, style: "Clean and minimalist" },
  { name: "Bold", icon: <Zap className="w-4 h-4" />, style: "Vibrant and dynamic" },
  { name: "Elegant", icon: <Palette className="w-4 h-4" />, style: "Sophisticated and refined" }
];

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [copied, setCopied] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Streaming generation with variants
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedCode('');
    setVariants([]);
    setStreamingText('');
    setSelectedVariant(0);

    try {
      const response = await fetch('/api/generate-ui-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, variants: 3 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate component');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const variantCodes: string[] = ['', '', ''];

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
                  setStreamingText(prev => prev + data.content);
                }
                
                if (data.type === 'variant_complete') {
                  variantCodes[data.variant] = data.code;
                  setVariants([...variantCodes.filter(c => c)]);
                  if (data.variant === 0) {
                    setGeneratedCode(data.code);
                  }
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
      
      toast.success('Components generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
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
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const code = variants[selectedVariant] || generatedCode;
    if (!code) return;
    
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${VARIANTS[selectedVariant].name.toLowerCase()}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  const deviceFrames = {
    desktop: "w-full h-full",
    tablet: "max-w-[768px] max-h-[1024px] mx-auto",
    mobile: "max-w-[375px] max-h-[667px] mx-auto"
  };

  return (
    <>
      <Head>
        <title>VRUX - Professional AI UI Generator</title>
        <meta name="description" content="Generate production-ready React components with AI. Build beautiful UIs 10x faster." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b bg-white/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl">VRUX</span>
                </Link>
                
                <div className="hidden md:flex items-center gap-6">
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Examples</a>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Docs</a>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  <Twitter className="w-5 h-5" />
                </a>
                <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Sign In
                </button>
              </div>

              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:radial-gradient(ellipse_at_center,transparent,white)]"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>GPT-4 Powered</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                Ship UI faster than
                <span className="relative">
                  <span className="relative z-10"> ever before</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 2 100 2 150 10C200 2 250 2 298 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Describe your component and watch AI generate production-ready React code with Tailwind CSS. 
                Get multiple design variations instantly.
              </p>

              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all hover:scale-105 flex items-center gap-2"
                >
                  Start Building
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  View Examples
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Generator */}
        <section id="generator" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Input Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto mb-12"
            >
              <h2 className="text-3xl font-bold text-center mb-8">What would you like to build?</h2>
              
              {/* Example Prompts */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example.text)}
                    className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                  >
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{example.icon}</span>
                    <span className="text-xs text-gray-600">{example.text}</span>
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                  placeholder="Describe your UI component in detail..."
                  className="w-full px-4 py-4 pr-24 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 resize-none"
                  rows={3}
                  disabled={isGenerating}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="absolute right-2 bottom-2 px-4 py-2 bg-black text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Streaming Preview */}
            <AnimatePresence>
              {isGenerating && streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-5xl mx-auto mb-8"
                >
                  <div className="bg-gray-900 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm text-gray-400">Generating component...</span>
                    </div>
                    <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                      <code>{streamingText}</code>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {variants.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-7xl mx-auto"
                >
                  {/* Variant Selector */}
                  {variants.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                      {VARIANTS.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariant(index)}
                          disabled={!variants[index]}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedVariant === index 
                              ? 'bg-black text-white' 
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                          } ${!variants[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            {variant.icon}
                            <span>{variant.name}</span>
                          </div>
                          <span className="text-xs opacity-70">{variant.style}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Display */}
                  <Tabs.Root defaultValue="preview" className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <Tabs.List className="flex border-b">
                      <Tabs.Trigger value="preview" className="flex-1 px-4 py-3 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-black transition-all">
                        Preview
                      </Tabs.Trigger>
                      <Tabs.Trigger value="code" className="flex-1 px-4 py-3 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-black transition-all">
                        Code
                      </Tabs.Trigger>
                    </Tabs.List>

                    <div className="p-4">
                      {/* Action Bar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {/* Device Selector */}
                          <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => setDeviceView('desktop')}
                              className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                            >
                              <Monitor className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeviceView('tablet')}
                              className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-white shadow-sm' : ''}`}
                            >
                              <Tablet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeviceView('mobile')}
                              className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                            >
                              <Smartphone className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            Copy
                          </button>
                          <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </button>
                        </div>
                      </div>

                      <Tabs.Content value="preview">
                        <div className={`bg-gray-50 rounded-xl p-8 min-h-[400px] ${deviceFrames[deviceView]}`}>
                          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                            <LiveProvider 
                              code={variants[selectedVariant] || generatedCode} 
                              scope={{ React, useState: React.useState, useEffect: React.useEffect, useRef: React.useRef }}
                              noInline={false}
                            >
                              <LiveError className="text-red-500 text-sm mb-4" />
                              <LivePreview />
                            </LiveProvider>
                          </div>
                        </div>
                      </Tabs.Content>

                      <Tabs.Content value="code">
                        <div className="h-[600px] border border-gray-200 rounded-xl overflow-hidden">
                          <Editor
                            defaultLanguage="javascript"
                            value={variants[selectedVariant] || generatedCode}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              wordWrap: 'on',
                              lineNumbers: 'on',
                              folding: true,
                              readOnly: true,
                            }}
                          />
                        </div>
                      </Tabs.Content>
                    </div>
                  </Tabs.Root>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Built for modern developers</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Generate complete components in seconds with streaming responses</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Multiple Variants</h3>
                <p className="text-gray-600">Get 3 unique design variations for every component</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
                <p className="text-gray-600">Clean, accessible React code with Tailwind CSS</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">VRUX</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <a href="#" className="hover:text-gray-900">Privacy</a>
                <a href="#" className="hover:text-gray-900">Terms</a>
                <a href="#" className="hover:text-gray-900">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />

      <style jsx global>{`
        .bg-grid-gray-100 {
          background-image: 
            linear-gradient(to right, #f3f4f6 1px, transparent 1px),
            linear-gradient(to bottom, #f3f4f6 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
    </>
  );
};

export default Home;
