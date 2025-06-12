import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronRight, 
  Zap,
  Code2,
  Palette,
  RefreshCw,
  Download,
  Copy,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  Clock,
  GitBranch
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import Editor from '@monaco-editor/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ModelSelector } from './model-selector';
import { VersionHistory, ComponentVersion } from './version-history';
import { versionControl } from '../lib/version-control';
import { useAuth } from '../lib/auth-context';
import toast from 'react-hot-toast';

interface PreviewData {
  html: string;
  css: string;
  confidence: number;
  isComplete: boolean;
}

interface GenerationVariant {
  code: string;
  style: string;
  provider?: string;
  preview?: PreviewData;
  isGenerating: boolean;
  error?: string;
}

interface EnhancedGenerationInterfaceProps {
  onGenerate?: (code: string, variant: number) => void;
  initialPrompt?: string;
}

export const EnhancedGenerationInterface: React.FC<EnhancedGenerationInterfaceProps> = ({
  onGenerate,
  initialPrompt = ''
}) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [variants, setVariants] = useState<GenerationVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showRealtimePreview, setShowRealtimePreview] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedVariant, setCopiedVariant] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [componentId] = useState(`component_${Date.now()}`);
  const [versions, setVersions] = useState<ComponentVersion[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load version history on mount
  useEffect(() => {
    versionControl.loadVersions(componentId).then(() => {
      const loadedVersions = versionControl.getVersions(componentId);
      setVersions(loadedVersions);
    });
  }, [componentId]);

  // Handle generation with enhanced streaming
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setVariants([]);
    const generationStartTime = Date.now();
    const temperature = 0.7; // Default temperature
    
    // Initialize variants
    const newVariants: GenerationVariant[] = [
      { code: '', style: 'modern', isGenerating: true },
      { code: '', style: 'bold', isGenerating: true },
      { code: '', style: 'elegant', isGenerating: true }
    ];
    setVariants(newVariants);

    try {
      const response = await fetch('/api/generate-ui-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          variants: 3,
          model: selectedModel,
          enablePreview: showRealtimePreview,
          previewThrottle: 100
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate components');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
                  case 'content':
                    setVariants(prev => {
                      const updated = [...prev];
                      if (updated[data.variant]) {
                        updated[data.variant].code += data.content;
                      }
                      return updated;
                    });
                    break;

                  case 'preview':
                    if (showRealtimePreview && data.preview) {
                      setVariants(prev => {
                        const updated = [...prev];
                        if (updated[data.variant]) {
                          updated[data.variant].preview = data.preview;
                        }
                        return updated;
                      });
                    }
                    break;

                  case 'progress':
                    // Could show progress indicator here
                    break;

                  case 'variant_complete':
                    setVariants(prev => {
                      const updated = [...prev];
                      if (updated[data.variant]) {
                        updated[data.variant] = {
                          ...updated[data.variant],
                          code: data.code,
                          isGenerating: false,
                          provider: data.provider,
                          preview: data.finalPreview
                        };
                      }
                      return updated;
                    });
                    
                    // Create version for this variant
                    if (user) {
                      versionControl.createVersion(
                        componentId,
                        data.code,
                        prompt,
                        {
                          id: user.id,
                          name: user.name || user.email || 'Anonymous',
                          avatar: (user as any).avatarUrl || ''
                        },
                        {
                          model: selectedModel,
                          provider: data.provider,
                          temperature: temperature || 0.7,
                          generationTime: Date.now() - generationStartTime
                        },
                        `Generated variant ${data.variant + 1} with ${selectedModel}`
                      ).then(newVersion => {
                        setVersions(prev => [newVersion, ...prev]);
                      });
                    }
                    
                    if (onGenerate) {
                      onGenerate(data.code, data.variant);
                    }
                    break;

                  case 'variant_error':
                    setVariants(prev => {
                      const updated = [...prev];
                      if (updated[data.variant]) {
                        updated[data.variant] = {
                          ...updated[data.variant],
                          isGenerating: false,
                          error: data.error
                        };
                      }
                      return updated;
                    });
                    break;

                  case 'done':
                    toast.success('Components generated successfully!');
                    break;

                  case 'error':
                    toast.error(data.message || 'Generation failed');
                    break;
                }
              } catch (err) {
                console.error('Failed to parse SSE data:', err);
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
      setVariants(prev => prev.map(v => ({ ...v, isGenerating: false, error: 'Generation failed' })));
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, showRealtimePreview, onGenerate]);

  // Copy code to clipboard
  const copyToClipboard = useCallback(async (code: string, variantIndex: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedVariant(variantIndex);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopiedVariant(null), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  }, []);

  // Download code as file
  const downloadCode = useCallback((code: string, variantIndex: number) => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-variant-${variantIndex + 1}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Component downloaded!');
  }, []);

  const currentVariant = variants[selectedVariant];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isGenerating ? 360 : 0 }}
              transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: 'linear' }}
              className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-semibold">AI Component Generator</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time preview • Multi-model support • Instant generation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRealtimePreview(!showRealtimePreview)}
            >
              <Zap className={`w-4 h-4 mr-2 ${showRealtimePreview ? 'text-yellow-500' : ''}`} />
              Real-time Preview
            </Button>
            
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              className="min-w-[200px]"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className={showHistory ? 'bg-purple-100 dark:bg-purple-900/20' : ''}
            >
              <Clock className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
            placeholder="Describe the component you want to generate..."
            className="w-full px-4 py-3 pr-32 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            rows={3}
          />
          <div className="absolute right-2 bottom-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Variants Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Variants</h3>
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => setSelectedVariant(index)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedVariant === index
                      ? 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{variant.style}</span>
                    {variant.isGenerating && (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    )}
                    {variant.error && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {variant.preview && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Confidence: {Math.round(variant.preview.confidence * 100)}%
                    </div>
                  )}
                  {variant.provider && (
                    <div className="text-xs text-gray-500 mt-1">
                      via {variant.provider}
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Code and Preview */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Code Editor</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => currentVariant && copyToClipboard(currentVariant.code, selectedVariant)}
                  disabled={!currentVariant?.code}
                >
                  {copiedVariant === selectedVariant ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => currentVariant && downloadCode(currentVariant.code, selectedVariant)}
                  disabled={!currentVariant?.code}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1">
              {currentVariant?.code ? (
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={currentVariant.code}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    readOnly: true,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {currentVariant?.isGenerating ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Generating code...</p>
                    </div>
                  ) : currentVariant?.error ? (
                    <div className="text-center text-red-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>{currentVariant.error}</p>
                    </div>
                  ) : (
                    <p>No code generated yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 flex flex-col border-l border-gray-200 dark:border-gray-800">
              <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Live Preview</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto bg-gray-50 dark:bg-gray-900/50">
                {currentVariant?.code ? (
                  <div className="h-full">
                    {currentVariant.preview && showRealtimePreview && !currentVariant.preview.isComplete ? (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Real-time preview (Confidence: {Math.round(currentVariant.preview.confidence * 100)}%)
                        </p>
                      </div>
                    ) : null}
                    
                    <LiveProvider
                      code={currentVariant.code}
                      scope={{ 
                        useState: React.useState,
                        useEffect: React.useEffect,
                        useCallback: React.useCallback,
                        useMemo: React.useMemo,
                        useRef: React.useRef,
                      }}
                      noInline={false}
                    >
                      <LiveError className="text-red-500 font-mono text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4" />
                      <LivePreview className="preview-container" />
                    </LiveProvider>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {currentVariant?.isGenerating ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Generating preview...</p>
                        {currentVariant.preview && (
                          <div className="mt-4 w-full max-w-md">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${currentVariant.preview.confidence * 100}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>No preview available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Version History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-40"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">Version History</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <VersionHistory
                  versions={versions}
                  currentVersionId={versions[0]?.id || ''}
                  onRestore={(version) => {
                    if (selectedVariant !== undefined && variants[selectedVariant]) {
                      const updated = [...variants];
                      updated[selectedVariant] = {
                        ...updated[selectedVariant],
                        code: version.code
                      };
                      setVariants(updated);
                      toast.success(`Restored version ${version.version}`);
                    }
                  }}
                  onView={(version) => {
                    // Could open in modal or new tab
                    console.log('View version:', version);
                  }}
                  onCompare={(versionA, versionB) => {
                    const diff = versionControl.compareVersions(versionA, versionB);
                    console.log('Version diff:', diff);
                    toast.success(`Comparing v${versionA.version} and v${versionB.version}`);
                  }}
                  onDelete={async (versionId) => {
                    const success = await versionControl.deleteVersion(componentId, versionId);
                    if (success) {
                      setVersions(prev => prev.filter(v => v.id !== versionId));
                      toast.success('Version deleted');
                    } else {
                      toast.error('Cannot delete current version');
                    }
                  }}
                  onStar={async (versionId) => {
                    const isStarred = await versionControl.toggleStar(componentId, versionId);
                    setVersions(prev => prev.map(v => 
                      v.id === versionId ? { ...v, isStarred } : v
                    ));
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};