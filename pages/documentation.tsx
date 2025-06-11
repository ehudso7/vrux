import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Code2, Zap, 
  Copy, Check, ExternalLink,
  Search, FileCode, GitBranch, Lightbulb
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';

const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Zap className="w-5 h-5" />,
    subsections: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'installation', title: 'Installation' },
      { id: 'first-component', title: 'Your First Component' },
    ]
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: <Lightbulb className="w-5 h-5" />,
    subsections: [
      { id: 'how-it-works', title: 'How VRUX Works' },
      { id: 'prompts', title: 'Writing Effective Prompts' },
      { id: 'variants', title: 'Understanding Variants' },
      { id: 'customization', title: 'Customization' },
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: <Code2 className="w-5 h-5" />,
    subsections: [
      { id: 'endpoints', title: 'Endpoints' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'rate-limits', title: 'Rate Limits' },
      { id: 'examples', title: 'Code Examples' },
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: <GitBranch className="w-5 h-5" />,
    subsections: [
      { id: 'react', title: 'React Integration' },
      { id: 'nextjs', title: 'Next.js Setup' },
      { id: 'typescript', title: 'TypeScript Support' },
      { id: 'ci-cd', title: 'CI/CD Pipelines' },
    ]
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: <FileCode className="w-5 h-5" />,
    subsections: [
      { id: 'performance', title: 'Performance Tips' },
      { id: 'accessibility', title: 'Accessibility' },
      { id: 'seo', title: 'SEO Optimization' },
      { id: 'security', title: 'Security' },
    ]
  },
];

const codeExamples = {
  quickStart: `import { generateComponent } from '@vrux/sdk';

const component = await generateComponent({
  prompt: "Create a modern pricing card with gradient background",
  variant: "elegant",
  framework: "react"
});

console.log(component.code);`,
  
  apiExample: `curl -X POST https://api.vrux.dev/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a hero section with animated gradient",
    "variants": 3,
    "framework": "react"
  }'`,
  
  reactIntegration: `import { VruxProvider, useVrux } from '@vrux/react';

function App() {
  return (
    <VruxProvider apiKey={process.env.REACT_APP_VRUX_KEY}>
      <ComponentGenerator />
    </VruxProvider>
  );
}

function ComponentGenerator() {
  const { generate, isLoading } = useVrux();
  
  const handleGenerate = async () => {
    const result = await generate({
      prompt: "Modern dashboard with charts"
    });
  };
  
  return (
    <button onClick={handleGenerate}>
      {isLoading ? 'Generating...' : 'Generate Component'}
    </button>
  );
}`,
};

export default function DocumentationPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeSubsection, setActiveSubsection] = useState('introduction');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <Head>
        <title>Documentation - VRUX | Complete Guide</title>
        <meta name="description" content="Complete documentation for VRUX AI component generator. Learn how to use our API, integrate with your projects, and best practices." />
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
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
                <div className={`relative w-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} rounded-lg`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documentation..."
                    className={`w-full pl-10 pr-4 py-2 bg-transparent outline-none ${
                      darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
                    }`}
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">⌘K</kbd>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/api-reference">
                  <a className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    darkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-100'
                  } transition-colors flex items-center gap-2`}>
                    API Reference
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`w-64 min-h-screen border-r ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
          } sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Documentation</h2>
              
              <div className="space-y-6">
                {docSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        setActiveSubsection(section.subsections[0].id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-sm font-medium ${
                        activeSection === section.id
                          ? darkMode
                            ? 'bg-gray-800 text-white'
                            : 'bg-white shadow-sm'
                          : darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {section.icon}
                      {section.title}
                    </button>
                    
                    {activeSection === section.id && (
                      <div className="mt-2 ml-9 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => setActiveSubsection(subsection.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-md transition-all text-sm ${
                              activeSubsection === subsection.id
                                ? 'text-purple-600 font-medium'
                                : darkMode
                                  ? 'text-gray-400 hover:text-white'
                                  : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {subsection.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-8 py-12">
              {/* Quick Start Section */}
              {activeSection === 'getting-started' && activeSubsection === 'quick-start' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Get up and running with VRUX in under 5 minutes.
                  </p>

                  <div className="space-y-8">
                    <section>
                      <h2 className="text-2xl font-semibold mb-4">1. Install the SDK</h2>
                      <div className={`relative rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                          <span className="text-sm font-medium">Terminal</span>
                          <button
                            onClick={() => handleCopyCode('npm install @vrux/sdk', 'npm-install')}
                            className="text-sm flex items-center gap-1 hover:text-purple-600"
                          >
                            {copiedCode === 'npm-install' ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-sm overflow-x-auto">
                          <code className="text-purple-600">npm install @vrux/sdk</code>
                        </pre>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">2. Set up your API key</h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Get your API key from the dashboard and add it to your environment variables.
                      </p>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <code className="text-sm">VRUX_API_KEY=your_api_key_here</code>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">3. Generate your first component</h2>
                      <div className={`relative rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                          <span className="text-sm font-medium">JavaScript</span>
                          <button
                            onClick={() => handleCopyCode(codeExamples.quickStart, 'quick-start')}
                            className="text-sm flex items-center gap-1 hover:text-purple-600"
                          >
                            {copiedCode === 'quick-start' ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-sm overflow-x-auto">
                          <code>{codeExamples.quickStart}</code>
                        </pre>
                      </div>
                    </section>

                    <div className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-purple-900/10 border-purple-800' : 'bg-purple-50 border-purple-200'
                    }`}>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        Pro Tip
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Use descriptive prompts with specific design requirements for best results. 
                        Mention colors, layouts, and interactions you want.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* How It Works Section */}
              {activeSection === 'core-concepts' && activeSubsection === 'how-it-works' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-4xl font-bold mb-4">How VRUX Works</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Understanding the AI-powered component generation process.
                  </p>

                  <div className="space-y-12">
                    <section>
                      <h2 className="text-2xl font-semibold mb-6">The Generation Process</h2>
                      
                      <div className="space-y-6">
                        {[
                          {
                            step: 1,
                            title: 'Natural Language Processing',
                            description: 'Your prompt is analyzed to understand design requirements, functionality, and styling preferences.',
                          },
                          {
                            step: 2,
                            title: 'Component Architecture',
                            description: 'VRUX determines the optimal component structure, choosing appropriate React patterns and hooks.',
                          },
                          {
                            step: 3,
                            title: 'Style Generation',
                            description: 'Modern, responsive styles are generated using Tailwind CSS or CSS-in-JS based on your preferences.',
                          },
                          {
                            step: 4,
                            title: 'Variant Creation',
                            description: 'Multiple design variations are created, each with unique styling while maintaining core functionality.',
                          },
                          {
                            step: 5,
                            title: 'Code Optimization',
                            description: 'Generated code is optimized for performance, accessibility, and best practices.',
                          },
                        ].map((item) => (
                          <div key={item.step} className="flex gap-6">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                                {item.step}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                              <p className="text-gray-600 dark:text-gray-300">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">AI Models</h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        VRUX uses state-of-the-art language models fine-tuned specifically for UI component generation:
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                          <h3 className="font-semibold mb-3">GPT-4 Turbo</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Powers complex component logic and advanced interactions with superior reasoning capabilities.
                          </p>
                        </div>
                        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                          <h3 className="font-semibold mb-3">Custom Fine-tuned Models</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Specialized models trained on millions of UI components for optimal design patterns.
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}

              {/* React Integration Section */}
              {activeSection === 'integrations' && activeSubsection === 'react' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-4xl font-bold mb-4">React Integration</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Seamlessly integrate VRUX into your React applications.
                  </p>

                  <div className="space-y-8">
                    <section>
                      <h2 className="text-2xl font-semibold mb-4">Installation</h2>
                      <div className={`relative rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <pre className="p-4 text-sm overflow-x-auto">
                          <code>npm install @vrux/react</code>
                        </pre>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>
                      <div className={`relative rounded-lg overflow-hidden ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                          <span className="text-sm font-medium">React</span>
                          <button
                            onClick={() => handleCopyCode(codeExamples.reactIntegration, 'react-integration')}
                            className="text-sm flex items-center gap-1 hover:text-purple-600"
                          >
                            {copiedCode === 'react-integration' ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-sm overflow-x-auto">
                          <code>{codeExamples.reactIntegration}</code>
                        </pre>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-semibold mb-4">Available Hooks</h2>
                      <div className="space-y-4">
                        {[
                          { name: 'useVrux', description: 'Main hook for component generation' },
                          { name: 'useVruxHistory', description: 'Access generation history' },
                          { name: 'useVruxTemplates', description: 'Browse and use templates' },
                          { name: 'useVruxConfig', description: 'Configure generation settings' },
                        ].map((hook) => (
                          <div key={hook.name} className={`p-4 rounded-lg ${
                            darkMode ? 'bg-gray-900' : 'bg-gray-50'
                          }`}>
                            <code className="text-purple-600 font-medium">{hook.name}</code>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {hook.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}