import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Copy, Check, ChevronRight,
  Terminal, Key, Shield, Zap
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const apiEndpoints = [
  {
    category: 'Generation',
    endpoints: [
      {
        method: 'POST',
        path: '/api/generate-ui',
        description: 'Generate a single UI component',
        auth: true,
        params: {
          prompt: 'string - Description of the component to generate',
          framework: 'string - Target framework (react, vue, angular)',
          typescript: 'boolean - Generate TypeScript code',
          styling: 'string - Styling approach (tailwind, css-in-js, css)'
        },
        response: {
          code: 'string - Generated component code',
          preview: 'string - Preview URL',
          metadata: 'object - Component metadata'
        }
      },
      {
        method: 'POST',
        path: '/api/generate-ui-stream',
        description: 'Generate UI components with streaming response',
        auth: true,
        params: {
          prompt: 'string - Description of the component',
          variants: 'number - Number of variants to generate (1-3)',
          stream: 'boolean - Enable streaming response'
        },
        response: 'Server-Sent Events stream'
      }
    ]
  },
  {
    category: 'Authentication',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/signup',
        description: 'Create a new user account',
        auth: false,
        params: {
          email: 'string - User email address',
          password: 'string - User password (min 8 chars)',
          name: 'string - User display name'
        },
        response: {
          user: 'object - User profile',
          token: 'string - JWT auth token'
        }
      },
      {
        method: 'POST',
        path: '/api/auth/signin',
        description: 'Sign in to existing account',
        auth: false,
        params: {
          email: 'string - User email address',
          password: 'string - User password'
        },
        response: {
          user: 'object - User profile',
          token: 'string - JWT auth token'
        }
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user profile',
        auth: true,
        response: {
          user: 'object - User profile',
          usage: 'object - API usage statistics'
        }
      }
    ]
  },
  {
    category: 'Templates',
    endpoints: [
      {
        method: 'GET',
        path: '/api/templates',
        description: 'List available component templates',
        auth: false,
        params: {
          category: 'string - Filter by category',
          page: 'number - Page number',
          limit: 'number - Items per page'
        },
        response: {
          templates: 'array - List of templates',
          total: 'number - Total count',
          pages: 'number - Total pages'
        }
      },
      {
        method: 'POST',
        path: '/api/templates/:id/generate',
        description: 'Generate component from template',
        auth: true,
        params: {
          variables: 'object - Template variables',
          framework: 'string - Target framework'
        },
        response: {
          code: 'string - Generated code',
          preview: 'string - Preview URL'
        }
      }
    ]
  },
  {
    category: 'Sharing',
    endpoints: [
      {
        method: 'POST',
        path: '/api/share',
        description: 'Create a shareable link for a component',
        auth: true,
        params: {
          code: 'string - Component code',
          title: 'string - Component title',
          description: 'string - Component description',
          expiresIn: 'number - Link expiration in days'
        },
        response: {
          id: 'string - Share ID',
          url: 'string - Shareable URL',
          expiresAt: 'string - Expiration date'
        }
      }
    ]
  }
];

const codeExamples = {
  javascript: `// Generate a UI component
const response = await fetch('https://api.vrux.dev/generate-ui', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a modern pricing card with gradient background',
    framework: 'react',
    typescript: true
  })
});

const { code, preview } = await response.json();
console.log(code);`,
  
  python: `import requests

# Generate a UI component
response = requests.post(
    'https://api.vrux.dev/generate-ui',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'prompt': 'Create a modern pricing card with gradient background',
        'framework': 'react',
        'typescript': True
    }
)

data = response.json()
print(data['code'])`,
  
  curl: `curl -X POST https://api.vrux.dev/generate-ui \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a modern pricing card with gradient background",
    "framework": "react",
    "typescript": true
  }'`
};

export default function ApiReferencePage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Generation');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleCopyEndpoint = async (endpoint: string) => {
    try {
      await navigator.clipboard.writeText(`https://api.vrux.dev${endpoint}`);
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const selectedCategoryData = apiEndpoints.find(cat => cat.category === selectedCategory);

  return (
    <>
      <Head>
        <title>API Reference - VRUX | Developer Documentation</title>
        <meta name="description" content="Complete API reference for VRUX. Learn how to integrate AI component generation into your applications." />
      </Head>

      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
        {/* Navigation */}
        <nav className={`border-b ${darkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                <a className="flex items-center gap-2 group">
                  <div className={`w-9 h-9 ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight">VRUX</span>
                </a>
              </Link>
              
              <button
                onClick={() => router.push('/signin')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                Get API Key
              </button>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`w-64 min-h-screen border-r ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
          } sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">API Reference</h2>
              
              <div className="space-y-2">
                {apiEndpoints.map((category) => (
                  <button
                    key={category.category}
                    onClick={() => setSelectedCategory(category.category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center justify-between ${
                      selectedCategory === category.category
                        ? darkMode
                          ? 'bg-gray-800 text-white'
                          : 'bg-white shadow-sm'
                        : darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {category.category}
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      selectedCategory === category.category ? 'rotate-90' : ''
                    }`} />
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold mb-3 text-gray-500 dark:text-gray-400">Quick Links</h3>
                <div className="space-y-2">
                  <a href="#authentication" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600">
                    Authentication
                  </a>
                  <a href="#rate-limits" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600">
                    Rate Limits
                  </a>
                  <a href="#errors" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600">
                    Error Codes
                  </a>
                  <a href="#sdks" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600">
                    SDKs
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <section className="px-8 py-12 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-4xl font-bold mb-4">{selectedCategory} API</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {selectedCategory === 'Generation' && 'Generate UI components programmatically with our powerful AI API.'}
                {selectedCategory === 'Authentication' && 'Secure authentication endpoints for user management.'}
                {selectedCategory === 'Templates' && 'Access and use pre-built component templates.'}
                {selectedCategory === 'Sharing' && 'Create and manage shareable component links.'}
              </p>
            </section>

            {/* Endpoints */}
            <section className="px-8 py-8">
              {selectedCategoryData?.endpoints.map((endpoint, index) => (
                <motion.div
                  key={endpoint.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`mb-12 p-6 rounded-xl ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded ${
                          endpoint.method === 'GET' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-lg font-mono">{endpoint.path}</code>
                        {endpoint.auth && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <Key className="w-3 h-3" />
                            Auth Required
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {endpoint.description}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleCopyEndpoint(endpoint.path)}
                      className={`p-2 rounded-lg ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {copiedEndpoint === endpoint.path ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Parameters */}
                  {endpoint.params && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Parameters</h4>
                      <div className={`rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        {Object.entries(endpoint.params).map(([key, value]) => (
                          <div key={key} className={`px-4 py-3 border-b ${
                            darkMode ? 'border-gray-700' : 'border-gray-200'
                          } last:border-0`}>
                            <code className="text-purple-600 font-mono text-sm">{key}</code>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {value as string}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4 className="font-semibold mb-3">Response</h4>
                    <div className={`rounded-lg p-4 font-mono text-sm ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      {typeof endpoint.response === 'string' ? (
                        <p>{endpoint.response}</p>
                      ) : (
                        <pre>{JSON.stringify(endpoint.response, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </section>

            {/* Code Examples */}
            <section className="px-8 py-8 border-t border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
              
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  {Object.keys(codeExamples).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLanguage === lang
                          ? 'bg-purple-600 text-white'
                          : darkMode
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl overflow-hidden ${
                darkMode ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <div className={`px-4 py-3 border-b ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'
                } flex items-center justify-between`}>
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Example Request
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(codeExamples[selectedLanguage as keyof typeof codeExamples])}
                    className={`p-1.5 rounded ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                    } transition-colors`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="p-6 overflow-x-auto">
                  <code className="text-sm">
                    {codeExamples[selectedLanguage as keyof typeof codeExamples]}
                  </code>
                </pre>
              </div>
            </section>

            {/* Additional Info */}
            <section className="px-8 py-8 space-y-8">
              <div id="authentication">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  All authenticated endpoints require a valid API key. Include your API key in the Authorization header:
                </p>
                <div className={`rounded-lg p-4 font-mono text-sm ${
                  darkMode ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </div>

              <div id="rate-limits">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Rate Limits
                </h3>
                <div className={`rounded-lg overflow-hidden ${
                  darkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <table className="w-full">
                    <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="px-4 py-3 text-left">Plan</th>
                        <th className="px-4 py-3 text-left">Requests/minute</th>
                        <th className="px-4 py-3 text-left">Requests/day</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <td className="px-4 py-3">Free</td>
                        <td className="px-4 py-3">10</td>
                        <td className="px-4 py-3">100</td>
                      </tr>
                      <tr className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <td className="px-4 py-3">Pro</td>
                        <td className="px-4 py-3">60</td>
                        <td className="px-4 py-3">10,000</td>
                      </tr>
                      <tr className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <td className="px-4 py-3">Enterprise</td>
                        <td className="px-4 py-3">Unlimited</td>
                        <td className="px-4 py-3">Unlimited</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}