import { useState, useRef, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../lib/auth-context';
import { Footer } from '../components/navigation/Footer';

import { 
  Sparkles, 
  Code2, 
  Copy, 
  Download, 
  Send,
  Check,
  Zap,
  Palette,
  Layers,
  ArrowRight,
  Github,
  Menu,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Share2,
  Star,
  MessageSquare,
  Command,
  FileCode,
  Wand2,
  Sparkle,
  Globe,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import Editor from '@monaco-editor/react';
import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';

const EXAMPLE_PROMPTS = [
  { 
    icon: "📊", 
    text: "Dashboard with charts", 
    fullText: "Create a modern analytics dashboard with animated charts, KPI cards, and a sidebar navigation",
    category: "Analytics"
  },
  { 
    icon: "🛍️", 
    text: "Product gallery", 
    fullText: "Design an e-commerce product gallery with filters, sorting, and quick view modal",
    category: "E-commerce"
  },
  { 
    icon: "💳", 
    text: "Pricing cards", 
    fullText: "Build modern pricing cards with feature lists, highlighted plan, and smooth hover effects",
    category: "Marketing"
  },
  { 
    icon: "🎯", 
    text: "Hero section", 
    fullText: "Create a stunning hero section with animated text, CTA buttons, and background patterns",
    category: "Landing"
  },
  { 
    icon: "📝", 
    text: "Multi-step form", 
    fullText: "Design a multi-step form wizard with progress indicator and validation",
    category: "Forms"
  },
  { 
    icon: "💬", 
    text: "Chat interface", 
    fullText: "Build a modern chat UI with message bubbles, typing indicators, and reactions",
    category: "Communication"
  },
  { 
    icon: "📋", 
    text: "Kanban board", 
    fullText: "Create a drag-and-drop Kanban board with columns and task cards",
    category: "Productivity"
  },
  { 
    icon: "🎨", 
    text: "Color picker", 
    fullText: "Design an advanced color picker with palettes and gradient support",
    category: "Tools"
  }
];

const VARIANTS = [
  { 
    id: 'modern',
    name: "Modern", 
    icon: <Sparkles className="w-4 h-4" />, 
    style: "Clean and minimalist",
    description: "Emphasizes whitespace, subtle shadows, and refined typography"
  },
  { 
    id: 'bold',
    name: "Bold", 
    icon: <Zap className="w-4 h-4" />, 
    style: "Vibrant and dynamic",
    description: "Features strong colors, bold typography, and energetic animations"
  },
  { 
    id: 'elegant',
    name: "Elegant", 
    icon: <Palette className="w-4 h-4" />, 
    style: "Sophisticated and refined",
    description: "Uses premium typography, subtle gradients, and luxurious spacing"
  }
];

const Home: NextPage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [copied, setCopied] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [livePreview, setLivePreview] = useState(true);
  const [generationHistory, setGenerationHistory] = useState<Array<{
    id: string;
    prompt: string;
    code: string;
    timestamp: Date;
    variant: string;
  }>>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Mouse tracking for gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setCommandPaletteOpen(true);
            break;
          case 'Enter':
            e.preventDefault();
            handleGenerate();
            break;
          case 'c':
            if (generatedCode) {
              e.preventDefault();
              handleCopy();
            }
            break;
          case '/':
            e.preventDefault();
            // Toggle between preview and code tabs if component is generated
            if (variants.length > 0 || generatedCode) {
              const tabsElement = document.querySelector('[role="tablist"]');
              if (tabsElement) {
                const currentTab = tabsElement.querySelector('[data-state="active"]');
                const isPreview = currentTab?.textContent?.includes('Preview');
                const targetTab = tabsElement.querySelector(
                  isPreview ? '[value="code"]' : '[value="preview"]'
                ) as HTMLElement;
                targetTab?.click();
              }
            }
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode, commandPaletteOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

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
              } catch {
                // Parse error - ignore
              }
            }
          }
        }
      }
      
      // Save to history
      if (autoSave && variantCodes[0]) {
        const historyEntry = {
          id: Date.now().toString(),
          prompt,
          code: variantCodes[0],
          timestamp: new Date(),
          variant: VARIANTS[0].name
        };
        setGenerationHistory(prev => [historyEntry, ...prev].slice(0, 50));
      }
      
      toast.success('Components generated successfully!', {
        duration: 3000,
        icon: '✨',
      });
    } catch (error) {
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

  const handleShare = async () => {
    const code = variants[selectedVariant] || generatedCode;
    if (!code) return;
    
    // In production, this would create a shareable link
    const shareUrl = `${window.location.origin}/share/${Date.now()}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!', {
        duration: 3000,
        icon: '🔗',
      });
    } catch {
      toast.error('Failed to create share link');
    }
  };

  const deviceFrames = {
    desktop: "w-full h-full",
    tablet: "max-w-[768px] max-h-[1024px] mx-auto",
    mobile: "max-w-[375px] max-h-[667px] mx-auto"
  };

  const backgroundGradient = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(600px at ${x}px ${y}px, rgba(139, 92, 246, 0.05), transparent 80%)`
  );

  return (
    <>
      <Head>
        <title>VRUX - Professional AI Component Generator</title>
        <meta name="description" content="Generate production-ready React components with AI. Build beautiful, accessible UIs 10x faster with multiple design variations." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="VRUX - AI Component Generator" />
        <meta property="og:description" content="Transform ideas into React components instantly" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://vrux.dev" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@vrux_dev" />
      </Head>

      <Tooltip.Provider delayDuration={200}>
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
          {/* Animated background */}
          <motion.div 
            className="fixed inset-0 pointer-events-none"
            style={{ background: backgroundGradient }}
          />

          {/* Navigation */}
          <nav className={`border-b ${darkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl sticky top-0 z-50`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/">
                  <motion.a 
                    className="flex items-center gap-2 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-9 h-9 ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">VRUX</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">BETA</span>
                  </motion.a>
                </Link>
                  
                  <div className="hidden md:flex items-center gap-1">
                    <Link href="/examples">
                      <a className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}>
                        Examples
                      </a>
                    </Link>
                    <Link href="/templates">
                      <a className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}>
                        Templates
                      </a>
                    </Link>
                    <Link href="/docs">
                      <a className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}>
                        Docs
                      </a>
                    </Link>
                    <Link href="/pricing">
                      <a className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        darkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}>
                        Pricing
                      </a>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => setCommandPaletteOpen(true)}
                        className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-sm ${
                          darkMode 
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        } rounded-lg transition-all`}
                      >
                        <Command className="w-3.5 h-3.5" />
                        <span>⌘K</span>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content 
                      side="bottom" 
                      className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                    >
                      Command Palette
                    </Tooltip.Content>
                  </Tooltip.Root>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className={`p-2 rounded-lg ${
                        darkMode 
                          ? 'hover:bg-gray-800 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-600'
                      } transition-colors`}>
                        <Settings className="w-5 h-5" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        className={`${
                          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                        } border rounded-xl shadow-lg p-2 min-w-[200px] animate-in fade-in slide-in-from-top-2`}
                      >
                        <DropdownMenu.Item className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <span className="text-sm">Dark Mode</span>
                          <Switch.Root
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                            className="w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors"
                          >
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4.5" />
                          </Switch.Root>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <span className="text-sm">Auto Save</span>
                          <Switch.Root
                            checked={autoSave}
                            onCheckedChange={setAutoSave}
                            className="w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors"
                          >
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4.5" />
                          </Switch.Root>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <span className="text-sm">Live Preview</span>
                          <Switch.Root
                            checked={livePreview}
                            onCheckedChange={setLivePreview}
                            className="w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors"
                          >
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4.5" />
                          </Switch.Root>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator className="my-2 border-t border-gray-200 dark:border-gray-800" />
                        
                        <DropdownMenu.Item 
                          onSelect={() => setHistoryOpen(true)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-sm">History</span>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                          <HelpCircle className="w-4 h-4" />
                          <span className="text-sm">Help & Feedback</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>

                  <div className="hidden md:flex items-center gap-2">
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <a 
                          href="https://github.com/ehudso7/vrux" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg ${
                            darkMode 
                              ? 'hover:bg-gray-800 text-gray-400' 
                              : 'hover:bg-gray-100 text-gray-600'
                          } transition-colors`}
                        >
                          <Github className="w-5 h-5" />
                        </a>
                      </Tooltip.Trigger>
                      <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                        View on GitHub
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </div>

                  {user ? (
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                        >
                          {user.name || user.email.split('@')[0]}
                        </motion.button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className={`w-56 p-2 rounded-lg shadow-lg ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
                        >
                          <DropdownMenu.Item asChild>
                            <Link
                              href="/dashboard"
                              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors cursor-pointer"`}
                            >
                              <Monitor className="w-4 h-4" />
                              Dashboard
                            </Link>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item asChild>
                            <Link
                              href="/settings"
                              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors cursor-pointer"`}
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className={`my-2 h-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                          <DropdownMenu.Item
                            onSelect={() => signOut()}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors cursor-pointer"`}
                          >
                            <X className="w-4 h-4" />
                            Sign Out
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/signin')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
                    >
                      Sign In
                    </motion.button>
                  )}

                  <button
                    className="md:hidden p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`md:hidden border-b ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <div className="px-4 py-4 space-y-2">
                  <Link href="/examples">
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                        darkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}
                    >
                      Examples
                    </a>
                  </Link>
                  <Link href="/templates">
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                        darkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}
                    >
                      Templates
                    </a>
                  </Link>
                  <Link href="/docs">
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                        darkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}
                    >
                      Docs
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                        darkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } transition-all`}
                    >
                      Pricing
                    </a>
                  </Link>
                  <button
                    onClick={() => {
                      setCommandPaletteOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg ${
                      darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } transition-all flex items-center gap-2`}
                  >
                    <Command className="w-4 h-4" />
                    Command Palette
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${darkMode ? 'rgb(75 85 99 / 0.3)' : 'rgb(209 213 219)'} 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }} />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-4xl mx-auto"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-sm font-medium mb-8"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Powered by GPT-4 Turbo
                  </span>
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                  <span className="block">Ship UI components</span>
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-300%">
                      10x faster with AI
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                      <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        d="M2 10C50 2 100 2 150 10C200 2 250 2 298 10" 
                        stroke="url(#gradient)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#9333EA" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#9333EA" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Transform your ideas into production-ready React components. Get multiple design variations, 
                  live preview, and clean code that just works.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium shadow-2xl shadow-black/25 hover:shadow-black/30 transition-all flex items-center gap-3"
                  >
                    Start Building
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/templates')}
                    className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-all flex items-center gap-3"
                  >
                    <Layers className="w-5 h-5" />
                    Browse Templates
                  </motion.button>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>4.9/5 rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>50k+ components generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Used by developers worldwide</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Main Generator */}
          <section id="generator" className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Input Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto mb-12"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">What would you like to build today?</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Describe your component and let AI do the heavy lifting
                  </p>
                </div>
                
                {/* Category Pills */}
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : darkMode 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {['Analytics', 'E-commerce', 'Marketing', 'Forms'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : darkMode 
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Example Prompts Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {EXAMPLE_PROMPTS
                    .filter(ex => !selectedCategory || ex.category === selectedCategory)
                    .slice(0, 8)
                    .map((example, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setPrompt(example.fullText);
                        setTimeout(() => handleGenerate(), 100);
                      }}
                      className={`group p-4 ${
                        darkMode 
                          ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      } rounded-xl border hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all text-left`}
                    >
                      <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{example.icon}</span>
                      <span className="text-sm font-medium block mb-1">{example.text}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{example.category}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Main Input */}
                <div className={`relative ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-2xl shadow-xl border ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                } focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all`}>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Describe your UI component in detail... (⌘+Enter to generate)"
                    className={`w-full px-6 py-5 pr-32 bg-transparent outline-none resize-none text-lg ${
                      darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
                    }`}
                    rows={1}
                    disabled={isGenerating}
                  />
                  
                  <div className="absolute right-4 bottom-4 flex items-center gap-2">
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button 
                          onClick={async () => {
                            if (!prompt.trim()) {
                              toast.error('Please enter a prompt first');
                              return;
                            }
                            
                            const enhancedPrompt = `Create a ${prompt}. Make it modern, visually appealing with excellent UX. Include proper animations, hover states, and ensure it's fully responsive. Use modern design patterns and best practices.`;
                            setPrompt(enhancedPrompt);
                            toast.success('Prompt enhanced!', {
                              duration: 2000,
                              icon: '✨',
                            });
                          }}
                          className={`p-2 rounded-lg ${
                            darkMode 
                              ? 'hover:bg-gray-700 text-gray-400' 
                              : 'hover:bg-gray-100 text-gray-500'
                          } transition-colors`}
                        >
                          <Wand2 className="w-5 h-5" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Content side="top" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                        AI Enhance Prompt
                      </Tooltip.Content>
                    </Tooltip.Root>
                    
                    <motion.button
                      onClick={handleGenerate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!prompt.trim() || isGenerating}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
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
                    </motion.button>
                  </div>
                  
                  {/* Character count */}
                  <div className="absolute left-6 bottom-4 text-xs text-gray-400">
                    {prompt.length}/1000
                  </div>
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[10px] font-mono">⌘</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[10px] font-mono">Enter</kbd>
                    <span className="ml-1">to generate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[10px] font-mono">⌘</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[10px] font-mono">K</kbd>
                    <span className="ml-1">for commands</span>
                  </div>
                </div>
              </motion.div>

              {/* Streaming Preview */}
              <AnimatePresence>
                {isGenerating && streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-6xl mx-auto mb-8"
                  >
                    <div className={`${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-2xl shadow-2xl border overflow-hidden`}>
                      <div className={`px-6 py-4 border-b ${
                        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Sparkle className="w-4 h-4 text-purple-500 animate-pulse" />
                            AI is crafting your component...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                }}
                                className="w-2 h-2 bg-purple-500 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <pre className={`text-sm font-mono overflow-x-auto ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <code>{streamingText}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results Section */}
              <AnimatePresence mode="wait">
                {variants.length > 0 && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-7xl mx-auto"
                  >
                    {/* Variant Selector */}
                    {variants.length > 1 && (
                      <div className="flex items-center justify-center gap-3 mb-8">
                        {VARIANTS.map((variant, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedVariant(index)}
                            disabled={!variants[index]}
                            className={`group relative px-6 py-3 rounded-xl font-medium transition-all ${
                              selectedVariant === index 
                                ? darkMode
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                  : 'bg-black text-white shadow-lg shadow-black/25'
                                : darkMode
                                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            } ${!variants[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`${selectedVariant === index ? 'text-white' : ''}`}>
                                {variant.icon}
                              </span>
                              <div className="text-left">
                                <div className="font-semibold">{variant.name}</div>
                                <div className={`text-xs ${
                                  selectedVariant === index 
                                    ? 'text-white/80' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {variant.style}
                                </div>
                              </div>
                            </div>
                            {selectedVariant === index && (
                              <motion.div 
                                layoutId="variant-indicator"
                                className="absolute inset-0 border-2 border-purple-400 dark:border-purple-500 rounded-xl pointer-events-none"
                              />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Main Display */}
                    <motion.div
                      layout
                      className={`${
                        fullscreen ? 'fixed inset-0 z-50' : ''
                      }`}
                    >
                      <Tabs.Root 
                        defaultValue="preview" 
                        className={`${
                          darkMode ? 'bg-gray-800' : 'bg-white'
                        } rounded-2xl shadow-2xl overflow-hidden border ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <div className={`flex items-center justify-between px-6 py-3 border-b ${
                          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <Tabs.List className="flex items-center gap-1">
                            <Tabs.Trigger 
                              value="preview" 
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                                darkMode ? 'bg-gray-800' : 'bg-white'
                              } data-[state=active]:shadow-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                              </div>
                            </Tabs.Trigger>
                            <Tabs.Trigger 
                              value="code" 
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                                darkMode ? 'bg-gray-800' : 'bg-white'
                              } data-[state=active]:shadow-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4" />
                                Code
                              </div>
                            </Tabs.Trigger>
                          </Tabs.List>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Device Selector */}
                            <div className={`flex items-center ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            } rounded-lg p-1`}>
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
                                            ? 'bg-gray-700 text-white shadow-sm' 
                                            : 'bg-white shadow-sm'
                                          : darkMode
                                            ? 'text-gray-400 hover:text-white'
                                            : 'text-gray-500 hover:text-gray-900'
                                      }`}
                                    >
                                      <device.icon className="w-4 h-4" />
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                    {device.id.charAt(0).toUpperCase() + device.id.slice(1)} view
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              ))}
                            </div>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />

                            {/* Actions */}
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  onClick={() => setShowGrid(!showGrid)}
                                  className={`p-2 rounded-lg ${
                                    showGrid 
                                      ? darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                      : ''
                                  } ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-400' 
                                      : 'hover:bg-gray-100 text-gray-600'
                                  } transition-colors`}
                                >
                                  <Globe className="w-4 h-4" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                Toggle grid
                              </Tooltip.Content>
                            </Tooltip.Root>

                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  onClick={() => setFullscreen(!fullscreen)}
                                  className={`p-2 rounded-lg ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-400' 
                                      : 'hover:bg-gray-100 text-gray-600'
                                  } transition-colors`}
                                >
                                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                              </Tooltip.Content>
                            </Tooltip.Root>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />

                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  onClick={handleCopy}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-300' 
                                      : 'hover:bg-gray-100 text-gray-700'
                                  } transition-all flex items-center gap-2`}
                                >
                                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                  {copied ? 'Copied!' : 'Copy'}
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                Copy code (⌘C)
                              </Tooltip.Content>
                            </Tooltip.Root>

                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  onClick={handleDownload}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-300' 
                                      : 'hover:bg-gray-100 text-gray-700'
                                  } transition-all flex items-center gap-2`}
                                >
                                  <Download className="w-4 h-4" />
                                  Export
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                Download component
                              </Tooltip.Content>
                            </Tooltip.Root>

                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  onClick={handleShare}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-300' 
                                      : 'hover:bg-gray-100 text-gray-700'
                                  } transition-all flex items-center gap-2`}
                                >
                                  <Share2 className="w-4 h-4" />
                                  Share
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                Share component
                              </Tooltip.Content>
                            </Tooltip.Root>
                          </div>
                        </div>

                        <Tabs.Content value="preview" className="focus:outline-none">
                          <div className={`${fullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'} ${
                            darkMode ? 'bg-gray-900' : 'bg-gray-50'
                          } p-8 overflow-auto`}
                            style={{
                              backgroundImage: showGrid 
                                ? `radial-gradient(circle at 1px 1px, ${
                                    darkMode ? 'rgb(75 85 99 / 0.3)' : 'rgb(209 213 219)'
                                  } 1px, transparent 1px)`
                                : 'none',
                              backgroundSize: '20px 20px'
                            }}
                          >
                            <div className={`${deviceFrames[deviceView]} h-full`}>
                              <div className={`${
                                darkMode ? 'bg-gray-950' : 'bg-white'
                              } rounded-xl shadow-2xl p-8 h-full overflow-auto`}>
                                {livePreview ? (
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
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                      <EyeOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                      <p>Live preview disabled</p>
                                      <button 
                                        onClick={() => setLivePreview(true)}
                                        className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                                      >
                                        Enable preview
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Tabs.Content>

                        <Tabs.Content value="code" className="focus:outline-none">
                          <div className={`${fullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
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
                          </div>
                        </Tabs.Content>
                      </Tabs.Root>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Features */}
          <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Everything you need to ship faster</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Professional tools and features designed for modern developers
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Zap className="w-6 h-6" />,
                    title: "Lightning Fast",
                    description: "Generate complete components in seconds with real-time streaming",
                    color: "from-yellow-400 to-orange-500"
                  },
                  {
                    icon: <Layers className="w-6 h-6" />,
                    title: "Multiple Variants",
                    description: "Get 3 unique design variations for every component you generate",
                    color: "from-purple-400 to-pink-500"
                  },
                  {
                    icon: <Code2 className="w-6 h-6" />,
                    title: "Production Ready",
                    description: "Clean, accessible React code with modern best practices built-in",
                    color: "from-blue-400 to-cyan-500"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative p-8 rounded-2xl ${
                      darkMode ? 'bg-gray-900' : 'bg-gray-50'
                    } hover:shadow-xl transition-all`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <Footer darkMode={darkMode} />
        </div>

        {/* Command Palette */}
        <Dialog.Root open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
            <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  className="w-full px-4 py-2 bg-transparent outline-none text-lg"
                  autoFocus
                />
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="mb-2">
                  <p className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quick Actions
                  </p>
                  {[
                    { icon: <FileCode className="w-4 h-4" />, label: 'New Component', shortcut: '⌘N' },
                    { icon: <Copy className="w-4 h-4" />, label: 'Copy Code', shortcut: '⌘C' },
                    { icon: <Download className="w-4 h-4" />, label: 'Export Component', shortcut: '⌘S' },
                    { icon: <Share2 className="w-4 h-4" />, label: 'Share Component', shortcut: '⌘⇧S' },
                  ].map((action, index) => (
                    <button
                      key={index}
                      className="w-full px-3 py-2 flex items-center justify-between rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400">{action.icon}</span>
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {action.shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* History Dialog */}
        <Dialog.Root open={historyOpen} onOpenChange={setHistoryOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
            <Dialog.Content className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-4xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold">Generation History</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Your recent component generations
                </p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {generationHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No generation history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generationHistory.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-xl border ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        } hover:shadow-md transition-all cursor-pointer`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{item.prompt}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(item.timestamp).toLocaleString()} • {item.variant} variant
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: darkMode ? 'dark' : '',
            style: {
              background: darkMode ? '#1F2937' : '#FFFFFF',
              color: darkMode ? '#F3F4F6' : '#111827',
              border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        />

        <style jsx global>{`
          @keyframes animate-gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          .bg-300\% {
            background-size: 300% 300%;
          }
          
          .animate-gradient {
            animation: animate-gradient 3s ease infinite;
          }
          
          .animate-in {
            animation: animate-in 0.2s ease-out;
          }
          
          .fade-in {
            animation: fade-in 0.2s ease-out;
          }
          
          .slide-in-from-top-2 {
            animation: slide-in-from-top-2 0.2s ease-out;
          }
          
          .slide-in-from-top-4 {
            animation: slide-in-from-top-4 0.2s ease-out;
          }
          
          @keyframes animate-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slide-in-from-top-2 {
            from { transform: translateY(-8px); }
            to { transform: translateY(0); }
          }
          
          @keyframes slide-in-from-top-4 {
            from { transform: translateY(-16px); }
            to { transform: translateY(0); }
          }
        `}</style>
      </Tooltip.Provider>
    </>
  );
};

export default Home;
