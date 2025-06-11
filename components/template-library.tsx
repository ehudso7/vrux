import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  Copy,
  Eye,
  Sparkles,
  Grid,
  List,
  X,
  Download,
  Code2,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  Template,
  templateCategories
} from '../lib/template-store';
import toast from 'react-hot-toast';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as React from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../lib/auth-context';

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  darkMode?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'popular' | 'recent' | 'likes';

export default function TemplateLibrary({ 
  onSelectTemplate, 
  darkMode = false 
}: TemplateLibraryProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [likedTemplates, setLikedTemplates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from API
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('sort', sortBy === 'recent' ? 'newest' : sortBy === 'likes' ? 'popular' : sortBy);
      
      const response = await fetch(`/api/templates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        throw new Error(data.error || 'Failed to load templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, sortBy]);

  const handleLikeTemplate = async (templateId: string) => {
    if (!user) {
      toast.error('Please sign in to like templates');
      return;
    }

    const isLiked = likedTemplates.has(templateId);
    const method = isLiked ? 'DELETE' : 'POST';
    
    try {
      const response = await fetch(`/api/templates/${templateId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      if (data.success) {
        const newLiked = new Set(likedTemplates);
        if (isLiked) {
          newLiked.delete(templateId);
          toast('Removed from favorites');
        } else {
          newLiked.add(templateId);
          toast.success('Added to favorites!');
        }
        setLikedTemplates(newLiked);
        
        // Update local template likes count
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, likes: data.likes } : t
        ));
      }
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      // Track template usage
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local template uses count
        setTemplates(prev => prev.map(t => 
          t.id === template.id ? { ...t, uses: data.uses } : t
        ));
      }
    } catch (err) {
      // Don't block template usage if tracking fails
      console.error('Failed to track template usage:', err);
    }
    
    onSelectTemplate(template);
    toast.success(`Using "${template.name}" template`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-b ${
        darkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Template Library
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start with professionally designed components
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    : ''
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    : ''
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
            </div>
            
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className={`px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Recently Added</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Categories Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className={`rounded-lg p-4 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className="font-semibold mb-4">Categories</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Templates
                </button>
                {templateCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Templates Grid/List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={fetchTemplates} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Try Again
                </Button>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No templates found. Try a different search or category.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    darkMode={darkMode}
                    isLiked={likedTemplates.has(template.id)}
                    onLike={() => handleLikeTemplate(template.id)}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <TemplateListItem
                    key={template.id}
                    template={template}
                    darkMode={darkMode}
                    isLiked={likedTemplates.has(template.id)}
                    onLike={() => handleLikeTemplate(template.id)}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-6xl w-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
                darkMode ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b ${
                darkMode ? 'border-gray-800' : 'border-gray-200'
              } flex items-center justify-between`}>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex h-[calc(90vh-140px)]">
                {/* Live Preview */}
                <div className="flex-1 p-6 overflow-auto">
                  <div className={`rounded-lg border ${
                    darkMode ? 'border-gray-800' : 'border-gray-200'
                  } overflow-hidden`}>
                    <LiveProvider 
                      code={selectedTemplate.code}
                      scope={{ React, motion }}
                    >
                      <LiveError className="text-red-500 p-4" />
                      <LivePreview className="p-4" />
                    </LiveProvider>
                  </div>
                </div>

                {/* Code View */}
                <div className={`w-1/2 border-l ${
                  darkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <Editor
                    height="100%"
                    language="typescript"
                    value={selectedTemplate.code}
                    theme={darkMode ? 'vs-dark' : 'light'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      readOnly: true,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t ${
                darkMode ? 'border-gray-800' : 'border-gray-200'
              } flex items-center justify-between`}>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {selectedTemplate.likes} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {selectedTemplate.uses} uses
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleCopyCode(selectedTemplate.code)}
                    variant="ghost"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button
                    onClick={() => {
                      handleUseTemplate(selectedTemplate);
                      setShowPreview(false);
                    }}
                    className="gradient-primary text-white"
                  >
                    Use This Template
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  darkMode, 
  isLiked, 
  onLike, 
  onUse, 
  onPreview 
}: {
  template: Template;
  darkMode: boolean;
  isLiked: boolean;
  onLike: () => void;
  onUse: () => void;
  onPreview: () => void;
}) {
  const categoryInfo = templateCategories.find(c => c.id === template.category);
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Preview Image */}
      <div 
        className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer"
        onClick={onPreview}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Code2 className="w-12 h-12 text-white/20" />
        </div>
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <button className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
        {categoryInfo && (
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 bg-${categoryInfo.color}-500 text-white text-sm font-medium rounded-full`}>
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {template.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {template.likes}
            </button>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.uses}
            </span>
          </div>
          
          <Button
            onClick={onUse}
            size="sm"
            className="gradient-primary text-white"
          >
            Use Template
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Template List Item Component
function TemplateListItem({ 
  template, 
  darkMode, 
  isLiked, 
  onLike, 
  onUse, 
  onPreview 
}: {
  template: Template;
  darkMode: boolean;
  isLiked: boolean;
  onLike: () => void;
  onUse: () => void;
  onPreview: () => void;
}) {
  const categoryInfo = templateCategories.find(c => c.id === template.category);
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-6 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Preview Thumbnail */}
      <div 
        className="w-32 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 cursor-pointer flex items-center justify-center"
        onClick={onPreview}
      >
        <Code2 className="w-8 h-8 text-white/50" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          </div>
          {categoryInfo && (
            <span className={`px-3 py-1 bg-${categoryInfo.color}-100 dark:bg-${categoryInfo.color}-900/30 text-${categoryInfo.color}-700 dark:text-${categoryInfo.color}-400 text-sm font-medium rounded-full`}>
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6 mt-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-1 rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {template.likes}
            </button>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.uses}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onPreview}
          variant="ghost"
          size="sm"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          onClick={onUse}
          size="sm"
          className="gradient-primary text-white"
        >
          Use Template
        </Button>
      </div>
    </motion.div>
  );
}