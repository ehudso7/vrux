import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, Clock, User, ArrowRight,
  TrendingUp, BookOpen, Code2, Zap
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const blogPosts = [
  {
    id: 1,
    title: 'Introducing VRUX: The Future of Component Development',
    excerpt: 'Learn how VRUX is revolutionizing the way developers build UI components with AI-powered generation.',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Product',
    featured: true,
    tags: ['AI', 'Product Launch', 'Innovation'],
  },
  {
    id: 2,
    title: '10 Tips for Writing Better AI Prompts',
    excerpt: 'Master the art of prompt engineering to get the best results from VRUX\'s AI component generator.',
    author: 'Mike Johnson',
    date: '2024-01-12',
    readTime: '8 min read',
    category: 'Tutorial',
    tags: ['Tips', 'AI', 'Best Practices'],
  },
  {
    id: 3,
    title: 'Building a Complete Dashboard in Under 10 Minutes',
    excerpt: 'Watch as we build a production-ready analytics dashboard from scratch using VRUX.',
    author: 'Emma Wilson',
    date: '2024-01-10',
    readTime: '10 min read',
    category: 'Tutorial',
    tags: ['Dashboard', 'Tutorial', 'Speed'],
  },
  {
    id: 4,
    title: 'The Technology Behind VRUX: GPT-4 and Beyond',
    excerpt: 'Deep dive into the AI models and technologies that power VRUX\'s intelligent component generation.',
    author: 'Dr. James Lee',
    date: '2024-01-08',
    readTime: '12 min read',
    category: 'Technology',
    tags: ['AI', 'GPT-4', 'Technology'],
  },
  {
    id: 5,
    title: 'From Figma to Code: Streamlining Your Workflow',
    excerpt: 'How to use VRUX to bridge the gap between design and development seamlessly.',
    author: 'Lisa Zhang',
    date: '2024-01-05',
    readTime: '7 min read',
    category: 'Workflow',
    tags: ['Design', 'Workflow', 'Productivity'],
  },
  {
    id: 6,
    title: 'VRUX Enterprise: Security and Compliance Features',
    excerpt: 'Understanding the enterprise-grade security features that make VRUX suitable for large organizations.',
    author: 'David Brown',
    date: '2024-01-03',
    readTime: '6 min read',
    category: 'Enterprise',
    tags: ['Security', 'Enterprise', 'Compliance'],
  },
];

const categories = ['All', 'Product', 'Tutorial', 'Technology', 'Workflow', 'Enterprise'];

const categoryIcons: Record<string, React.ReactNode> = {
  Product: <TrendingUp className="w-4 h-4" />,
  Tutorial: <BookOpen className="w-4 h-4" />,
  Technology: <Code2 className="w-4 h-4" />,
  Workflow: <Zap className="w-4 h-4" />,
  Enterprise: <Sparkles className="w-4 h-4" />,
};

export default function BlogPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const filteredPosts = blogPosts.filter(post => 
    selectedCategory === 'All' || post.category === selectedCategory
  );

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <>
      <Head>
        <title>Blog - VRUX | Latest Updates and Tutorials</title>
        <meta name="description" content="Stay updated with the latest news, tutorials, and insights from the VRUX team." />
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

        {/* Header */}
        <section className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The VRUX Blog
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Insights, tutorials, and updates from the team building the future of UI development.
              </p>
            </motion.div>

            {/* Category Filter */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryIcons[category]}
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && selectedCategory === 'All' && (
          <section className={`pb-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative p-8 md:p-12 rounded-2xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-xl hover:shadow-2xl transition-all cursor-pointer`}
                onClick={() => router.push(`/blog/${featuredPost.id}`)}
              >
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded-full">
                    Featured
                  </span>
                </div>

                <div className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-purple-600 transition-colors">
                    {featuredPost.title}
                  </h2>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full" />
                      <div>
                        <p className="font-medium">{featuredPost.author}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{featuredPost.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-purple-600 font-medium">
                      Read More
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.article>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className={`py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative p-6 rounded-xl ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  } hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => router.push(`/blog/${post.id}`)}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`p-2 rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      {categoryIcons[post.category]}
                    </span>
                    <span className="text-sm font-medium text-purple-600">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-600 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {post.readTime}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>

            {regularPosts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">
                  No posts found in this category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Get the latest updates, tutorials, and tips delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`flex-1 px-4 py-3 rounded-lg outline-none ${
                    darkMode 
                      ? 'bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500' 
                      : 'bg-white border border-gray-300 focus:ring-2 focus:ring-purple-500'
                  }`}
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  Subscribe
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}