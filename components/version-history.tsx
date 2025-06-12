import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  GitBranch,
  GitCommit,
  ChevronDown,
  ChevronRight,
  Code2,
  User,
  Calendar,
  Tag,
  RotateCcw,
  Eye,
  Copy,
  Download,
  Trash2,
  Star,
  GitMerge,
  FileCode,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

export interface ComponentVersion {
  id: string;
  version: string;
  code: string;
  prompt: string;
  parentVersion?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  message: string;
  tags: string[];
  metadata: {
    model?: string;
    provider?: string;
    temperature?: number;
    tokenCount?: number;
    generationTime?: number;
  };
  stats: {
    views: number;
    copies: number;
    stars: number;
  };
  isStarred?: boolean;
  isCurrent?: boolean;
}

interface VersionHistoryProps {
  versions: ComponentVersion[];
  currentVersionId: string;
  onRestore: (version: ComponentVersion) => void;
  onView: (version: ComponentVersion) => void;
  onCompare?: (versionA: ComponentVersion, versionB: ComponentVersion) => void;
  onDelete?: (versionId: string) => void;
  onStar?: (versionId: string) => void;
  className?: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionId,
  onRestore,
  onView,
  onCompare,
  onDelete,
  onStar,
  className = ''
}) => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(versions.flatMap(v => v.tags)));

  // Filter versions by tag
  const filteredVersions = filterTag
    ? versions.filter(v => v.tags.includes(filterTag))
    : versions;

  // Sort versions by timestamp (newest first)
  const sortedVersions = [...filteredVersions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const toggleExpanded = useCallback((versionId: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  }, []);

  const handleCompareSelect = useCallback((versionId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedForCompare.length === 2 && onCompare) {
      const versionA = versions.find(v => v.id === selectedForCompare[0]);
      const versionB = versions.find(v => v.id === selectedForCompare[1]);
      if (versionA && versionB) {
        onCompare(versionA, versionB);
        setSelectedForCompare([]);
      }
    }
  }, [selectedForCompare, versions, onCompare]);

  const copyCode = useCallback(async (code: string, versionId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard!');
      // Update stats (in real app, this would be an API call)
    } catch (err) {
      toast.error('Failed to copy code');
    }
  }, []);

  const downloadVersion = useCallback((version: ComponentVersion) => {
    const blob = new Blob([version.code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-v${version.version}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Version downloaded!');
  }, []);

  const renderVersion = (version: ComponentVersion) => {
    const isExpanded = expandedVersions.has(version.id);
    const isCurrent = version.id === currentVersionId;
    const isSelected = selectedForCompare.includes(version.id);

    return (
      <motion.div
        key={version.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-3 ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      >
        <Card className={`${isCurrent ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : ''}`}>
          <CardContent className="p-4">
            {/* Version Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleExpanded(version.id)}
                  className="mt-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GitCommit className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-sm font-medium">v{version.version}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                        Current
                      </span>
                    )}
                    {version.isStarred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{version.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                    </span>
                    {version.metadata.model && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {version.metadata.model}
                      </span>
                    )}
                  </div>
                  
                  {version.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {version.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                          className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                            tag === filterTag
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                {onCompare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCompareSelect(version.id)}
                    className={isSelected ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                  >
                    <GitMerge className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(version)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(version)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                {onStar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStar(version.id)}
                  >
                    <Star className={`w-4 h-4 ${version.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    {/* Prompt */}
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Prompt</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {version.prompt}
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Generation Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-500">Provider:</span>
                          <span className="ml-1 font-medium">{version.metadata.provider || 'Unknown'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-500">Temperature:</span>
                          <span className="ml-1 font-medium">{version.metadata.temperature || 0.7}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-500">Tokens:</span>
                          <span className="ml-1 font-medium">{version.metadata.tokenCount || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-500">Time:</span>
                          <span className="ml-1 font-medium">
                            {version.metadata.generationTime ? `${(version.metadata.generationTime / 1000).toFixed(2)}s` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Usage Stats</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {version.stats.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          {version.stats.copies} copies
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {version.stats.stars} stars
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCode(version.code, version.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadVersion(version)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {onDelete && !isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(version.id)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Version History</h2>
          <span className="text-sm text-gray-500">({sortedVersions.length} versions)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedForCompare.length === 2 && onCompare && (
            <Button
              size="sm"
              onClick={handleCompare}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <GitMerge className="w-4 h-4 mr-2" />
              Compare Selected
            </Button>
          )}
          
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Tree
            </button>
          </div>
        </div>
      </div>
      
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by tag:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                !filterTag
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  tag === filterTag
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Version List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedVersions.map(version => renderVersion(version))}
        </AnimatePresence>
      </div>
      
      {sortedVersions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No version history yet</p>
          <p className="text-sm mt-1">Generated components will appear here</p>
        </div>
      )}
    </div>
  );
};