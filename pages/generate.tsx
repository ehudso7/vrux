import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { 
  Sparkles,
  ArrowLeft,
  Moon,
  Sun,
  Github
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import AdvancedGenerationInterface from '../components/advanced-generation-interface';

const Generate: NextPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Head>
        <title>Generate - VRUX</title>
        <meta name="description" content="Generate AI-powered React components with VRUX" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Tooltip.Provider delayDuration={200}>
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
          {/* Simplified Navigation */}
          <nav className={`border-b ${darkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-xl sticky top-0 z-50`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-lg ${
                        darkMode 
                          ? 'hover:bg-gray-800 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-600'
                      } transition-colors`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  
                  <motion.div 
                    className="flex items-center gap-2 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-9 h-9 ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">VRUX</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">BETA</span>
                  </motion.div>
                </div>

                <div className="flex items-center gap-4">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-2 rounded-lg ${
                          darkMode 
                            ? 'hover:bg-gray-800 text-gray-400' 
                            : 'hover:bg-gray-100 text-gray-600'
                        } transition-colors`}
                      >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content 
                      side="bottom" 
                      className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                    >
                      Toggle theme
                    </Tooltip.Content>
                  </Tooltip.Root>

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <a 
                        href="https://github.com/vrux/app" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg ${
                          darkMode 
                            ? 'hover:bg-gray-800 text-gray-400' 
                            : 'hover:bg-gray-100 text-gray-600'
                        } transition-colors`}
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                      View on GitHub
                    </Tooltip.Content>
                  </Tooltip.Root>
                </div>
              </div>
            </div>
          </nav>

          {/* Generation Interface */}
          <AdvancedGenerationInterface darkMode={darkMode} />

          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: darkMode ? 'dark' : '',
              style: {
                background: darkMode ? '#1F2937' : '#FFFFFF',
                color: darkMode ? '#F3F4F6' : '#111827',
                border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          />
        </div>
      </Tooltip.Provider>
    </>
  );
};

export default Generate;