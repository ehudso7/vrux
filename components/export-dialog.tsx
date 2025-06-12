import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Copy,
  Check,
  X,
  Code2,
  FileCode,
  Package,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { frameworkConverter } from '../lib/framework-converter';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

interface ExportDialogProps {
  code: string;
  componentName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const FRAMEWORKS = [
  {
    id: 'react',
    name: 'React',
    icon: '⚛️',
    description: 'Original React component',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'vue',
    name: 'Vue 3',
    icon: '🟢',
    description: 'Vue 3 Composition API',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'angular',
    name: 'Angular',
    icon: '🔺',
    description: 'Angular 12+ component',
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'svelte',
    name: 'Svelte',
    icon: '🟠',
    description: 'Svelte component',
    color: 'from-orange-500 to-amber-500'
  }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  code,
  componentName = 'MyComponent',
  isOpen,
  onClose
}) => {
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [convertedCode, setConvertedCode] = useState(code);
  const [additionalFiles, setAdditionalFiles] = useState<Array<{ filename: string; content: string }>>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [includeTypes, setIncludeTypes] = useState(true);
  const [styleFormat, setStyleFormat] = useState<'css' | 'scss' | 'styled-components'>('css');
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Convert code when framework changes
  const handleFrameworkChange = useCallback(async (framework: string) => {
    setSelectedFramework(framework);
    setSelectedFile(0);

    if (framework === 'react') {
      setConvertedCode(code);
      setAdditionalFiles([]);
      setWarnings([]);
      return;
    }

    setIsConverting(true);
    try {
      const result = await frameworkConverter.convert(code, {
        framework: framework as 'vue' | 'angular' | 'svelte',
        typescript: includeTypes,
        componentName,
        styleFormat
      });

      setConvertedCode(result.code);
      setAdditionalFiles(result.additionalFiles || []);
      setWarnings(result.warnings || []);
      toast.success(`Converted to ${FRAMEWORKS.find(f => f.id === framework)?.name}`);
    } catch (error) {
      toast.error('Conversion failed: ' + (error as Error).message);
      setConvertedCode('// Conversion failed\n// ' + (error as Error).message);
      setWarnings(['Conversion failed: ' + (error as Error).message]);
    } finally {
      setIsConverting(false);
    }
  }, [code, componentName, includeTypes, styleFormat]);

  // Copy code to clipboard
  const copyToClipboard = useCallback(async () => {
    const currentFile = selectedFile === 0 
      ? { content: convertedCode } 
      : additionalFiles[selectedFile - 1];
    
    if (!currentFile) return;

    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  }, [convertedCode, additionalFiles, selectedFile]);

  // Download all files
  const downloadFiles = useCallback(() => {
    const framework = FRAMEWORKS.find(f => f.id === selectedFramework);
    if (!framework) return;

    // For React, just download the single file
    if (selectedFramework === 'react') {
      const blob = new Blob([convertedCode], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${componentName}.${includeTypes ? 'tsx' : 'jsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Component downloaded!');
      return;
    }

    // For other frameworks, create a zip file
    // In a real app, you'd use a library like JSZip
    const mainFile = {
      name: getMainFileName(),
      content: convertedCode
    };

    const allFiles = [mainFile, ...additionalFiles.map(f => ({ name: f.filename, content: f.content }))];

    // For demo, just download the main file
    const blob = new Blob([mainFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mainFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (additionalFiles.length > 0) {
      toast.success(`Downloaded main file. ${additionalFiles.length} additional files need manual download.`);
    } else {
      toast.success('Component downloaded!');
    }
  }, [selectedFramework, convertedCode, additionalFiles, componentName, includeTypes]);

  const getMainFileName = () => {
    switch (selectedFramework) {
      case 'vue':
        return `${componentName}.vue`;
      case 'angular':
        return `${componentName.toLowerCase()}.component.ts`;
      case 'svelte':
        return `${componentName}.svelte`;
      default:
        return `${componentName}.${includeTypes ? 'tsx' : 'jsx'}`;
    }
  };

  const getLanguageForFile = (filename: string) => {
    if (filename.endsWith('.vue')) return 'vue';
    if (filename.endsWith('.svelte')) return 'svelte';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.scss')) return 'scss';
    return 'plaintext';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Export Component</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Convert and download your component for different frameworks
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-200px)]">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
              {/* Framework Selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Select Framework</h3>
                <div className="space-y-2">
                  {FRAMEWORKS.map(framework => (
                    <button
                      key={framework.id}
                      onClick={() => handleFrameworkChange(framework.id)}
                      disabled={isConverting}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        selectedFramework === framework.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${framework.color} flex items-center justify-center text-2xl`}>
                          {framework.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{framework.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {framework.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeTypes}
                      onChange={(e) => setIncludeTypes(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Include TypeScript types</span>
                  </label>
                </div>

                {selectedFramework === 'angular' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Style format</label>
                    <select
                      value={styleFormat}
                      onChange={(e) => setStyleFormat(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="css">CSS</option>
                      <option value="scss">SCSS</option>
                      <option value="styled-components">Styled Components</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Files List */}
              {additionalFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Generated Files</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFile(0)}
                      className={`w-full p-2 rounded text-left text-sm flex items-center gap-2 ${
                        selectedFile === 0
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FileCode className="w-4 h-4" />
                      {getMainFileName()}
                    </button>
                    {additionalFiles.map((file, index) => (
                      <button
                        key={file.filename}
                        onClick={() => setSelectedFile(index + 1)}
                        className={`w-full p-2 rounded text-left text-sm flex items-center gap-2 ${
                          selectedFile === index + 1
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <FileCode className="w-4 h-4" />
                        {file.filename}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-amber-600">Warnings</h3>
                  <div className="space-y-2">
                    {warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Code Preview */}
            <div className="flex-1 flex flex-col">
              {/* Editor Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {selectedFile === 0 ? getMainFileName() : additionalFiles[selectedFile - 1]?.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    disabled={isConverting}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1">
                {isConverting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                      <p className="text-gray-600">Converting component...</p>
                    </div>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    language={getLanguageForFile(
                      selectedFile === 0 ? getMainFileName() : additionalFiles[selectedFile - 1]?.filename || ''
                    )}
                    value={selectedFile === 0 ? convertedCode : additionalFiles[selectedFile - 1]?.content || ''}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Package className="w-4 h-4" />
                <span>
                  {additionalFiles.length > 0 
                    ? `${additionalFiles.length + 1} files will be generated`
                    : 'Single file component'
                  }
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={downloadFiles}
                  disabled={isConverting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {additionalFiles.length > 0 ? 'Files' : 'Component'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};