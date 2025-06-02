import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
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
  Palette,
  Terminal,
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Share2,
  Lightbulb,
  Package,
  Rocket,
  History,
  Layers,
  Shield,
  Gauge,
  CheckCircle,
  Activity,
  Heart,
  FolderOpen,
  Gamepad2,
  Brain,
  Sparkle,
  Menu,
  Wand2,
  Database,
  Files
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
// Removed unused imports: HoverCard, Badge
import { toast } from 'react-hot-toast';
import ModernChatMessage from './modern-chat-message';
import FileViewerModal from './file-viewer-modal';
import ModernPreview from './modern-preview';
import { CodeEditorSkeleton, PreviewSkeleton, FileTreeSkeleton } from './loading-skeleton';
import LoadingButton from './loading-button';
import { enhancePrompt, getPromptSuggestions } from '../lib/prompt-enhancer';
import AnimatedBackground from './animated-background';
import AnimatedVariantSelector from './animated-variant-selector';
import IntelligentChatInterface from './intelligent-chat-interface';
import DatabaseSchemaDesigner from './database-schema-designer';
import AuthBuilder from './auth-builder';
import DeploymentPanel from './deployment-panel';
import { MultiFileWorkspace } from './multi-file-workspace';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'file' | 'terminal' | 'step';
  content: string;
  timestamp: Date;
  variant?: number;
  metadata?: Record<string, unknown>;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  status?: 'pending' | 'creating' | 'created' | 'error';
  language?: string;
}

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  duration?: number;
  substeps?: GenerationStep[];
}

interface AdvancedGenerationInterfaceProps {
  darkMode: boolean;
}

const VARIANTS = [
  { 
    id: 'modern',
    name: "Modern", 
    icon: <Sparkles className="w-4 h-4" />, 
    style: "Clean and minimalist",
    color: "purple"
  },
  { 
    id: 'bold',
    name: "Bold", 
    icon: <Zap className="w-4 h-4" />, 
    style: "Vibrant and dynamic",
    color: "orange"
  },
  { 
    id: 'elegant',
    name: "Elegant", 
    icon: <Palette className="w-4 h-4" />, 
    style: "Sophisticated and refined",
    color: "blue"
  }
];

// Features comparison data (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FEATURES = {
  competitors: [
    { name: 'v0.dev', icon: <Sparkle className="w-4 h-4" />, features: ['Iterations', 'Fork & Share', 'Deploy to Vercel'] },
    { name: 'Lovable', icon: <Heart className="w-4 h-4" />, features: ['Supabase Integration', 'Full-stack', 'Git Sync'] },
    { name: 'Bolt', icon: <Zap className="w-4 h-4" />, features: ['WebContainers', 'NPM Support', 'Live Preview'] },
    { name: 'Cursor', icon: <Terminal className="w-4 h-4" />, features: ['AI Chat', 'Code Completion', 'Multi-file'] },
    { name: 'Replit', icon: <Package className="w-4 h-4" />, features: ['Multiplayer', 'Deployments', 'Database'] }
  ],
  unique: [
    { name: 'AI Explanations', icon: <Lightbulb className="w-4 h-4" />, description: 'Get detailed explanations of code decisions' },
    { name: 'Component Playground', icon: <Gamepad2 className="w-4 h-4" />, description: 'Interactive prop editor and state management' },
    { name: 'Version Control', icon: <GitBranch className="w-4 h-4" />, description: 'Built-in git-like version tracking' },
    { name: 'Performance Insights', icon: <Gauge className="w-4 h-4" />, description: 'Real-time performance metrics and optimization tips' },
    { name: 'Accessibility Audit', icon: <Shield className="w-4 h-4" />, description: 'Automatic accessibility checking and fixes' },
    { name: 'Design System Integration', icon: <Layers className="w-4 h-4" />, description: 'Connect to your design tokens and component library' }
  ]
};

export default function AdvancedGenerationInterface({ darkMode }: AdvancedGenerationInterfaceProps) {
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
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'files' | 'terminal' | 'ai' | 'database' | 'auth' | 'deploy' | 'project'>('preview');
  const [showMultiFileWorkspace, setShowMultiFileWorkspace] = useState(false);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [iterations, setIterations] = useState<string[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [fileTree, setFileTree] = useState<FileNode>({
    name: 'component',
    type: 'folder',
    children: []
  });
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: '1', title: 'Understanding Requirements', description: 'Analyzing your component needs', status: 'pending', icon: <Brain className="w-4 h-4" /> },
    { id: '2', title: 'Planning Architecture', description: 'Designing component structure', status: 'pending', icon: <GitBranch className="w-4 h-4" /> },
    { id: '3', title: 'Setting Up Environment', description: 'Creating necessary files', status: 'pending', icon: <Package className="w-4 h-4" /> },
    { id: '4', title: 'Writing Component Code', description: 'Implementing functionality', status: 'pending', icon: <Code2 className="w-4 h-4" /> },
    { id: '5', title: 'Adding Styles', description: 'Applying Tailwind CSS', status: 'pending', icon: <Palette className="w-4 h-4" /> },
    { id: '6', title: 'Optimizing Performance', description: 'Ensuring best practices', status: 'pending', icon: <Gauge className="w-4 h-4" /> },
    { id: '7', title: 'Accessibility Check', description: 'Adding ARIA labels', status: 'pending', icon: <Shield className="w-4 h-4" /> },
    { id: '8', title: 'Final Review', description: 'Quality assurance', status: 'pending', icon: <CheckCircle className="w-4 h-4" /> }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollTerminalToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollTerminalToBottom();
  }, [terminalOutput]);

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

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      setShowFileModal(true);
    }
  };

  const simulateFileCreation = async (fileName: string, content: string, delay: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Generate more realistic file content
    const fileContent = fileName.endsWith('.tsx') 
      ? `import React from 'react';\n\ninterface ${fileName.replace('.tsx', '')}Props {\n  // Component props\n}\n\nexport const ${fileName.replace('.tsx', '')} = (props: ${fileName.replace('.tsx', '')}Props) => {\n  return (\n    <div>\n      {/* Component implementation */}\n    </div>\n  );\n};`
      : fileName.endsWith('.css')
      ? `/* ${fileName} styles */\n\n.container {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n.header {\n  font-size: 1.5rem;\n  font-weight: bold;\n}`
      : fileName.endsWith('.ts')
      ? `// ${fileName} TypeScript definitions\n\nexport interface ComponentProps {\n  id: string;\n  title: string;\n  description?: string;\n  onClick?: () => void;\n}`
      : `// ${fileName} test file\n\nimport { render, screen } from '@testing-library/react';\nimport { Dashboard } from './Dashboard';\n\ndescribe('Dashboard', () => {\n  it('renders without crashing', () => {\n    render(<Dashboard />);\n    expect(screen.getByRole('main')).toBeInTheDocument();\n  });\n});`;
    
    setFileTree(prev => ({
      ...prev,
      children: [
        ...(prev.children || []),
        {
          name: fileName,
          type: 'file',
          content: fileContent,
          status: 'creating',
          language: fileName.endsWith('.tsx') ? 'typescript' : 
                   fileName.endsWith('.css') ? 'css' :
                   fileName.endsWith('.ts') ? 'typescript' : 'typescript'
        }
      ]
    }));

    const fileMessage: Message = {
      id: Date.now().toString() + '-file',
      type: 'file',
      content: `📁 Creating ${fileName}...`,
      timestamp: new Date(),
      metadata: { fileName, action: 'create' }
    };
    setMessages(prev => [...prev, fileMessage]);

    await new Promise(resolve => setTimeout(resolve, 500));

    setFileTree(prev => ({
      ...prev,
      children: prev.children?.map(child => 
        child.name === fileName ? { ...child, status: 'created' } : child
      )
    }));
  };

  const simulateTerminalCommand = async (command: string, output: string[]) => {
    const terminalMessage: Message = {
      id: Date.now().toString() + '-terminal',
      type: 'terminal',
      content: command,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, terminalMessage]);
    
    setTerminalOutput(prev => [...prev, `$ ${command}`]);
    
    for (const line of output) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setTerminalOutput(prev => [...prev, line]);
    }
  };

  const updateStep = async (stepId: string, status: GenerationStep['status'], duration?: number) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, duration } : step
    ));

    if (status === 'active') {
      const step = generationSteps.find(s => s.id === stepId);
      if (step) {
        const stepMessage: Message = {
          id: Date.now().toString() + '-step',
          type: 'step',
          content: `${step.title}: ${step.description}`,
          timestamp: new Date(),
          metadata: { step }
        };
        setMessages(prev => [...prev, stepMessage]);
      }
    }
  };

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
    setFileTree({ name: 'component', type: 'folder', children: [] });
    setTerminalOutput([]);
    setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'pending', duration: undefined })));

    // Simulate terminal commands
    await simulateTerminalCommand('npm create vrux-component@latest', [
      '⚡ Creating new VRUX component...',
      '📦 Installing dependencies...',
      '✨ Component scaffold created!'
    ]);

    // Simulate step-by-step process
    for (let i = 0; i < generationSteps.length; i++) {
      const step = generationSteps[i];
      await updateStep(step.id, 'active');
      
      if (i === 2) {
        // Create files during environment setup
        await simulateFileCreation('Dashboard.tsx', '// Main component file');
        await simulateFileCreation('Dashboard.module.css', '/* Component styles */');
        await simulateFileCreation('Dashboard.types.ts', '// TypeScript interfaces');
        await simulateFileCreation('Dashboard.test.tsx', '// Component tests');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      await updateStep(step.id, 'completed', 1000 + Math.random() * 1000);
    }

    // Add assistant thinking message
    const thinkingMessage: Message = {
      id: Date.now().toString() + '-thinking',
      type: 'assistant',
      content: 'I\'m designing your component with 3 unique variations, implementing best practices, and ensuring accessibility...',
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
                    content: `✨ ${VARIANTS[data.variant].name} variant completed with ${VARIANTS[data.variant].style.toLowerCase()} design!`,
                    timestamp: new Date(),
                    variant: data.variant
                  };
                  setMessages(prev => [...prev, variantMessage]);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
      
      // Simulate final terminal output
      await simulateTerminalCommand('npm run build', [
        '🔨 Building component...',
        '📦 Bundling assets...',
        '✅ Build successful!',
        '',
        'Component stats:',
        '  Size: 12.4 KB (gzipped: 4.2 KB)',
        '  Performance score: 98/100',
        '  Accessibility score: 100/100'
      ]);

      // Remove thinking message and add final message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));
      const finalMessage: Message = {
        id: Date.now().toString() + '-complete',
        type: 'assistant',
        content: '🎉 Success! I\'ve created 3 unique variations of your component. Each variant is fully functional, accessible, and optimized for performance. Click on the variants above to explore different styles!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, finalMessage]);
      
      // Set first iteration
      setIterations([variantCodes[0]]);
      
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

  const handleIterate = async (feedback: string) => {
    // Simulate iteration process
    const iterationMessage: Message = {
      id: Date.now().toString() + '-iterate',
      type: 'user',
      content: `Iterate: ${feedback}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, iterationMessage]);

    // Add to iterations
    const newCode = generatedCode + '\n// Iteration: ' + feedback;
    setIterations(prev => [...prev, newCode]);
    setCurrentIteration(iterations.length);
    setGeneratedCode(newCode);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    await simulateTerminalCommand('vercel deploy', [
      '🚀 Deploying to Vercel...',
      '📤 Uploading files...',
      '🔗 Creating deployment...',
      '✅ Deployment successful!',
      '',
      '🌐 Your component is live at:',
      '   https://vrux-component-abc123.vercel.app',
      '',
      '📊 Deployment details:',
      '   Build time: 23s',
      '   Functions: 0',
      '   Edge Functions: 1'
    ]);

    setTimeout(() => {
      setIsDeploying(false);
      toast.success('Component deployed successfully!', {
        duration: 5000,
        icon: '🚀',
      });
    }, 3000);
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
    const shareUrl = `https://vrux.app/share/${Date.now()}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!', {
      duration: 3000,
      icon: '🔗',
    });
  };

  // Device frames moved to ModernPreview component

  // Removed FileViewerModal component as it's now imported

  const FileTreeNode = ({ node, level = 0, onFileClick }: { node: FileNode; level?: number; onFileClick: (file: FileNode) => void }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    const handleClick = () => {
      if (node.type === 'folder') {
        setIsOpen(!isOpen);
      } else {
        onFileClick(node);
      }
    };
    
    return (
      <div style={{ paddingLeft: `${level * 12}px` }}>
        <div 
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all ${
            darkMode 
              ? 'hover:bg-gray-800 active:bg-gray-700' 
              : 'hover:bg-gray-100 active:bg-gray-200'
          }`}
          onClick={handleClick}
        >
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : null}
          {node.type === 'folder' ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 text-yellow-600" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-600" />
            )
          ) : (
            <FileCode className={`w-4 h-4 ${
              node.language === 'tsx' ? 'text-blue-600' :
              node.language === 'css' ? 'text-pink-600' :
              node.language === 'ts' ? 'text-blue-500' :
              'text-gray-600'
            }`} />
          )}
          <span className={`text-sm flex-1 ${
            node.status === 'creating' ? 'animate-pulse' : ''
          } ${
            node.type === 'file' ? 'hover:underline' : ''
          }`}>
            {node.name}
          </span>
          {node.status === 'creating' && (
            <Loader2 className="w-3 h-3 animate-spin ml-auto text-blue-500" />
          )}
          {node.status === 'created' && (
            <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
          )}
        </div>
        {node.type === 'folder' && isOpen && node.children && (
          <div>
            {node.children.map((child, i) => (
              <FileTreeNode key={i} node={child} level={level + 1} onFileClick={onFileClick} />
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <>
      <AnimatedBackground darkMode={darkMode} variant="aurora" />
      <FileViewerModal 
        fileName={selectedFile?.name || ''} 
        content={selectedFile?.content || ''}
        language={selectedFile?.language}
        isOpen={showFileModal} 
        onClose={() => setShowFileModal(false)}
        darkMode={darkMode}
      />
      
      {showMultiFileWorkspace && (
        <MultiFileWorkspace
          onClose={() => setShowMultiFileWorkspace(false)}
          darkMode={darkMode}
          onDeploy={async () => {
            // Deploy project
            toast.success('Deploying multi-file project...', {
              icon: '🚀',
              duration: 3000
            });
          }}
        />
      )}
      
      <div className={`flex flex-col lg:flex-row h-[calc(100vh-4rem)] ${fullscreen ? 'fixed inset-0 z-50' : ''} ${
        darkMode ? 'bg-gray-950' : 'bg-gray-50'
      } relative`}>
      
      {/* Mobile header */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <h2 className="font-semibold">VRUX Component Generator</h2>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`p-2 rounded-lg ${
            darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      {/* Left Sidebar - Steps & File Tree */}
      <div className={`lg:block ${showMobileMenu ? 'block' : 'hidden'} fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 flex-shrink-0 flex flex-col ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
      } lg:translate-x-0 lg:border-r ${fullscreen ? 'hidden lg:flex' : ''}`}>
        {/* Steps */}
        <Collapsible.Root open={showSteps} onOpenChange={setShowSteps}>
          <Collapsible.Trigger className={`w-full px-4 py-3 flex items-center justify-between border-b ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Generation Steps</span>
            </div>
            {showSteps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <ScrollArea.Root className="h-64 overflow-hidden">
              <ScrollArea.Viewport className="h-full p-3">
                <div className="space-y-2">
                  {generationSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                        step.status === 'active' 
                          ? darkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                          : step.status === 'completed'
                          ? darkMode ? 'bg-green-900/20' : 'bg-green-50'
                          : ''
                      }`}
                    >
                      <div className={`mt-0.5 ${
                        step.status === 'completed' ? 'text-green-500' :
                        step.status === 'active' ? 'text-purple-500' :
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {step.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {step.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {step.status === 'pending' && step.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          step.status === 'completed' ? darkMode ? 'text-gray-300' : 'text-gray-700' :
                          step.status === 'active' ? darkMode ? 'text-white' : 'text-gray-900' :
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {step.description}
                          {step.duration && ` • ${(step.duration / 1000).toFixed(1)}s`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
                <ScrollArea.Thumb className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* File Tree */}
        <Collapsible.Root open={showFileTree} onOpenChange={setShowFileTree} className="flex-1 flex flex-col">
          <Collapsible.Trigger className={`w-full px-4 py-3 flex items-center justify-between border-b ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">Files</span>
            </div>
            {showFileTree ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Collapsible.Trigger>
          <Collapsible.Content className="flex-1 overflow-auto">
            {isGenerating && fileTree.children?.length === 0 ? (
              <FileTreeSkeleton />
            ) : (
              <div className="p-3">
                <FileTreeNode node={fileTree} onFileClick={handleFileClick} />
              </div>
            )}
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Features */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="space-y-2">
            <button
              onClick={() => setShowPlayground(!showPlayground)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Gamepad2 className="w-4 h-4" />
              Component Playground
            </button>
            <button
              onClick={() => setShowAIExplanation(!showAIExplanation)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Lightbulb className="w-4 h-4" />
              AI Explanations
            </button>
            <button
              onClick={() => setShowMultiFileWorkspace(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Files className="w-4 h-4" />
              Multi-File Project
            </button>
            <LoadingButton
              onClick={handleDeploy}
              disabled={!generatedCode}
              loading={isDeploying}
              loadingText="Deploying..."
              icon={<Rocket className="w-4 h-4" />}
              variant="primary"
              size="md"
              fullWidth
              darkMode={darkMode}
              className="text-sm"
            >
              Deploy to Vercel
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`w-full lg:w-96 flex-shrink-0 flex flex-col border-b lg:border-r lg:border-b-0 ${
        darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
      } ${fullscreen ? 'hidden lg:flex' : ''}`}>
        {/* Chat Header */}
        <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Generation Chat</h3>
            <div className="flex items-center gap-2">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className={`p-1.5 rounded ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}>
                    <History className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  Generation History
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
          </div>
        </div>

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
              <ModernChatMessage
                key={message.id}
                message={message}
                darkMode={darkMode}
                variant={message.variant !== undefined ? VARIANTS[message.variant] : undefined}
              />
            ))
          )}
          
          {isGenerating && streamingText && (
            <ModernChatMessage
              message={{
                id: 'streaming',
                type: 'assistant',
                content: streamingText,
                timestamp: new Date()
              }}
              darkMode={darkMode}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={`p-4 border-t ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="space-y-2">
            {/* Iteration buttons */}
            {generatedCode && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleIterate('Make it more colorful')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  More colorful
                </button>
                <button
                  type="button"
                  onClick={() => handleIterate('Add animations')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Add animations
                </button>
                <button
                  type="button"
                  onClick={() => handleIterate('Simplify design')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Simplify
                </button>
              </div>
            )}
            
            <div className="relative">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (e.target.value.length > 10) {
                    setPromptSuggestions(getPromptSuggestions(e.target.value));
                  } else {
                    setPromptSuggestions([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={generatedCode ? "Ask for changes..." : "Describe your component..."}
                className={`w-full px-4 py-3 pr-12 rounded-lg resize-none ${
                  darkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700' 
                    : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                rows={2}
                disabled={isGenerating}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        const enhanced = enhancePrompt(prompt);
                        setPrompt(enhanced);
                        toast.success('Prompt enhanced!', {
                          icon: '✨',
                          duration: 2000,
                        });
                        inputRef.current?.focus();
                      }}
                      disabled={!prompt.trim() || isGenerating}
                      className={`p-2 rounded-lg transition-all ${
                        darkMode
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white disabled:text-gray-600'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:text-gray-400'
                      } disabled:cursor-not-allowed`}
                    >
                      <Wand2 className="w-5 h-5" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                    Enhance prompt
                  </Tooltip.Content>
                </Tooltip.Root>
                <LoadingButton
                  type="submit"
                  disabled={!prompt.trim()}
                  loading={isGenerating}
                  icon={<Send className="w-5 h-5" />}
                  variant="primary"
                  size="md"
                  darkMode={darkMode}
                  className="!p-2"
                >
                  <span className="sr-only">Send</span>
                </LoadingButton>
              </div>
            </div>
            
            {/* Prompt Suggestions */}
            {promptSuggestions.length > 0 && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mt-2"
              >
                {promptSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPrompt(prompt + '. ' + suggestion);
                      setPromptSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                      darkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="opacity-50">+</span> {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
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
              <AnimatedVariantSelector
                variants={VARIANTS}
                selectedVariant={selectedVariant}
                onVariantSelect={setSelectedVariant}
                generatedVariants={variants}
                darkMode={darkMode}
              />
              
              {/* Iterations */}
              {iterations.length > 1 && (
                <>
                  <Separator.Root className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Iteration:</span>
                    {iterations.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIteration(i)}
                        className={`w-8 h-8 rounded-full text-sm font-medium ${
                          currentIteration === i
                            ? 'bg-purple-600 text-white'
                            : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleShare}
                    className={`p-2 rounded-lg ${
                      darkMode 
                        ? 'hover:bg-gray-800 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    } transition-colors`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                  Share
                </Tooltip.Content>
              </Tooltip.Root>

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
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code' | 'files' | 'terminal' | 'ai' | 'database' | 'auth' | 'deploy')} className="flex-1 flex flex-col">
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
            <Tabs.Trigger 
              value="files" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <FileCode className="w-4 h-4" />
              Files
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="terminal" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Terminal className="w-4 h-4" />
              Terminal
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="ai" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Lightbulb className="w-4 h-4" />
              AI Insights
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="database" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Database className="w-4 h-4" />
              Database
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="auth" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Auth
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="deploy" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } data-[state=active]:shadow-sm flex items-center gap-2`}
            >
              <Rocket className="w-4 h-4" />
              Deploy
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
            {isGenerating && !generatedCode ? (
              <PreviewSkeleton darkMode={darkMode} />
            ) : (
              <ModernPreview
                code={variants[selectedVariant] || generatedCode}
                darkMode={darkMode}
                deviceView={deviceView}
                onDeviceChange={setDeviceView}
                fullscreen={fullscreen}
                onFullscreenToggle={() => setFullscreen(!fullscreen)}
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="code" className="flex-1 overflow-hidden">
            <div className="h-full relative">
              {isGenerating && !generatedCode ? (
                <CodeEditorSkeleton darkMode={darkMode} />
              ) : generatedCode ? (
                <>
                  {/* Editor Header */}
                  <div className={`flex items-center justify-between px-4 py-2 border-b ${
                    darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Component.jsx</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        JavaScript
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={handleCopy}
                            className={`p-1.5 rounded ${
                              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
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
                            className={`p-1.5 rounded ${
                              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            } transition-colors`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                          Download file
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </div>
                  </div>
                  {/* Monaco Editor */}
                  <div className="flex-1" style={{ height: 'calc(100% - 49px)' }}>
                    <Editor
                      language="javascript"
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
                        automaticLayout: true,
                      }}
                      onChange={(value) => {
                        if (value && selectedVariant >= 0 && selectedVariant < variants.length) {
                          const newVariants = [...variants];
                          newVariants[selectedVariant] = value;
                          setVariants(newVariants);
                        }
                      }}
                    />
                  </div>
                </>
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
            </div>
          </Tabs.Content>

          <Tabs.Content value="files" className="flex-1 overflow-hidden">
            <div className={`h-full ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
              {fileTree.children && fileTree.children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 h-full overflow-auto">
                  {fileTree.children.map((file, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`rounded-xl border ${
                        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                      } overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-fit`}
                      onClick={() => handleFileClick(file)}
                    >
                      <div className={`px-4 py-3 border-b ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } flex items-center gap-2`}>
                        <FileCode className={`w-4 h-4 ${
                          file.language === 'typescript' ? 'text-blue-600' :
                          file.language === 'css' ? 'text-pink-600' :
                          'text-gray-600'
                        }`} />
                        <span className="text-sm font-medium flex-1">{file.name}</span>
                        {file.status === 'created' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="p-4">
                        <pre className={`text-xs font-mono ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        } line-clamp-6`}>
                          {file.content || '// File content will appear here'}
                        </pre>
                      </div>
                      <div className={`px-4 py-2 ${
                        darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                      } flex items-center justify-between text-xs`}>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
                          {file.content ? `${file.content.split('\n').length} lines` : '0 lines'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {file.language || 'text'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Folder className={`w-12 h-12 mx-auto mb-4 ${
                      darkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      No files generated yet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="terminal" className="flex-1 overflow-hidden">
            <div className="h-full bg-gray-950 text-green-400 font-mono text-sm p-4 overflow-auto">
              {terminalOutput.length > 0 ? (
                <div className="space-y-1">
                  {terminalOutput.map((line, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex"
                    >
                      <span>{line}</span>
                    </motion.div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-500">
                      Terminal output will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="ai" className="flex-1 overflow-hidden">
            <IntelligentChatInterface
              currentCode={variants[selectedVariant] || generatedCode}
              onGenerate={async (newPrompt: string) => {
                setPrompt(newPrompt);
                await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
              }}
              onCodeUpdate={(newCode) => {
                if (selectedVariant >= 0 && selectedVariant < variants.length) {
                  const newVariants = [...variants];
                  newVariants[selectedVariant] = newCode;
                  setVariants(newVariants);
                  if (selectedVariant === 0) {
                    setGeneratedCode(newCode);
                  }
                }
              }}
              darkMode={darkMode}
            />
          </Tabs.Content>

          <Tabs.Content value="database" className="flex-1 overflow-auto p-6">
            <DatabaseSchemaDesigner
              onSchemaGenerated={(tables, code) => {
                // Add the generated database code as a new file
                const dbFile = {
                  name: 'database-setup.ts',
                  type: 'file' as const,
                  content: code,
                  status: 'created' as const,
                  language: 'typescript'
                };
                setFileTree(prev => ({
                  ...prev,
                  children: [...(prev.children || []), dbFile]
                }));
                
                // Show notification
                toast.success('Database schema generated! Check the files tab.', {
                  duration: 5000,
                  icon: '🗄️'
                });
                
                // Switch to files tab to show the generated code
                setActiveTab('files');
              }}
              darkMode={darkMode}
            />
          </Tabs.Content>

          <Tabs.Content value="auth" className="flex-1 overflow-auto p-6">
            <AuthBuilder
              onAuthGenerated={(code) => {
                // Add the generated auth code as a new file
                const authFile = {
                  name: 'auth-system.ts',
                  type: 'file' as const,
                  content: code,
                  status: 'created' as const,
                  language: 'typescript'
                };
                setFileTree(prev => ({
                  ...prev,
                  children: [...(prev.children || []), authFile]
                }));
                
                // Show notification
                toast.success('Authentication system generated! Check the files tab.', {
                  duration: 5000,
                  icon: '🔐'
                });
                
                // Switch to files tab to show the generated code
                setActiveTab('files');
              }}
              darkMode={darkMode}
            />
          </Tabs.Content>

          <Tabs.Content value="deploy" className="flex-1 overflow-auto p-6">
            <DeploymentPanel
              code={variants[selectedVariant] || generatedCode}
              projectName={prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}
              onDeploymentComplete={(result) => {
                if (result.success && result.url) {
                  toast.success(`Your app is live at ${result.url}`, {
                    duration: 10000,
                    icon: '🚀'
                  });
                }
              }}
              darkMode={darkMode}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Right Sidebar - AI Explanation & Playground */}
      {(showAIExplanation || showPlayground) && (
        <div className={`w-80 border-l ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
        } p-4 overflow-auto`}>
          {showAIExplanation && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                AI Explanations
              </h3>
              <div className={`rounded-lg p-3 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <p className="text-sm">
                  The component uses modern React patterns with hooks for state management...
                </p>
              </div>
            </div>
          )}
          
          {showPlayground && (
            <div className="space-y-4 mt-6">
              <h3 className="font-medium flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Component Playground
              </h3>
              <div className={`rounded-lg p-3 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } space-y-3`}>
                <div>
                  <label className="text-xs font-medium">Primary Color</label>
                  <input type="color" className="w-full h-8 rounded" defaultValue="#8B5CF6" />
                </div>
                <div>
                  <label className="text-xs font-medium">Border Radius</label>
                  <input type="range" className="w-full" min="0" max="24" defaultValue="8" />
                </div>
                <div>
                  <label className="text-xs font-medium">Spacing</label>
                  <select className={`w-full px-2 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <option>Compact</option>
                    <option>Normal</option>
                    <option>Relaxed</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}