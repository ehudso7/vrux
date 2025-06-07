import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Code2,
  X,
  ChevronRight,
  Zap,
  GitBranch,
  Copy,
  Download,
  Undo2,
  Redo2,
  MessageSquare,
  Bug,
  Palette,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { ChatProcessor, ChatMessage } from '../lib/ai-chat-processor';
import type { CodeAnalysis } from '../lib/ai-code-analyzer';
import { Button } from './ui/button';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';
import MonacoEditor from '@monaco-editor/react';

interface IntelligentChatInterfaceProps {
  currentCode: string;
  onGenerate: (prompt: string, options?: {
    intent?: string;
    targetElements?: string[];
    context?: string;
    variants?: number;
    stream?: boolean;
  }) => Promise<void>;
  onCodeUpdate: (code: string) => void;
  darkMode?: boolean;
}

export default function IntelligentChatInterface({ 
  currentCode, 
  onGenerate, 
  onCodeUpdate 
}: IntelligentChatInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [codeHistory, setCodeHistory] = useState<string[]>([currentCode]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatProcessor = useRef(new ChatProcessor());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isGenerating } = useStore();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update history when code changes
  useEffect(() => {
    if (currentCode && currentCode !== codeHistory[historyIndex]) {
      const newHistory = codeHistory.slice(0, historyIndex + 1);
      newHistory.push(currentCode);
      setCodeHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCode]);

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    const userPrompt = prompt.trim();
    setPrompt('');

    // Process user message
    const processed = chatProcessor.current.processUserMessage(userPrompt, currentCode);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date(),
      type: processed.intent === 'create' ? 'text' : processed.intent as 'edit' | 'suggestion'
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant "thinking" message
    const thinkingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Generate with enhanced prompt
      await onGenerate(processed.enhancedPrompt, { 
        intent: processed.intent,
        targetElements: processed.targetElements,
        context: chatProcessor.current.getContextSummary()
      });

      // Process the response
      const response = chatProcessor.current.processAssistantResponse(
        currentCode, // This will be updated by onGenerate
        userPrompt
      );

      // Update thinking message with actual response
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        
        if (lastMessage.role === 'assistant') {
          lastMessage.content = getAssistantResponseText(processed.intent);
          lastMessage.code = response.code;
          lastMessage.analysis = response.analysis;
          lastMessage.suggestions = response.suggestions;
          lastMessage.type = 'code';
          lastMessage.metadata = {
            model: 'gpt-4o',
            generationTime: Date.now() - userMessage.timestamp.getTime()
          };
        }
        
        return updated;
      });

      // Add suggested actions as a follow-up
      if (processed.suggestedActions.length > 0) {
        setTimeout(() => {
          const suggestionsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'system',
            content: 'Here are some things you can try next:',
            suggestions: processed.suggestedActions,
            timestamp: new Date(),
            type: 'suggestion'
          };
          setMessages(prev => [...prev, suggestionsMessage]);
        }, 1000);
      }
    } catch {
      // Update thinking message with error
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, I encountered an error. Please try again.';
          lastMessage.type = 'text';
        }
        
        return updated;
      });
      toast.error('Failed to process your request');
    }
  };

  const getAssistantResponseText = (intent: string): string => {
    switch (intent) {
      case 'edit':
        return "I've updated your component with the requested changes.";
      case 'fix':
        return "I've fixed the issues in your component.";
      case 'enhance':
        return "I've enhanced your component with improvements.";
      case 'explain':
        return "Here's an explanation of your component:";
      default:
        return "I've created a new component for you.";
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setPrompt(suggestion);
    // Auto-submit
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onCodeUpdate(codeHistory[newIndex]);
      toast.success('Reverted to previous version');
    }
  };

  const handleRedo = () => {
    if (historyIndex < codeHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onCodeUpdate(codeHistory[newIndex]);
      toast.success('Restored next version');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
    toast.success('Code copied to clipboard');
  };

  const downloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component.jsx';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const handleImageUpload = async (file: File) => {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 20MB');
      return;
    }

    setIsAnalyzingImage(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setUploadedImage(base64);
        
        // Analyze image
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64Data,
            generatePrompt: true 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const { prompt } = await response.json();
        
        // Set the generated prompt
        setPrompt(prompt);
        toast.success('Image analyzed! Review the generated prompt and click send.');
      };
    } catch {
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* History controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex === codeHistory.length - 1}
            className="p-2"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          {/* View toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
            className={`p-2 ${showDiff ? 'bg-purple-50 text-purple-600' : ''}`}
          >
            <GitBranch className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={`p-2 ${showAnalysis ? 'bg-purple-50 text-purple-600' : ''}`}
          >
            <Code2 className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          {/* Code actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="p-2"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadCode}
            className="p-2"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Ready to create amazing UI</h3>
            <p className="text-gray-600">
              Describe what you want, make edits, or ask for improvements
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-100'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    {message.role === 'assistant' && (
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    )}
                    {message.type && message.type !== 'text' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur">
                        {message.type}
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <p className={message.role === 'user' ? 'text-white' : 'text-gray-800'}>
                    {message.content}
                  </p>

                  {/* Code Analysis */}
                  {message.analysis && showAnalysis && (
                    <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-lg">
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Code2 className="w-4 h-4 mr-2" />
                        Code Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        {(message.analysis as CodeAnalysis).components.map((comp, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{comp.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              comp.complexity === 'low' ? 'bg-green-100 text-green-700' :
                              comp.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {comp.complexity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {message.suggestions.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-3 rounded-lg bg-white/10 backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-between group"
                        >
                          <span className="text-sm">{suggestion}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {/* Image preview */}
        {uploadedImage && (
          <div className="mb-3 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`data:image/jpeg;base64,${uploadedImage}`}
              alt="Uploaded design"
              className="max-h-32 rounded-lg border border-gray-300"
            />
            <button
              onClick={() => {
                setUploadedImage(null);
                setPrompt('');
              }}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onPaste={handlePaste}
              placeholder={currentCode ? "Ask me to edit, explain, or improve this component..." : "Describe the UI component you want to create..."}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none transition-all"
              rows={1}
              disabled={isGenerating || isAnalyzingImage}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating || isAnalyzingImage}
            variant="ghost"
            className="p-3"
            title="Upload image or screenshot"
          >
            {isAnalyzingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating || isAnalyzingImage}
            className="gradient-primary text-white px-6 py-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-xs text-gray-500">Quick actions:</span>
          <button
            onClick={() => setPrompt('Add animations and transitions')}
            className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          >
            <Zap className="w-3 h-3 inline mr-1" />
            Animate
          </button>
          <button
            onClick={() => setPrompt('Fix any accessibility issues')}
            className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Bug className="w-3 h-3 inline mr-1" />
            Fix A11y
          </button>
          <button
            onClick={() => setPrompt('Make it responsive for mobile')}
            className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <Layers className="w-3 h-3 inline mr-1" />
            Responsive
          </button>
          <button
            onClick={() => setPrompt('Add dark mode support')}
            className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Palette className="w-3 h-3 inline mr-1" />
            Dark Mode
          </button>
        </div>
      </div>

      {/* Diff View Modal */}
      <AnimatePresence>
        {showDiff && codeHistory.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDiff(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">Code Changes</h3>
                <button
                  onClick={() => setShowDiff(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <MonacoEditor
                  height="60vh"
                  language="javascript"
                  theme="vs-dark"
                  value={currentCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}