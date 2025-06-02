import { z } from 'zod';

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['landing', 'dashboard', 'ecommerce', 'blog', 'portfolio', 'saas', 'mobile', 'other']),
  tags: z.array(z.string()),
  code: z.string(),
  preview: z.string().optional(),
  author: z.object({
    name: z.string(),
    avatar: z.string().optional(),
  }),
  likes: z.number().default(0),
  uses: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  framework: z.enum(['react', 'nextjs', 'vue', 'svelte']).default('react'),
  dependencies: z.record(z.string()).optional(),
});

export type Template = z.infer<typeof templateSchema>;

// Built-in templates
export const builtInTemplates: Template[] = [
  {
    id: 'landing-hero-1',
    name: 'Modern Hero Section',
    description: 'A beautiful hero section with gradient background and CTA buttons',
    category: 'landing',
    tags: ['hero', 'landing', 'gradient', 'responsive'],
    code: `import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 opacity-90" />
      
      {/* Animated Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          Build Amazing Products
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
            With Modern Tools
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto"
        >
          Create stunning web applications with our powerful platform. 
          Start building today and bring your ideas to life.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl">
            Get Started Free
          </button>
          <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-200">
            View Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}`,
    author: { name: 'VRUX Team' },
    likes: 42,
    uses: 128,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    framework: 'react',
    dependencies: { 'framer-motion': '^11.0.0' },
  },
  {
    id: 'dashboard-stats-1',
    name: 'Analytics Dashboard',
    description: 'A clean dashboard with stats cards and charts',
    category: 'dashboard',
    tags: ['dashboard', 'analytics', 'stats', 'charts'],
    code: `import React from 'react';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const stats = [
  { name: 'Total Revenue', value: '$45,231', change: '+12.5%', icon: DollarSign, color: 'bg-green-500' },
  { name: 'Active Users', value: '2,345', change: '+8.2%', icon: Users, color: 'bg-blue-500' },
  { name: 'Conversion Rate', value: '3.24%', change: '-2.1%', icon: TrendingUp, color: 'bg-purple-500' },
  { name: 'Avg. Session', value: '4m 32s', change: '+18.7%', icon: Activity, color: 'bg-orange-500' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track your business metrics in real-time</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={\`p-3 rounded-lg \${stat.color} bg-opacity-10\`}>
                  <stat.icon className={\`w-6 h-6 text-\${stat.color.replace('bg-', '')}\`} />
                </div>
                <span className={\`text-sm font-medium \${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }\`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{stat.name}</p>
            </div>
          ))}
        </div>
        
        {/* Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Trend</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart Component Here</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">User Activity</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart Component Here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
    author: { name: 'VRUX Team' },
    likes: 38,
    uses: 95,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    framework: 'react',
  },
  {
    id: 'ecommerce-product-1',
    name: 'Product Card',
    description: 'E-commerce product card with hover effects and quick actions',
    category: 'ecommerce',
    tags: ['product', 'card', 'ecommerce', 'shop'],
    code: `import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';

export default function ProductCard() {
  const [liked, setLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src="/api/placeholder/400/400"
          alt="Product"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setLiked(!liked)}
            className={\`p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all \${
              liked ? 'text-red-500' : 'text-gray-600'
            }\`}
          >
            <Heart className={\`w-5 h-5 \${liked ? 'fill-current' : ''}\`} />
          </button>
        </div>
        
        {/* Sale Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
            -20%
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          Premium Wireless Headphones
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={\`w-4 h-4 \${
                i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }\`}
            />
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">(128)</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">$79.99</span>
            <span className="text-sm text-gray-500 line-through ml-2">$99.99</span>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={() => setInCart(!inCart)}
          className={\`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 \${
            inCart
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }\`}
        >
          <ShoppingCart className="w-5 h-5" />
          {inCart ? 'Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}`,
    author: { name: 'VRUX Team' },
    likes: 56,
    uses: 203,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    framework: 'react',
  },
];

// Template categories with metadata
export const templateCategories = [
  { id: 'landing', name: 'Landing Pages', icon: '🚀', color: 'purple' },
  { id: 'dashboard', name: 'Dashboards', icon: '📊', color: 'blue' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', color: 'green' },
  { id: 'blog', name: 'Blog', icon: '📝', color: 'orange' },
  { id: 'portfolio', name: 'Portfolio', icon: '🎨', color: 'pink' },
  { id: 'saas', name: 'SaaS', icon: '☁️', color: 'indigo' },
  { id: 'mobile', name: 'Mobile', icon: '📱', color: 'teal' },
  { id: 'other', name: 'Other', icon: '🔧', color: 'gray' },
];

// Template store functions
export function getTemplates(category?: string, searchQuery?: string): Template[] {
  let templates = [...builtInTemplates];
  
  if (category && category !== 'all') {
    templates = templates.filter(t => t.category === category);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    templates = templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  return templates.sort((a, b) => b.likes - a.likes);
}

export function getTemplateById(id: string): Template | undefined {
  return builtInTemplates.find(t => t.id === id);
}

export function getPopularTemplates(limit: number = 6): Template[] {
  return [...builtInTemplates]
    .sort((a, b) => b.uses - a.uses)
    .slice(0, limit);
}

export function getRecentTemplates(limit: number = 6): Template[] {
  return [...builtInTemplates]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}