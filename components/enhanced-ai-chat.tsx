import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Mic, 
  MicOff,
  Image,
  Wand2
} from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

interface EnhancedAIChatProps {
  onGenerate: (prompt: string, options?: { variants?: number; stream?: boolean }) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  'A modern dashboard with charts and stats',
  'An e-commerce product card with animations',
  'A sleek pricing table with gradients',
  'A beautiful hero section with CTA buttons',
  'An interactive todo list with filters',
];

export default function EnhancedAIChat({ onGenerate }: EnhancedAIChatProps) {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  
  const { 
    isGenerating, 
    messages, 
    addMessage,
    setCommandPaletteOpen 
  } = useStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Voice input setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result.transcript)
          .join('');
        
        setPrompt(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        toast.error('Voice recognition failed');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setShowExamples(false);

    // Add user message
    addMessage({
      role: 'user',
      content: userPrompt,
    });

    try {
      await onGenerate(userPrompt, { variants: 3, stream: true });
    } catch {
      toast.error('Failed to generate component');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = () => {
    // TODO: Implement image upload for "copy this design" functionality
    toast('Image upload coming soon!', { icon: '🚧' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-bold">
          What would you like to <span className="text-gradient">create today?</span>
        </h2>
        
        <p className="text-gray-600 max-w-xl mx-auto">
          Describe your component in natural language and watch AI bring it to life with beautiful designs and smooth animations.
        </p>
      </div>

      {/* Example Prompts */}
      <AnimatePresence>
        {showExamples && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {EXAMPLE_PROMPTS.map((example, index) => (
              <motion.button
                key={example}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setPrompt(example)}
                className="text-left p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-purple-300 transition-all group"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{example}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <div className="relative flex items-end glass rounded-2xl p-1 shadow-lg border border-white/20 group focus-within:ring-2 focus-within:ring-purple-500/20">
          <div className="flex-1 min-h-[56px] flex items-center px-4">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your UI component..."
              disabled={isGenerating}
              className="w-full bg-transparent outline-none resize-none py-4 text-gray-800 placeholder-gray-500 max-h-[200px]"
              rows={1}
            />
          </div>
          
          <div className="flex items-center space-x-1 p-2">
            {/* Voice Input */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceRecording}
              disabled={isGenerating}
              className={`p-2 ${isRecording ? 'text-red-500 bg-red-50' : ''}`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            {/* Image Upload */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImageUpload}
              disabled={isGenerating}
              className="p-2"
              aria-label="Upload image"
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4" aria-hidden="true" />
            </Button>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              size="sm"
              className="gradient-primary text-white px-4 py-2 h-10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">↵</kbd>
            <span>to send</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">⌘</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">K</kbd>
            <span>for commands</span>
          </div>
        </div>
      </motion.div>

      {/* AI Thinking Animation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center space-x-3 py-4"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">AI is crafting your component</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}