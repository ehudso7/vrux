import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, Copy, Download, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  content: string;
  language?: string;
  darkMode: boolean;
}

export default function FileViewerModal({
  isOpen,
  onClose,
  fileName,
  content,
  language = 'typescript',
  darkMode
}: FileViewerModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 z-[61] flex items-center justify-center"
          >
            <div className={`w-full h-full max-w-6xl max-h-[90vh] ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            } rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              } flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">{fileName}</h3>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {language}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  value={content}
                  language={language}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    bracketPairColorization: { enabled: true },
                    wordWrap: 'on',
                    renderWhitespace: 'boundary',
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                  }}
                />
              </div>

              {/* Footer */}
              <div className={`px-6 py-3 border-t ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              } flex items-center justify-between text-sm`}>
                <div className={`flex items-center gap-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{content.split('\n').length} lines</span>
                  <span>•</span>
                  <span>{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Syntax highlighted
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}