import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, 
  Save, 
  Download, 
  Upload, 
  Play,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ProjectExplorer } from './project-explorer';
import { 
  ProjectFile, 
  ProjectStructure, 
  buildFileTree, 
  validateProjectStructure,
} from '@/lib/project-manager';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Tab {
  path: string;
  isDirty: boolean;
}

interface MultiFileEditorProps {
  initialProject?: ProjectStructure;
  onSave?: (project: ProjectStructure) => void;
  onDeploy?: (project: ProjectStructure) => void;
}

export function MultiFileEditor({
  initialProject,
  onSave,
  onDeploy
}: MultiFileEditorProps) {
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectStructure>(
    initialProject || {
      name: 'New Project',
      description: '',
      files: [],
      dependencies: {},
      devDependencies: {}
    }
  );
  
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });

  // Initialize file contents
  useEffect(() => {
    const contents: Record<string, string> = {};
    project.files.forEach(file => {
      contents[file.path] = file.content;
    });
    setFileContents(contents);
  }, [project.files]);

  // File tree
  const fileTree = buildFileTree(project.files);

  // Handle file selection
  const handleFileSelect = useCallback((file: ProjectFile) => {
    // Check if already open
    const existingTab = tabs.find(t => t.path === file.path);
    if (existingTab) {
      setActiveTab(file.path);
      return;
    }

    // Add new tab
    setTabs(prev => [...prev, { path: file.path, isDirty: false }]);
    setActiveTab(file.path);
  }, [tabs]);

  // Handle file content change
  const handleContentChange = useCallback((path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));
    setTabs(prev => prev.map(tab => 
      tab.path === path ? { ...tab, isDirty: true } : tab
    ));

    // Update project files
    setProject(prev => ({
      ...prev,
      files: prev.files.map(file => 
        file.path === path ? { ...file, content } : file
      )
    }));
  }, []);

  // Save file
  // const saveFile = useCallback((path: string) => {
  //   setTabs(prev => prev.map(tab => 
  //     tab.path === path ? { ...tab, isDirty: false } : tab
  //   ));

  //   toast({
  //     title: 'File saved',
  //     description: path,
  //   });
  // }, [toast]);

  // Close tab
  const closeTab = useCallback((path: string) => {
    const tabIndex = tabs.findIndex(t => t.path === path);
    setTabs(prev => prev.filter(t => t.path !== path));
    
    // Switch to adjacent tab
    if (activeTab === path && tabs.length > 1) {
      const newIndex = tabIndex > 0 ? tabIndex - 1 : 0;
      const newTab = tabs.filter(t => t.path !== path)[newIndex];
      if (newTab) {
        setActiveTab(newTab.path);
      }
    }
  }, [tabs, activeTab]);

  // Create file/directory
  const handleFileCreate = useCallback((path: string, type: 'file' | 'directory') => {
    if (type === 'file') {
      const extension = path.split('.').pop() || 'tsx';
      const language = extension === 'ts' || extension === 'tsx' ? 'typescript' :
                       extension === 'js' || extension === 'jsx' ? 'javascript' :
                       extension === 'css' ? 'css' :
                       extension === 'json' ? 'json' : 'typescript';

      const newFile: ProjectFile = {
        path,
        content: '',
        type: 'component',
        language: language as ProjectFile['language']
      };

      setProject(prev => ({
        ...prev,
        files: [...prev.files, newFile]
      }));
    }
  }, []);

  // Delete file
  const handleFileDelete = useCallback((path: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.filter(f => !f.path.startsWith(path))
    }));

    // Close tab if open
    closeTab(path);
  }, [closeTab]);

  // Rename file
  const handleFileRename = useCallback((oldPath: string, newPath: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.path === oldPath ? { ...f, path: newPath } : f
      )
    }));

    // Update tabs
    setTabs(prev => prev.map(tab => 
      tab.path === oldPath ? { ...tab, path: newPath } : tab
    ));

    if (activeTab === oldPath) {
      setActiveTab(newPath);
    }
  }, [activeTab]);

  // Validate project
  useEffect(() => {
    const result = validateProjectStructure(project);
    setValidation(result);
  }, [project]);

  // Save project
  const saveProject = useCallback(() => {
    if (onSave) {
      onSave(project);
    }

    // Mark all tabs as saved
    setTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));

    toast({
      title: 'Project saved',
      description: 'All files have been saved successfully',
    });
  }, [project, onSave, toast]);

  // Deploy project
  const deployProject = useCallback(() => {
    if (!validation.valid) {
      toast({
        title: 'Validation failed',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    if (onDeploy) {
      onDeploy(project);
    }
  }, [project, validation, onDeploy, toast]);

  // Export project
  const exportProject = useCallback(() => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [project]);

  // Import project
  const importProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as ProjectStructure;
        setProject(imported);
        setTabs([]);
        setActiveTab(null);
        
        toast({
          title: 'Project imported',
          description: 'Successfully imported project files',
        });
      } catch {
        toast({
          title: 'Import failed',
          description: 'Invalid project file format',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const activeFile = project.files.find(f => f.path === activeTab);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">{project.name}</h2>
          {!validation.valid && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{validation.errors.length} errors</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={saveProject}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            <Save className="w-4 h-4" />
            Save All
          </button>
          
          <button
            onClick={exportProject}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <label className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={importProject} className="hidden" />
          </label>
          
          {onDeploy && (
            <button
              onClick={deployProject}
              disabled={!validation.valid}
              className={cn(
                "flex items-center gap-2 px-3 py-1 text-sm rounded",
                validation.valid 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Play className="w-4 h-4" />
              Deploy
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 border-r">
          <ProjectExplorer
            fileTree={fileTree}
            selectedFile={activeTab || undefined}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRename}
            files={project.files}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="border-b flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
              {tabs.map(tab => (
                <div
                  key={tab.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 text-sm rounded cursor-pointer",
                    activeTab === tab.path 
                      ? "bg-white dark:bg-gray-800 border" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setActiveTab(tab.path)}
                >
                  <FileText className="w-3 h-3" />
                  <span>{tab.path.split('/').pop()}</span>
                  {tab.isDirty && <span className="text-orange-500">•</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.path);
                    }}
                    className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          {activeFile ? (
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={activeFile.language}
                value={fileContents[activeFile.path] || ''}
                onChange={(value) => handleContentChange(activeFile.path, value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="border-t p-4 bg-red-50 dark:bg-red-900/20">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Validation Errors</h3>
          <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}