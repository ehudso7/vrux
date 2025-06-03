import { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Copy, Download, Check, Code2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

interface CodeEditorProps {
  code: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CodeEditor({ 
  code, 
  language = 'javascript', 
  readOnly = true,
  onChange,
  className = ''
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleEditorDidMount = (editor: any, monacoInstance: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Define custom theme
    monacoInstance.editor.defineTheme('vrux-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280' },
        { token: 'string', foreground: '34D399' },
        { token: 'keyword', foreground: 'A78BFA' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'type', foreground: '60A5FA' },
      ],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#E5E7EB',
        'editor.lineHighlightBackground': '#1E293B',
        'editor.selectionBackground': '#3730A3',
        'editor.inactiveSelectionBackground': '#312E81',
        'editorCursor.foreground': '#A78BFA',
        'editorWhitespace.foreground': '#374151',
      },
    });

    monacoInstance.editor.setTheme('vrux-dark');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component.jsx';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'relative'}`}
    >
      <div className={`${isFullscreen ? 'h-full flex flex-col' : 'glass rounded-2xl overflow-hidden shadow-2xl border border-white/10'}`}>
        {/* Header */}
        <div className="bg-gray-900/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Code2 className="w-4 h-4" />
              <span className="text-sm font-medium">component.jsx</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className={isFullscreen ? 'flex-1' : 'h-[500px]'}>
          <Editor
            value={code}
            language={language}
            theme="vrux-dark"
            onMount={handleEditorDidMount}
            onChange={(value) => onChange?.(value || '')}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              rulers: [],
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
              },
              padding: { top: 16, bottom: 16 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
              fontLigatures: true,
              renderLineHighlight: 'all',
              bracketPairColorization: {
                enabled: true,
              },
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Footer with stats */}
        <div className="bg-gray-900/95 backdrop-blur-xl px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-800">
          <div className="flex items-center space-x-4">
            <span>JavaScript (JSX)</span>
            <span>•</span>
            <span>{code.split('\n').length} lines</span>
            <span>•</span>
            <span>{code.length.toLocaleString()} characters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}