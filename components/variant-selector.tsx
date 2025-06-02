import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, Palette } from 'lucide-react';

interface VariantSelectorProps {
  variants: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const variantIcons = [Sparkles, Zap, Palette];
const variantNames = ['Minimal', 'Dynamic', 'Elegant'];
const variantDescriptions = [
  'Clean and minimalist with subtle animations',
  'Bold and vibrant with dynamic interactions',
  'Sophisticated and refined with elegant details'
];

export default function VariantSelector({ variants, selectedIndex, onSelect }: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Your Style</h3>
        <span className="text-sm text-gray-600">
          {variants.length} variations generated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {variants.map((_, index) => {
            const Icon = variantIcons[index] || Sparkles;
            const isSelected = selectedIndex === index;
            
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelect(index)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all text-left
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50/50 shadow-lg' 
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md bg-white'
                  }
                `}
              >
                {/* Selected Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content */}
                <div className="space-y-3">
                  <div className={`
                    inline-flex items-center justify-center w-12 h-12 rounded-xl
                    ${isSelected 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                      : 'bg-gray-100'
                    }
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {variantNames[index]}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {variantDescriptions[index]}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`
                      px-2 py-1 rounded-full
                      ${isSelected 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      Variant {index + 1}
                    </span>
                  </div>
                </div>

                {/* Hover Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  initial={false}
                  animate={{
                    opacity: isSelected ? 0.1 : 0,
                    scale: isSelected ? 1 : 0.95,
                  }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.1), transparent)',
                  }}
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Quick Switch */}
      <div className="flex items-center justify-center space-x-2 pt-2">
        {variants.map((_, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${selectedIndex === index 
                ? 'w-8 bg-purple-500' 
                : 'bg-gray-300 hover:bg-gray-400'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}