import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Globe,
  Github,
  Loader2,
  Check,
  X,
  ExternalLink,
  Settings,
  Copy,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  DeploymentConfig,
  deploymentProviders,
  deployProject,
  createGitHubRepo,
  DeploymentResult
} from '../lib/deployment-manager';
import toast from 'react-hot-toast';

interface DeploymentPanelProps {
  code: string;
  projectName?: string;
  onDeploymentComplete?: (result: DeploymentResult) => void;
  darkMode?: boolean;
}

export default function DeploymentPanel({ 
  code, 
  projectName = 'my-vrux-app',
  onDeploymentComplete,
  darkMode = false 
}: DeploymentPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof deploymentProviders>('vercel');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [createGithub, setCreateGithub] = useState(true);
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  
  const [config, setConfig] = useState<DeploymentConfig>({
    provider: 'vercel',
    projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
    framework: 'react',
    environmentVariables: {},
  });

  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      // Create GitHub repo if requested
      if (createGithub) {
        const githubResult = await createGitHubRepo(
          config.projectName,
          [{ path: 'src/App.tsx', content: code }],
          isPrivateRepo
        );
        
        if (!githubResult.success) {
          toast.error(`GitHub: ${githubResult.error}`);
        } else {
          toast.success(`GitHub repo created: ${githubResult.repoUrl}`);
        }
      }

      // Convert env vars array to object
      const envObject = envVars.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Deploy project
      const result = await deployProject(
        { ...config, environmentVariables: envObject },
        code
      );

      setDeploymentResult(result);
      
      if (result.success) {
        toast.success(`Deployed to ${deploymentProviders[selectedProvider].name}!`);
        onDeploymentComplete?.(result);
      } else {
        toast.error(result.error || 'Deployment failed');
      }
    } catch (error) {
      toast.error('Deployment failed');
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Deploy Your App</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              One-click deployment to your favorite platform
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Provider Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Deployment Platform</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(deploymentProviders).map(([key, provider]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedProvider(key as keyof typeof deploymentProviders);
                setConfig({ ...config, provider: key as 'vercel' | 'netlify' | 'railway' });
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedProvider === key
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : darkMode
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-4xl mb-3 ${provider.color} bg-clip-text text-transparent font-bold`}>
                {provider.icon}
              </div>
              <h4 className="font-semibold text-lg mb-1">{provider.name}</h4>
              <div className="flex flex-wrap gap-1 justify-center">
                {provider.features.map((feature, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border p-6 space-y-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                value={config.projectName}
                onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="my-awesome-app"
              />
            </div>

            {/* Framework */}
            <div>
              <label className="block text-sm font-medium mb-2">Framework</label>
              <select
                value={config.framework}
                onChange={(e) => setConfig({ ...config, framework: e.target.value as 'react' | 'nextjs' | 'vue' | 'svelte' })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              >
                <option value="react">React (Vite)</option>
                <option value="nextjs">Next.js</option>
                <option value="vue">Vue</option>
                <option value="svelte">Svelte</option>
              </select>
            </div>

            {/* GitHub Integration */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={createGithub}
                  onChange={(e) => setCreateGithub(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <Github className="w-5 h-5" />
                <span>Create GitHub Repository</span>
              </label>
              
              {createGithub && (
                <label className="flex items-center gap-3 ml-8">
                  <input
                    type="checkbox"
                    checked={isPrivateRepo}
                    onChange={(e) => setIsPrivateRepo(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm">Make repository private</span>
                </label>
              )}
            </div>

            {/* Environment Variables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Environment Variables</label>
                <button
                  onClick={addEnvVar}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Variable
                </button>
              </div>
              
              <div className="space-y-2">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      placeholder="KEY"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      placeholder="value"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <button
                      onClick={() => removeEnvVar(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          size="lg"
          className="gradient-primary text-white px-8"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Deploy to {deploymentProviders[selectedProvider].name}
            </>
          )}
        </Button>
      </div>

      {/* Deployment Result */}
      <AnimatePresence>
        {deploymentResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-xl p-6 ${
              deploymentResult.success
                ? darkMode
                  ? 'bg-green-900/20 border-green-800'
                  : 'bg-green-50 border-green-200'
                : darkMode
                ? 'bg-red-900/20 border-red-800'
                : 'bg-red-50 border-red-200'
            } border`}
          >
            <div className="flex items-start gap-3">
              {deploymentResult.success ? (
                <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <X className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">
                  {deploymentResult.success ? 'Deployment Successful!' : 'Deployment Failed'}
                </h4>
                
                {deploymentResult.url && (
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <a
                      href={deploymentResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {deploymentResult.url}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(deploymentResult.url!);
                        toast.success('URL copied!');
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {deploymentResult.error && (
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{deploymentResult.error}</p>
                  </div>
                )}
                
                {deploymentResult.logs && deploymentResult.logs.length > 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <p className="text-xs font-mono">
                      {deploymentResult.logs.join('\n')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}