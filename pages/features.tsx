import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Zap, Code2, Palette, Layers, Eye, 
  Download, Share2, Smartphone, Globe, Shield, 
  Wand2, Command, GitBranch, Lock,
  ArrowRight
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const features = [
  {
    category: 'AI Generation',
    items: [
      {
        icon: <Sparkles className="w-6 h-6" />,
        title: 'GPT-4 Powered',
        description: 'State-of-the-art AI model trained on millions of UI components for exceptional results.',
      },
      {
        icon: <Zap className="w-6 h-6" />,
        title: 'Lightning Fast',
        description: 'Generate complete components in seconds with real-time streaming preview.',
      },
      {
        icon: <Wand2 className="w-6 h-6" />,
        title: 'Smart Prompts',
        description: 'AI-enhanced prompts that understand context and generate exactly what you need.',
      },
    ],
  },
  {
    category: 'Design & Code',
    items: [
      {
        icon: <Layers className="w-6 h-6" />,
        title: 'Multiple Variants',
        description: 'Get 3 unique design variations for every component - Modern, Bold, and Elegant.',
      },
      {
        icon: <Code2 className="w-6 h-6" />,
        title: 'Production Ready',
        description: 'Clean, accessible React code with TypeScript support and modern best practices.',
      },
      {
        icon: <Palette className="w-6 h-6" />,
        title: 'Fully Customizable',
        description: 'Edit generated code in real-time with syntax highlighting and instant preview.',
      },
    ],
  },
  {
    category: 'Developer Experience',
    items: [
      {
        icon: <Eye className="w-6 h-6" />,
        title: 'Live Preview',
        description: 'See your components come to life instantly with hot-reload preview.',
      },
      {
        icon: <Smartphone className="w-6 h-6" />,
        title: 'Responsive Design',
        description: 'Preview components on desktop, tablet, and mobile viewports.',
      },
      {
        icon: <Command className="w-6 h-6" />,
        title: 'Keyboard Shortcuts',
        description: 'Professional workflow with comprehensive keyboard shortcuts.',
      },
    ],
  },
  {
    category: 'Collaboration',
    items: [
      {
        icon: <Share2 className="w-6 h-6" />,
        title: 'Easy Sharing',
        description: 'Share components with your team via secure links.',
      },
      {
        icon: <Download className="w-6 h-6" />,
        title: 'Export Options',
        description: 'Download components as React, Vue, or vanilla JavaScript.',
      },
      {
        icon: <GitBranch className="w-6 h-6" />,
        title: 'Version History',
        description: 'Track all your generations with automatic history and restore.',
      },
    ],
  },
  {
    category: 'Enterprise',
    items: [
      {
        icon: <Shield className="w-6 h-6" />,
        title: 'Enterprise Security',
        description: 'SOC 2 compliant with encryption at rest and in transit.',
      },
      {
        icon: <Globe className="w-6 h-6" />,
        title: 'Global CDN',
        description: 'Lightning-fast performance worldwide with edge deployment.',
      },
      {
        icon: <Lock className="w-6 h-6" />,
        title: 'Private Models',
        description: 'Deploy custom AI models trained on your design system.',
      },
    ],
  },
];

export default function FeaturesPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>Features - VRUX | AI Component Generator</title>
        <meta name="description" content="Explore all the powerful features of VRUX - from AI-powered generation to enterprise security." />
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
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Everything you need to
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  build faster
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Professional tools and features designed for modern developers. 
                Ship production-ready components in minutes, not hours.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {features.map((category, categoryIndex) => (
              <div key={category.category} className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold mb-4">{category.category}</h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full" />
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                  {category.items.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`group relative p-8 rounded-2xl ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } shadow-lg hover:shadow-xl transition-all`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to accelerate your development?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of developers building faster with VRUX.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/signup')}
                  className="group px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium shadow-2xl shadow-black/25 hover:shadow-black/30 transition-all flex items-center gap-3"
                >
                  Start Building Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/pricing')}
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  View Pricing
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}