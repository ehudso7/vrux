import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Sparkles, 
  Code2, 
  Copy, 
  Download, 
  Loader2,
  Send,
  Check
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as React from 'react';

const EXAMPLE_PROMPTS = [
  "Modern dashboard with analytics cards",
  "E-commerce product card with hover effects",
  "Pricing table with gradient backgrounds",
  "Hero section with animated text",
  "Contact form with validation"
];

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedCode('');
    setShowCode(false);

    try {
      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate component');
      }

      const data = await response.json();
      setGeneratedCode(data.code);
      toast.success('Component generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    if (!generatedCode) return;
    
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component.jsx';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Component downloaded!');
  };

  return (
    <>
      <Head>
        <title>VRUX - AI UI Generator</title>
        <meta name="description" content="Generate React components with AI" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">VRUX</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              Build UI Components
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                10x Faster with AI
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Describe what you want to build and get production-ready React components instantly
            </motion.p>
          </div>

          {/* Generator Section */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="space-y-4">
                {/* Example Prompts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="Describe your UI component..."
                    className="w-full px-4 py-3 pr-32 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Generated Code Section */}
            <AnimatePresence>
              {generatedCode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  {/* Toolbar */}
                  <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-400">component.jsx</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCode(!showCode)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {showCode ? 'Hide' : 'Show'} Code
                      </button>
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Code Display */}
                  {showCode && (
                    <div className="bg-gray-900 p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300 font-mono">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>
                  )}

                  {/* Live Preview */}
                  <div className="p-8 bg-gray-50">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <LiveProvider 
                        code={generatedCode} 
                        scope={{ React, useState: React.useState, useEffect: React.useEffect, useRef: React.useRef }}
                        noInline={false}
                      >
                        <LiveError className="text-red-500 p-4 bg-red-50 rounded-lg mb-4" />
                        <LivePreview />
                      </LiveProvider>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </>
  );
};

export default Home;