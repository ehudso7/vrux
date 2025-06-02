import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const IndexSafe: NextPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Head>
        <title>VRUX - AI-Powered UI Component Generator</title>
        <meta name="description" content="Generate production-ready React components with AI" />
      </Head>

      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-12">
            <div className="flex justify-between items-center">
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                VRUX
              </h1>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                } transition-colors`}
              >
                {darkMode ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main>
            <div className="text-center mb-12">
              <h2 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AI-Powered UI Components
              </h2>
              <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Generate production-ready React components with Tailwind CSS
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Link href="/generate">
                <a className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Start Generating
                </a>
              </Link>
              <Link href="/viewcomfy-demo">
                <a className={`px-6 py-3 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}>
                  View Demo
                </a>
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className={`p-6 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  AI-Powered
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Leverage OpenAI and Anthropic models to generate high-quality components
                </p>
              </div>
              <div className={`p-6 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Production Ready
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Generated components include proper TypeScript types and best practices
                </p>
              </div>
              <div className={`p-6 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Live Preview
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  See your components in action with live preview and code editing
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default IndexSafe;