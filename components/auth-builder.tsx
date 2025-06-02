import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Mail,
  Chrome,
  Github,
  Twitter,
  Facebook,
  Wand2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  AuthConfig,
  generateSupabaseAuth,
  generateSignInComponent,
  generateSignUpComponent,
  generateProtectedRoute,
  generateUserProfile
} from '../lib/auth-generator';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

interface AuthBuilderProps {
  onAuthGenerated: (code: string) => void;
  darkMode?: boolean;
}

const providers = [
  { id: 'google', name: 'Google', icon: Chrome, color: 'bg-red-500' },
  { id: 'github', name: 'GitHub', icon: Github, color: 'bg-gray-800' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
];

export default function AuthBuilder({ onAuthGenerated, darkMode = false }: AuthBuilderProps) {
  const [config, setConfig] = useState<AuthConfig>({
    provider: 'supabase',
    features: {
      emailAuth: true,
      socialProviders: ['google', 'github'],
      magicLink: true,
      twoFactor: false,
      roles: false,
    },
    pages: {
      signIn: true,
      signUp: true,
      forgotPassword: true,
      profile: true,
      settings: false,
    },
  });

  const [previewMode, setPreviewMode] = useState<'signin' | 'signup' | 'profile'>('signin');
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const toggleProvider = (providerId: string) => {
    const socialProviders = [...config.features.socialProviders];
    const index = socialProviders.indexOf(providerId as 'google' | 'github' | 'twitter' | 'facebook');
    
    if (index > -1) {
      socialProviders.splice(index, 1);
    } else {
      socialProviders.push(providerId as 'google' | 'github' | 'twitter' | 'facebook');
    }
    
    setConfig({
      ...config,
      features: { ...config.features, socialProviders }
    });
  };

  const generateAuth = () => {
    let fullCode = `// VRUX Authentication System\n// Generated with ${config.provider} provider\n\n`;
    
    // Auth Hook
    fullCode += `// 1. Authentication Hook\n// Save as: lib/auth.ts\n\n`;
    fullCode += generateSupabaseAuth(config);
    fullCode += '\n\n';
    
    // Sign In Component
    if (config.pages.signIn) {
      fullCode += `// 2. Sign In Page\n// Save as: pages/signin.tsx\n\n`;
      fullCode += generateSignInComponent(config);
      fullCode += '\n\n';
    }
    
    // Sign Up Component
    if (config.pages.signUp) {
      fullCode += `// 3. Sign Up Page\n// Save as: pages/signup.tsx\n\n`;
      fullCode += generateSignUpComponent();
      fullCode += '\n\n';
    }
    
    // Protected Route
    fullCode += `// 4. Protected Route Wrapper\n// Save as: components/protected-route.tsx\n\n`;
    fullCode += generateProtectedRoute();
    fullCode += '\n\n';
    
    // User Profile
    if (config.pages.profile) {
      fullCode += `// 5. User Profile Page\n// Save as: pages/profile.tsx\n\n`;
      fullCode += generateUserProfile();
      fullCode += '\n\n';
    }
    
    // Environment Variables
    fullCode += `// 6. Environment Variables\n// Add to .env.local:\n\n`;
    fullCode += `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n`;
    fullCode += `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n`;
    
    setGeneratedCode(fullCode);
    onAuthGenerated(fullCode);
    toast.success('Authentication system generated!');
  };

  const getPreviewCode = () => {
    switch (previewMode) {
      case 'signin':
        return generateSignInComponent(config);
      case 'signup':
        return generateSignUpComponent();
      case 'profile':
        return generateUserProfile();
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Authentication Builder</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure and generate a complete auth system
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowCode(!showCode)}
          variant="ghost"
          className="flex items-center gap-2"
        >
          {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showCode ? 'Hide Code' : 'Show Code'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Provider Selection */}
          <div className={`rounded-xl p-6 border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Auth Provider</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['supabase', 'nextauth', 'clerk', 'custom'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setConfig({ ...config, provider })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.provider === provider
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : darkMode
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium capitalize">{provider}</span>
                  {provider === 'supabase' && (
                    <p className="text-xs text-gray-500 mt-1">Recommended</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className={`rounded-xl p-6 border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Authentication Features</h3>
            
            {/* Email Auth */}
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>Email & Password</span>
              </div>
              <input
                type="checkbox"
                checked={config.features.emailAuth}
                onChange={(e) => setConfig({
                  ...config,
                  features: { ...config.features, emailAuth: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            {/* Magic Link */}
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <Wand2 className="w-5 h-5 text-gray-500" />
                <span>Magic Link</span>
              </div>
              <input
                type="checkbox"
                checked={config.features.magicLink}
                onChange={(e) => setConfig({
                  ...config,
                  features: { ...config.features, magicLink: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            {/* Social Providers */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-3">Social Providers</p>
              <div className="grid grid-cols-2 gap-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => toggleProvider(provider.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      config.features.socialProviders.includes(provider.id as 'google' | 'github' | 'twitter' | 'facebook')
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : darkMode
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <provider.icon className="w-4 h-4" />
                    <span className="text-sm">{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pages */}
          <div className={`rounded-xl p-6 border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Generated Pages</h3>
            <div className="space-y-2">
              {Object.entries(config.pages).map(([page, enabled]) => (
                <label key={page} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <span className="capitalize">{page.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      pages: { ...config.pages, [page]: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateAuth}
            size="lg"
            className="w-full gradient-primary text-white"
          >
            Generate Authentication System
          </Button>
        </div>

        {/* Preview Panel */}
        <div className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Preview Tabs */}
          <div className={`flex items-center gap-1 p-2 border-b ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {config.pages.signIn && (
              <button
                onClick={() => setPreviewMode('signin')}
                className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                  previewMode === 'signin'
                    ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    : ''
                }`}
              >
                Sign In
              </button>
            )}
            {config.pages.signUp && (
              <button
                onClick={() => setPreviewMode('signup')}
                className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                  previewMode === 'signup'
                    ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    : ''
                }`}
              >
                Sign Up
              </button>
            )}
            {config.pages.profile && (
              <button
                onClick={() => setPreviewMode('profile')}
                className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                  previewMode === 'profile'
                    ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    : ''
                }`}
              >
                Profile
              </button>
            )}
          </div>

          {/* Code/Visual Preview */}
          {showCode ? (
            <div className="h-[600px]">
              <Editor
                language="typescript"
                value={getPreviewCode()}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  readOnly: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                }}
              />
            </div>
          ) : (
            <div className="p-8 overflow-auto h-[600px]">
              {/* Visual representation of auth pages */}
              <div className="text-center text-gray-500">
                <Shield className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p>Visual preview of {previewMode} page</p>
                <p className="text-sm mt-2">Click &quot;Show Code&quot; to see the generated code</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Code Modal */}
      {generatedCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Generated Authentication Code</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  toast.success('Code copied to clipboard!');
                }}
                size="sm"
                variant="ghost"
              >
                Copy All
              </Button>
              <Button
                onClick={() => setGeneratedCode('')}
                size="sm"
                variant="ghost"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            <pre className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <code>{generatedCode}</code>
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}