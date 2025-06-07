import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';


interface AnimatedVariantSelectorProps {
  variants: { id: string; name: string; icon: React.ReactNode; style: string; color: string; }[];
  selectedVariant: number;
  onVariantSelect: (index: number) => void;
  generatedVariants: Array<{ code: string } | null>;
  darkMode: boolean;
}

export default function AnimatedVariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
  generatedVariants,
  darkMode
}: AnimatedVariantSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {variants.map((variant, index) => {
        const isSelected = selectedVariant === index;
        const isGenerated = !!generatedVariants[index];
        const isLoading = !isGenerated && generatedVariants.some(v => v);
        
        return (
          <Tooltip.Root key={variant.id}>
            <Tooltip.Trigger asChild>
              <motion.button
                onClick={() => onVariantSelect(index)}
                disabled={!isGenerated}
                className="relative"
                whileHover={isGenerated ? { scale: 1.05 } : {}}
                whileTap={isGenerated ? { scale: 0.95 } : {}}
              >
                {/* Background glow effect */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${
                        variant.color === 'purple' 
                          ? 'from-purple-600/30 to-pink-600/30' 
                          : variant.color === 'orange'
                          ? 'from-orange-600/30 to-red-600/30'
                          : 'from-blue-600/30 to-cyan-600/30'
                      } blur-xl`}
                    />
                  )}
                </AnimatePresence>

                {/* Main button */}
                <motion.div
                  className={`relative px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                    isSelected 
                      ? `bg-gradient-to-r text-white shadow-lg ${
                          variant.color === 'purple' 
                            ? 'from-purple-600 to-pink-600' 
                            : variant.color === 'orange'
                            ? 'from-orange-600 to-red-600'
                            : 'from-blue-600 to-cyan-600'
                        }`
                      : darkMode
                      ? 'bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:bg-gray-700/80 border border-gray-700/50'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-50/80 border border-gray-200/50'
                  } ${!isGenerated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  initial={false}
                  animate={{
                    scale: isLoading ? [1, 1.02, 1] : 1,
                  }}
                  transition={{
                    scale: {
                      duration: 2,
                      repeat: isLoading ? Infinity : 0,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {/* Icon with animation */}
                  <motion.div
                    animate={isLoading ? {
                      rotate: [0, 360],
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: isLoading ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    {variant.icon}
                  </motion.div>
                  
                  {/* Text */}
                  <span className="relative">
                    {variant.name}
                    {isSelected && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="absolute bottom-0 left-0 h-0.5 bg-white/50"
                      />
                    )}
                  </span>

                  {/* Success indicator */}
                  <AnimatePresence>
                    {isGenerated && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loading pulse */}
                  {isLoading && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>

                {/* Ripple effect on click */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 rounded-xl bg-white pointer-events-none`}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Content 
              className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl"
              sideOffset={8}
            >
              <div className="font-medium">{variant.name} Style</div>
              <div className="text-xs text-gray-400 mt-0.5">{variant.style}</div>
            </Tooltip.Content>
          </Tooltip.Root>
        );
      })}
    </div>
  );
}