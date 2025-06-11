import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, Code2, Copy,
  Check, Search, Grid3X3, List
} from 'lucide-react';
import { Footer } from '../components/navigation/Footer';
import { useRouter } from 'next/router';

const examples = [
  {
    id: 1,
    title: 'Modern Analytics Dashboard',
    category: 'Dashboard',
    description: 'A comprehensive analytics dashboard with charts, KPIs, and real-time data visualization.',
    prompt: 'Create a modern analytics dashboard with animated charts, KPI cards, and a sidebar navigation',
    preview: '/examples/dashboard-preview.png',
    tags: ['Analytics', 'Charts', 'Data Visualization'],
    code: `export default function AnalyticsDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Analytics</h2>
        </div>
        {/* Navigation items */}
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* KPI cards with animations */}
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Chart components */}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 2,
    title: 'E-commerce Product Gallery',
    category: 'E-commerce',
    description: 'A beautiful product gallery with filters, sorting, and quick view modal functionality.',
    prompt: 'Design an e-commerce product gallery with filters, sorting, and quick view modal',
    preview: '/examples/ecommerce-preview.png',
    tags: ['E-commerce', 'Gallery', 'Filters'],
    code: `export default function ProductGallery() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters sidebar */}
      <div className="flex gap-8">
        <aside className="w-64">
          {/* Filter options */}
        </aside>
        
        {/* Product grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-6">
            {/* Product cards */}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 3,
    title: 'SaaS Pricing Cards',
    category: 'Marketing',
    description: 'Modern pricing cards with feature comparison, highlighted recommended plan, and CTAs.',
    prompt: 'Build modern pricing cards with feature lists, highlighted plan, and smooth hover effects',
    preview: '/examples/pricing-preview.png',
    tags: ['Pricing', 'SaaS', 'Marketing'],
    code: `export default function PricingCards() {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600">Select the perfect plan for your needs</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Pricing cards with animations */}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 4,
    title: 'Multi-step Form Wizard',
    category: 'Forms',
    description: 'A sophisticated multi-step form with progress indicator, validation, and smooth transitions.',
    prompt: 'Design a multi-step form wizard with progress indicator and validation',
    preview: '/examples/form-preview.png',
    tags: ['Forms', 'Wizard', 'Validation'],
    code: `export default function FormWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {/* Step indicators */}
        </div>
      </div>
      
      {/* Form steps */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Current step content */}
      </div>
    </div>
  );
}`,
  },
  {
    id: 5,
    title: 'Real-time Chat Interface',
    category: 'Communication',
    description: 'A modern chat UI with message bubbles, typing indicators, reactions, and file sharing.',
    prompt: 'Build a modern chat UI with message bubbles, typing indicators, and reactions',
    preview: '/examples/chat-preview.png',
    tags: ['Chat', 'Real-time', 'Messaging'],
    code: `export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with conversations */}
      <div className="w-80 bg-white border-r">
        {/* Conversation list */}
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Message bubbles */}
        </div>
        
        {/* Input area */}
        <div className="border-t p-4">
          {/* Message input with actions */}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 6,
    title: 'Kanban Board',
    category: 'Productivity',
    description: 'A drag-and-drop Kanban board with columns, task cards, and smooth animations.',
    prompt: 'Create a drag-and-drop Kanban board with columns and task cards',
    preview: '/examples/kanban-preview.png',
    tags: ['Kanban', 'Drag & Drop', 'Project Management'],
    code: `export default function KanbanBoard() {
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex gap-6 overflow-x-auto">
        {Object.entries(columns).map(([status, tasks]) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-4">{status}</h3>
              {/* Draggable task cards */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
];

const categories = ['All', 'Dashboard', 'E-commerce', 'Marketing', 'Forms', 'Communication', 'Productivity'];

export default function ExamplesPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const filteredExamples = examples.filter(example => {
    const matchesCategory = selectedCategory === 'All' || example.category === selectedCategory;
    const matchesSearch = example.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         example.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         example.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleTryPrompt = (prompt: string) => {
    // Navigate to home page with the prompt
    router.push({
      pathname: '/',
      query: { prompt }
    });
  };

  return (
    <>
      <Head>
        <title>Examples - VRUX | See What You Can Build</title>
        <meta name="description" content="Explore real examples of components built with VRUX. From dashboards to chat interfaces." />
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
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
              >
                Try VRUX
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
                Real Examples,
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Real Results
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                See what developers are building with VRUX. Each example includes the prompt used and the generated code.
              </p>
            </motion.div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search examples..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 bg-transparent outline-none ${
                      darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div className={`flex items-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-1`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'grid'
                        ? darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list'
                        ? darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Grid/List */}
        <section className={`py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-[60vh]`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
              {filteredExamples.map((example, index) => (
                <motion.div
                  key={example.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Preview Image */}
                  <div className={`${
                    viewMode === 'list' ? 'w-64' : 'aspect-video'
                  } bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Code2 className="w-12 h-12 text-purple-600/20" />
                    </div>
                    {/* In production, this would be an actual screenshot */}
                  </div>

                  {/* Content */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{example.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {example.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {example.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {example.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-2 py-1 rounded ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTryPrompt(example.prompt)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Try This
                      </button>
                      
                      <button
                        onClick={() => handleCopyCode(example.code, example.id)}
                        className={`p-2 rounded-lg ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        } transition-colors`}
                      >
                        {copiedId === example.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredExamples.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">
                  No examples found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </section>

        <Footer darkMode={darkMode} />
      </div>
    </>
  );
}