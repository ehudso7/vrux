import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  Download,
  Eye,
  Heart,
  Code2,
  Package,
  Tag,
  User,
  Calendar,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  X,
  Check,
  ShoppingCart,
  Sparkles,
  Zap,
  Shield,
  Award,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../lib/auth-context';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export interface MarketplaceComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  price: number; // 0 for free
  currency: 'USD' | 'EUR' | 'GBP';
  stats: {
    downloads: number;
    views: number;
    likes: number;
    rating: number;
    reviews: number;
  };
  preview: {
    image: string;
    code?: string;
    liveDemo?: string;
  };
  compatibility: {
    react: string[];
    tailwind: string[];
    browsers: string[];
  };
  license: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'Commercial';
  version: string;
  lastUpdated: Date;
  featured: boolean;
  verified: boolean;
}

interface MarketplaceProps {
  onSelectComponent?: (component: MarketplaceComponent) => void;
  className?: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Grid },
  { value: 'ui', label: 'UI Components', icon: Package },
  { value: 'forms', label: 'Forms', icon: Code2 },
  { value: 'navigation', label: 'Navigation', icon: List },
  { value: 'data', label: 'Data Display', icon: Grid },
  { value: 'marketing', label: 'Marketing', icon: TrendingUp },
  { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { value: 'dashboard', label: 'Dashboards', icon: Zap }
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'recent', label: 'Recently Added', icon: Calendar },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'downloads', label: 'Most Downloads', icon: Download },
  { value: 'price-low', label: 'Price: Low to High', icon: ArrowUp },
  { value: 'price-high', label: 'Price: High to Low', icon: ArrowDown }
];

export const Marketplace: React.FC<MarketplaceProps> = ({
  onSelectComponent,
  className = ''
}) => {
  const { user } = useAuth();
  const [components, setComponents] = useState<MarketplaceComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<MarketplaceComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Load marketplace components
  useEffect(() => {
    loadMarketplaceComponents();
  }, []);

  const loadMarketplaceComponents = async () => {
    setLoading(true);
    try {
      // In real app, this would be an API call
      const mockComponents: MarketplaceComponent[] = [
        {
          id: '1',
          name: 'Modern Dashboard Kit',
          description: 'Complete dashboard UI kit with 50+ components',
          category: 'dashboard',
          tags: ['admin', 'analytics', 'charts', 'responsive'],
          author: {
            id: 'author1',
            name: 'Sarah Chen',
            avatar: undefined,
            verified: true
          },
          price: 49,
          currency: 'USD',
          stats: {
            downloads: 15420,
            views: 85300,
            likes: 3240,
            rating: 4.8,
            reviews: 234
          },
          preview: {
            image: '/api/placeholder/600/400',
            liveDemo: 'https://demo.vrux.dev/dashboard-kit'
          },
          compatibility: {
            react: ['18.x', '17.x'],
            tailwind: ['3.x'],
            browsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
          },
          license: 'Commercial',
          version: '2.1.0',
          lastUpdated: new Date('2024-01-15'),
          featured: true,
          verified: true
        },
        {
          id: '2',
          name: 'E-commerce Components',
          description: 'Beautiful e-commerce UI components for online stores',
          category: 'ecommerce',
          tags: ['shop', 'product', 'cart', 'checkout'],
          author: {
            id: 'author2',
            name: 'Alex Rivera',
            avatar: undefined,
            verified: false
          },
          price: 0,
          currency: 'USD',
          stats: {
            downloads: 28950,
            views: 120500,
            likes: 5620,
            rating: 4.9,
            reviews: 412
          },
          preview: {
            image: '/api/placeholder/600/400',
            liveDemo: 'https://demo.vrux.dev/ecommerce'
          },
          compatibility: {
            react: ['18.x'],
            tailwind: ['3.x', '2.x'],
            browsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
          },
          license: 'MIT',
          version: '1.5.2',
          lastUpdated: new Date('2024-01-20'),
          featured: true,
          verified: false
        },
        {
          id: '3',
          name: 'Form Builder Pro',
          description: 'Advanced form components with validation',
          category: 'forms',
          tags: ['input', 'validation', 'accessible', 'hooks'],
          author: {
            id: 'author3',
            name: 'Jordan Lee',
            avatar: undefined,
            verified: true
          },
          price: 29,
          currency: 'USD',
          stats: {
            downloads: 8720,
            views: 42100,
            likes: 1890,
            rating: 4.6,
            reviews: 156
          },
          preview: {
            image: '/api/placeholder/600/400',
            code: `<FormBuilder 
  fields={fields}
  onSubmit={handleSubmit}
  validation={schema}
/>`
          },
          compatibility: {
            react: ['18.x', '17.x', '16.x'],
            tailwind: ['3.x'],
            browsers: ['Chrome', 'Firefox', 'Safari', 'Edge', 'IE11']
          },
          license: 'Apache-2.0',
          version: '3.0.1',
          lastUpdated: new Date('2024-01-10'),
          featured: false,
          verified: true
        }
      ];

      setComponents(mockComponents);
      setFilteredComponents(mockComponents);
    } catch (error) {
      toast.error('Failed to load marketplace components');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort components
  useEffect(() => {
    let filtered = [...components];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query)) ||
        c.author.name.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(c => 
        selectedTags.every(tag => c.tags.includes(tag))
      );
    }

    // Price filter
    if (showFreeOnly) {
      filtered = filtered.filter(c => c.price === 0);
    } else {
      filtered = filtered.filter(c => 
        c.price >= priceRange.min && c.price <= priceRange.max
      );
    }

    // Verified filter
    if (showVerifiedOnly) {
      filtered = filtered.filter(c => c.verified);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.stats.downloads - a.stats.downloads;
        case 'recent':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'rating':
          return b.stats.rating - a.stats.rating;
        case 'downloads':
          return b.stats.downloads - a.stats.downloads;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredComponents(filtered);
  }, [components, searchQuery, selectedCategory, selectedTags, sortBy, priceRange, showFreeOnly, showVerifiedOnly]);

  // Get all unique tags
  const allTags = Array.from(new Set(components.flatMap(c => c.tags)));

  const handleDownload = useCallback(async (component: MarketplaceComponent) => {
    if (!user) {
      toast.error('Please sign in to download components');
      return;
    }

    // In real app, this would handle payment and download
    toast.success(`Downloaded ${component.name}`);
    
    // Update stats
    const updatedComponents = components.map(c => 
      c.id === component.id 
        ? { ...c, stats: { ...c.stats, downloads: c.stats.downloads + 1 } }
        : c
    );
    setComponents(updatedComponents);
  }, [user, components]);

  const handleLike = useCallback(async (component: MarketplaceComponent) => {
    if (!user) {
      toast.error('Please sign in to like components');
      return;
    }

    // In real app, this would be an API call
    const updatedComponents = components.map(c => 
      c.id === component.id 
        ? { ...c, stats: { ...c.stats, likes: c.stats.likes + 1 } }
        : c
    );
    setComponents(updatedComponents);
    toast.success('Added to favorites');
  }, [user, components]);

  const renderComponent = (component: MarketplaceComponent) => {
    const ComponentCard = (
      <motion.div
        key={component.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={viewMode === 'grid' ? '' : 'w-full'}
      >
        <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
          {/* Preview Image */}
          <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            {component.preview.image && (
              <img 
                src={component.preview.image} 
                alt={component.name}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-2">
              {component.featured && (
                <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
              {component.verified && (
                <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
              {component.price === 0 && (
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  Free
                </span>
              )}
            </div>

            {/* Price */}
            {component.price > 0 && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-black/75 text-white rounded-lg">
                <span className="text-lg font-bold">${component.price}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  component.preview.liveDemo && window.open(component.preview.liveDemo, '_blank');
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Title and Author */}
            <div className="mb-3">
              <h3 className="font-semibold text-lg mb-1">{component.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {component.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs text-white font-medium">
                    {component.author.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {component.author.name}
                  </span>
                  {component.author.verified && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {component.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {component.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500">
                  +{component.tags.length - 3}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {component.stats.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {component.stats.downloads.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {component.stats.likes.toLocaleString()}
                </span>
              </div>
              <span className="text-xs">
                v{component.version}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComponent?.(component);
                }}
              >
                {component.price === 0 ? 'Use Component' : `Buy $${component.price}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(component);
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );

    return ComponentCard;
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Sidebar Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4 space-y-6 h-full overflow-y-auto">
              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">Price</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showFreeOnly}
                      onChange={(e) => setShowFreeOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Free only</span>
                  </label>
                  {!showFreeOnly && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>$0</span>
                        <span>${priceRange.max}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Filters */}
              <div>
                <h3 className="font-semibold mb-3">Other</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showVerifiedOnly}
                    onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    Verified only
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search components..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedTags.length > 0 || selectedCategory !== 'all' || showFreeOnly || showVerifiedOnly) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-600">Active filters:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCategory !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full flex items-center gap-1">
                    {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                    <button onClick={() => setSelectedCategory('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full flex items-center gap-1">
                    {tag}
                    <button onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showFreeOnly && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full flex items-center gap-1">
                    Free only
                    <button onClick={() => setShowFreeOnly(false)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {showVerifiedOnly && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full flex items-center gap-1">
                    Verified only
                    <button onClick={() => setShowVerifiedOnly(false)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
          {filteredComponents.length} components found
        </div>

        {/* Components Grid/List */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredComponents.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredComponents.map(component => renderComponent(component))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Package className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No components found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};