import React, { useState } from 'react';
import { ChevronDown, Sparkles, Zap, DollarSign, Brain, Eye } from 'lucide-react';
import { ALL_AVAILABLE_MODELS, MODEL_GROUPS, MODEL_PROFILES } from '../lib/ai-providers-enhanced';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const currentModel = ALL_AVAILABLE_MODELS.find(m => m.value === value) || ALL_AVAILABLE_MODELS[0];
  const currentProfile = MODEL_PROFILES[value as keyof typeof MODEL_PROFILES];

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'text-green-600 dark:text-green-400';
      case 'anthropic': return 'text-orange-600 dark:text-orange-400';
      case 'google': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'very-good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'good': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return '';
    }
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'very-fast': return <Zap className="w-3 h-3 text-yellow-500" />;
      case 'fast': return <Zap className="w-3 h-3 text-green-500" />;
      case 'medium': return <Zap className="w-3 h-3 text-blue-500" />;
      case 'slow': return <Zap className="w-3 h-3 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getProviderColor(currentModel.provider)}`}>
            {currentModel.provider.toUpperCase()}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{currentModel.label}</span>
          {getSpeedIcon(currentModel.speed)}
          <span className="text-xs text-gray-500">{currentModel.costIndicator}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Select AI Model</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose based on your needs: speed, quality, or cost
                </p>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {Object.entries(MODEL_GROUPS).map(([group, models]) => (
                  <div key={group} className="p-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {group}
                    </div>
                    {models.map(modelId => {
                      const model = ALL_AVAILABLE_MODELS.find(m => m.value === modelId);
                      if (!model) return null;
                      const profile = MODEL_PROFILES[modelId as keyof typeof MODEL_PROFILES];
                      const isSelected = value === modelId;
                      
                      return (
                        <button
                          key={modelId}
                          onClick={() => {
                            onChange(modelId);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setHoveredModel(modelId)}
                          onMouseLeave={() => setHoveredModel(null)}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                            isSelected 
                              ? 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-500' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${getProviderColor(model.provider)}`}>
                                  {model.provider.toUpperCase()}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {model.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getQualityBadge(model.quality)}`}>
                                  {model.quality}
                                </span>
                                <div className="flex items-center gap-1">
                                  {getSpeedIcon(model.speed)}
                                  <span className="text-xs text-gray-500">{model.speed}</span>
                                </div>
                                <span className="text-xs text-gray-500">{model.costIndicator}</span>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {model.capabilities.map(cap => (
                                  <span
                                    key={cap}
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400"
                                  >
                                    {cap === 'vision' && <Eye className="w-3 h-3 inline mr-1" />}
                                    {cap === 'reasoning' && <Brain className="w-3 h-3 inline mr-1" />}
                                    {cap}
                                  </span>
                                ))}
                              </div>

                              {hoveredModel === modelId && profile && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-xs text-gray-600 dark:text-gray-400 mt-2"
                                >
                                  <div className="mb-1">
                                    <strong>Best for:</strong> {model.bestFor.join(', ')}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span>Context: {(profile.contextWindow / 1000).toFixed(0)}K</span>
                                    <span>Output: {(profile.outputTokens / 1000).toFixed(0)}K</span>
                                    <span>
                                      Cost: ${profile.costPer1kTokens.input}/1K in, 
                                      ${profile.costPer1kTokens.output}/1K out
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            
                            {isSelected && (
                              <div className="ml-2">
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Selected: {currentModel.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {currentModel.costIndicator}
                    </span>
                    <span className="flex items-center gap-1">
                      {getSpeedIcon(currentModel.speed)}
                      {currentModel.speed}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};