import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ExternalLink,
  Calendar,
  Code2
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import type { GeneratedComponent } from '../lib/store';

export default function ProjectLibrary() {
  const { savedComponents, deleteComponent } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const filteredComponents = savedComponents
    .filter(component => 
      component.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.prompt.localeCompare(b.prompt);
    });

  const handleExport = (component: GeneratedComponent) => {
    const blob = new Blob([component.code], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${component.id}.jsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Component exported!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      deleteComponent(id);
      toast.success('Component deleted');
    }
  };

  if (savedComponents.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <Archive className="w-16 h-16 text-gray-300 mx-auto" />
        <h3 className="text-xl font-semibold text-gray-600">No saved components yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Components you generate and save will appear here. Start creating to build your library!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Component Library</h2>
        <span className="text-sm text-gray-600">
          {savedComponents.length} components
        </span>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredComponents.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-6 hover:shadow-xl transition-all group"
            >
              {/* Preview */}
              <div className="h-40 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-purple-300" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {component.prompt}
                </h3>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDistanceToNow(component.timestamp, { addSuffix: true })}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(component)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // TODO: Load component into editor
                      toast('Loading component...', { icon: '🚧' });
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(component.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state for filtered results */}
      {filteredComponents.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-gray-500">No components found matching &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );
}