import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  X,
  GitBranch,
  FolderOpen,
  Settings,
  Loader2,
  Check
} from 'lucide-react';
import { MultiFileEditor } from './multi-file-editor';
import { 
  ProjectStructure, 
  ProjectGenerationConfig,
  projectTemplates
} from '@/lib/project-manager';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MultiFileWorkspaceProps {
  onClose: () => void;
  darkMode: boolean;
  onDeploy?: (project: ProjectStructure) => void;
}

export function MultiFileWorkspace({ 
  onClose, 
  darkMode, 
  onDeploy
}: MultiFileWorkspaceProps) {
  const [step, setStep] = useState<'setup' | 'editor'>('setup');
  const [projectConfig, setProjectConfig] = useState<ProjectGenerationConfig>({
    prompt: '',
    template: 'next-app',
    features: [],
    styling: 'tailwind',
    testing: false,
    authentication: false,
    database: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<ProjectStructure | null>(null);

  const handleProjectGenerate = async () => {
    if (!projectConfig.prompt) {
      toast.error('Please describe your project');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to generate project');
      }

      const { project } = await response.json();
      setProject(project);
      setStep('editor');
      
      toast.success('Project generated successfully!', {
        icon: '🎉',
        duration: 3000
      });
    } catch {
      toast.error('Failed to generate project');
    } finally {
      setIsGenerating(false);
    }
  };

  const features = [
    { id: 'api', name: 'API Routes', icon: <Package className="w-4 h-4" /> },
    { id: 'database', name: 'Database', icon: <Settings className="w-4 h-4" /> },
    { id: 'auth', name: 'Authentication', icon: <Settings className="w-4 h-4" /> },
    { id: 'testing', name: 'Testing', icon: <Check className="w-4 h-4" /> },
    { id: 'docker', name: 'Docker', icon: <Package className="w-4 h-4" /> },
    { id: 'ci', name: 'CI/CD', icon: <GitBranch className="w-4 h-4" /> }
  ];

  if (step === 'editor' && project) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col"
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-6 py-3 border-b",
          darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <MultiFileEditor
            initialProject={project}
            onSave={(updatedProject) => {
              setProject(updatedProject);
            }}
            onDeploy={onDeploy}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden",
          darkMode ? "bg-gray-900" : "bg-white"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b",
          darkMode ? "border-gray-800" : "border-gray-200"
        )}>
          <div>
            <h2 className="text-2xl font-bold mb-1">Create Multi-File Project</h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Build complete applications with multiple files and folders
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What are you building?
            </label>
            <textarea
              value={projectConfig.prompt}
              onChange={(e) => setProjectConfig(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="Describe your project in detail... (e.g., 'A task management app with user authentication and real-time updates')"
              className={cn(
                "w-full px-4 py-3 rounded-lg resize-none",
                darkMode 
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400",
                "border focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              rows={3}
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Choose a template
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(projectTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setProjectConfig(prev => ({ ...prev, template: key as 'next-app' | 'react-spa' | 'component-library' | 'custom' }))}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    projectConfig.template === key
                      ? darkMode
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-blue-500 bg-blue-50"
                      : darkMode
                        ? "border-gray-700 hover:border-gray-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Package className="w-6 h-6 mb-2 mx-auto text-blue-500" />
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className={cn(
                    "text-xs mt-1",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Additional features
            </label>
            <div className="grid grid-cols-3 gap-3">
              {features.map((feature) => {
                const isSelected = feature.id === 'testing' ? projectConfig.testing :
                                  feature.id === 'database' ? projectConfig.database :
                                  feature.id === 'auth' ? projectConfig.authentication :
                                  projectConfig.features?.includes(feature.id);
                
                return (
                  <button
                    key={feature.id}
                    onClick={() => {
                      if (feature.id === 'testing') {
                        setProjectConfig(prev => ({ ...prev, testing: !prev.testing }));
                      } else if (feature.id === 'database') {
                        setProjectConfig(prev => ({ ...prev, database: !prev.database }));
                      } else if (feature.id === 'auth') {
                        setProjectConfig(prev => ({ ...prev, authentication: !prev.authentication }));
                      } else {
                        setProjectConfig(prev => ({
                          ...prev,
                          features: isSelected
                            ? prev.features?.filter(f => f !== feature.id)
                            : [...(prev.features || []), feature.id]
                        }));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                      isSelected
                        ? darkMode
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-blue-500 bg-blue-50 text-blue-600"
                        : darkMode
                          ? "border-gray-700 hover:border-gray-600"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {feature.icon}
                    <span className="text-sm">{feature.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Styling */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Styling framework
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['tailwind', 'styled-components', 'css-modules', 'sass'].map((style) => (
                <button
                  key={style}
                  onClick={() => setProjectConfig(prev => ({ ...prev, styling: style as 'tailwind' | 'styled-components' | 'css-modules' | 'sass' }))}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-all text-sm",
                    projectConfig.styling === style
                      ? darkMode
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-blue-500 bg-blue-50 text-blue-600"
                      : darkMode
                        ? "border-gray-700 hover:border-gray-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-end gap-3 px-6 py-4 border-t",
          darkMode ? "bg-gray-850 border-gray-800" : "bg-gray-50 border-gray-200"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleProjectGenerate}
            disabled={!projectConfig.prompt || isGenerating}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all",
              "bg-blue-500 text-white hover:bg-blue-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Project
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}