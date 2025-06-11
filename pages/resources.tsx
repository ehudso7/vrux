import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Book, Video, Download, 
  ExternalLink, BookOpen, Users,
  Github, Youtube, MessageSquare, Zap
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';

const resourceCategories = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API references',
    icon: <Book className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    resources: [
      {
        title: 'Getting Started Guide',
        description: 'Learn the basics of VRUX in this step-by-step tutorial',
        type: 'Guide',
        link: '/documentation',
        time: '10 min read',
      },
      {
        title: 'API Reference',
        description: 'Complete API documentation with examples',
        type: 'Reference',
        link: '/api-reference',
        time: 'Reference',
      },
      {
        title: 'Integration Guides',
        description: 'Connect VRUX with your favorite frameworks',
        type: 'Tutorial',
        link: '/documentation#integrations',
        time: '15 min read',
      },
    ],
  },
  {
    title: 'Video Tutorials',
    description: 'Watch and learn with our video content',
    icon: <Video className="w-6 h-6" />,
    color: 'from-red-500 to-red-600',
    resources: [
      {
        title: 'VRUX Crash Course',
        description: 'Everything you need to know in 30 minutes',
        type: 'Video',
        link: 'https://youtube.com/watch?v=demo',
        time: '30 min',
        external: true,
      },
      {
        title: 'Building a Dashboard',
        description: 'Create a complete admin dashboard from scratch',
        type: 'Video',
        link: 'https://youtube.com/watch?v=demo',
        time: '45 min',
        external: true,
      },
      {
        title: 'Advanced Prompting',
        description: 'Master the art of writing effective prompts',
        type: 'Video',
        link: 'https://youtube.com/watch?v=demo',
        time: '20 min',
        external: true,
      },
    ],
  },
  {
    title: 'Downloads',
    description: 'Tools, plugins, and resources',
    icon: <Download className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    resources: [
      {
        title: 'VS Code Extension',
        description: 'Generate components directly in your editor',
        type: 'Extension',
        link: '#',
        size: '2.4 MB',
      },
      {
        title: 'Component Library',
        description: 'Pre-built components ready to use',
        type: 'Library',
        link: '#',
        size: '15 MB',
      },
      {
        title: 'CLI Tool',
        description: 'Command-line interface for VRUX',
        type: 'Tool',
        link: '#',
        size: '8 MB',
      },
    ],
  },
  {
    title: 'Community',
    description: 'Connect with other developers',
    icon: <Users className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    resources: [
      {
        title: 'Discord Server',
        description: 'Join 5,000+ developers in our community',
        type: 'Community',
        link: 'https://discord.gg/vrux',
        external: true,
      },
      {
        title: 'GitHub Discussions',
        description: 'Ask questions and share ideas',
        type: 'Forum',
        link: 'https://github.com/vrux/discussions',
        external: true,
      },
      {
        title: 'Community Showcase',
        description: 'See what others are building',
        type: 'Gallery',
        link: '/community',
      },
    ],
  },
];

const learningPaths = [
  {
    title: 'Beginner Path',
    description: 'New to VRUX? Start here',
    icon: <Zap className="w-5 h-5" />,
    duration: '2 hours',
    steps: [
      'Introduction to VRUX',
      'Setting up your environment',
      'Your first component',
      'Understanding variants',
      'Basic customization',
    ],
  },
  {
    title: 'Advanced Path',
    description: 'Master advanced features',
    icon: <BookOpen className="w-5 h-5" />,
    duration: '4 hours',
    steps: [
      'Complex component patterns',
      'API integration',
      'Custom workflows',
      'Performance optimization',
      'Enterprise features',
    ],
  },
];

export default function ResourcesPage() {
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  return (
    <>
      <Head>
        <title>Resources - VRUX | Learn and Explore</title>
        <meta name="description" content="Explore VRUX resources including documentation, tutorials, downloads, and community content." />
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
                Resources & Learning
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything you need to master VRUX and build amazing components faster.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Links */}
        <section className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: <Book />, label: 'Documentation', href: '/documentation' },
                { icon: <Youtube />, label: 'Video Tutorials', href: '#videos' },
                { icon: <Github />, label: 'GitHub', href: 'https://github.com/vrux', external: true },
                { icon: <MessageSquare />, label: 'Community', href: '/community' },
              ].map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } shadow-lg hover:shadow-xl transition-all flex items-center gap-3`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
                    {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {item.external && <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />}
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Paths */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Learning Paths</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Structured courses to guide your learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {learningPaths.map((path, index) => (
                <motion.div
                  key={path.title}
                  initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`p-6 rounded-2xl ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{path.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{path.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {path.icon}
                      <span>{path.duration}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {path.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 ${
                          darkMode ? 'border-gray-700' : 'border-gray-300'
                        } flex items-center justify-center text-xs font-medium`}>
                          {stepIndex + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                    Start Learning
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">All Resources</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Browse our complete collection of learning materials
              </p>
            </div>

            <div className="space-y-12">
              {resourceCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-white`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">{category.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {category.resources.map((resource, index) => (
                      <motion.a
                        key={resource.title}
                        href={resource.link}
                        target={resource.external ? '_blank' : undefined}
                        rel={resource.external ? 'noopener noreferrer' : undefined}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className={`group p-6 rounded-xl ${
                          darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                        } shadow-lg hover:shadow-xl transition-all`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            {resource.type}
                          </span>
                          {resource.external && <ExternalLink className="w-4 h-4 text-gray-400" />}
                        </div>
                        
                        <h4 className="font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {resource.description}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          {resource.time || resource.size}
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-8 rounded-2xl ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50'
              } text-center`}
            >
              <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get the latest tutorials, tips, and updates delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`flex-1 px-4 py-3 rounded-lg outline-none ${
                    darkMode 
                      ? 'bg-gray-800 border border-gray-700 focus:border-purple-500' 
                      : 'bg-white border border-gray-200 focus:border-purple-500'
                  }`}
                />
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  Subscribe
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}