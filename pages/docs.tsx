import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Book,
  Code2,
  Sparkles,
  FileText,
  Terminal,
  Palette,
  Layers,
  Settings,
  Shield,
  Zap,
  Search,
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'how-it-works', title: 'How It Works' },
      { id: 'first-component', title: 'Your First Component' }
    ]
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: Layers,
    items: [
      { id: 'prompts', title: 'Writing Effective Prompts' },
      { id: 'variants', title: 'Component Variants' },
      { id: 'customization', title: 'Customization' },
      { id: 'export', title: 'Exporting Code' }
    ]
  },
  {
    id: 'components',
    title: 'Components',
    icon: Code2,
    items: [
      { id: 'forms', title: 'Forms & Inputs' },
      { id: 'navigation', title: 'Navigation' },
      { id: 'layouts', title: 'Layouts' },
      { id: 'data-display', title: 'Data Display' }
    ]
  },
  {
    id: 'styling',
    title: 'Styling',
    icon: Palette,
    items: [
      { id: 'tailwind', title: 'Tailwind CSS' },
      { id: 'themes', title: 'Themes' },
      { id: 'dark-mode', title: 'Dark Mode' },
      { id: 'animations', title: 'Animations' }
    ]
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Terminal,
    items: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'endpoints', title: 'Endpoints' },
      { id: 'rate-limits', title: 'Rate Limits' },
      { id: 'examples', title: 'Examples' }
    ]
  }
];

const content: Record<string, { title: string; content: string }> = {
  introduction: {
    title: 'Introduction',
    content: `
# Introduction to VRUX

VRUX is an AI-powered tool that generates production-ready React components with Tailwind CSS styling. Simply describe what you want, and VRUX will create beautiful, responsive UI components instantly.

## Key Features

- **Natural Language Input**: Describe your component in plain English
- **Instant Generation**: Get working code in seconds
- **Multiple Variants**: Generate different styles for the same component
- **Live Preview**: See your component in action before exporting
- **Clean Code**: Production-ready React and Tailwind CSS

## Why VRUX?

Building UI components from scratch is time-consuming. VRUX accelerates your development workflow by:

1. Eliminating boilerplate code
2. Providing consistent, accessible components
3. Following React and Tailwind best practices
4. Offering instant iterations and variations

Ready to get started? Check out our Quick Start guide!
    `
  },
  'quick-start': {
    title: 'Quick Start',
    content: `
# Quick Start

Get up and running with VRUX in minutes.

## Step 1: Sign Up

Create a free account to start generating components. No credit card required.

## Step 2: Describe Your Component

In the input field, describe what you want to build. For example:

> "Create a modern pricing card with a purple gradient background, white text, and a glowing effect on hover"

## Step 3: Generate

Click the Generate button or press Cmd/Ctrl + Enter. VRUX will create your component in seconds.

## Step 4: Customize

- Use the variant selector to see different styles
- Edit the code directly in the editor
- Toggle between desktop/tablet/mobile views

## Step 5: Export

Copy the code or download it as a file. The generated code is ready to use in your React project.

## Example Prompts

- "Hero section with animated gradient background"
- "Multi-step form with progress indicator"
- "Dashboard sidebar with collapsible menu"
- "Product gallery with filters and sorting"
    `
  }
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent = content[activeSection] || content.introduction;

  return (
    <>
      <Head>
        <title>Documentation - VRUX</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Navigation */}
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <a className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    VRUX
                  </span>
                </a>
              </Link>

              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <a className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    Dashboard
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <nav className="space-y-6">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id}>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </h3>
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                                activeSection === item.id
                                  ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {item.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-4xl mx-auto px-8 py-12">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                {currentContent.title}
              </h1>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  {currentContent.content.split('\n').map((paragraph, i) => {
                    if (paragraph.startsWith('#')) {
                      const level = paragraph.match(/^#+/)?.[0].length || 1;
                      const text = paragraph.replace(/^#+\s*/, '');
                      
                      if (level === 1) {
                        return <h1 key={i} className="text-3xl font-bold mb-6 mt-8">{text}</h1>;
                      } else if (level === 2) {
                        return <h2 key={i} className="text-2xl font-semibold mb-4 mt-6">{text}</h2>;
                      } else {
                        return <h3 key={i} className="text-xl font-medium mb-3 mt-4">{text}</h3>;
                      }
                    }
                    
                    if (paragraph.startsWith('>')) {
                      return (
                        <blockquote key={i} className="border-l-4 border-purple-500 pl-4 italic text-gray-600 dark:text-gray-400">
                          {paragraph.replace(/^>\s*/, '')}
                        </blockquote>
                      );
                    }
                    
                    if (paragraph.startsWith('-') || paragraph.match(/^\d+\./)) {
                      return (
                        <li key={i} className="ml-6">
                          {paragraph.replace(/^[-\d]+\.\s*/, '')}
                        </li>
                      );
                    }
                    
                    if (paragraph.trim()) {
                      return <p key={i} className="mb-4">{paragraph}</p>;
                    }
                    
                    return null;
                  })}
                </div>
              </div>

              {/* Code Example */}
              {activeSection === 'quick-start' && (
                <div className="mt-8 bg-gray-900 rounded-lg p-4 relative">
                  <button
                    onClick={() => handleCopy('npm install @vrux/cli')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <pre className="text-gray-300 font-mono text-sm">
                    <code>npm install @vrux/cli</code>
                  </pre>
                </div>
              )}

              {/* Related Links */}
              <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Related Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="#"
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">API Reference</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </a>
                  <a 
                    href="#"
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Code Examples</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}