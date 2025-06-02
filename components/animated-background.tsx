import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  darkMode: boolean;
  variant?: 'gradient' | 'mesh' | 'aurora' | 'particles';
}

export default function AnimatedBackground({ darkMode, variant = 'aurora' }: AnimatedBackgroundProps) {
  if (variant === 'aurora') {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Aurora Effect */}
        <div className="absolute inset-0">
          <motion.div
            className={`absolute top-0 -left-1/4 w-[150%] h-[200%] opacity-30 ${
              darkMode 
                ? 'bg-gradient-radial from-purple-600/40 via-blue-600/20 to-transparent' 
                : 'bg-gradient-radial from-purple-400/30 via-blue-400/15 to-transparent'
            }`}
            animate={{
              x: ['-25%', '25%', '-25%'],
              y: ['-20%', '20%', '-20%'],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              filter: 'blur(100px)',
              background: darkMode
                ? 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.3) 0%, rgba(96, 165, 250, 0.15) 50%, transparent 70%)'
            }}
          />
          <motion.div
            className={`absolute bottom-0 -right-1/4 w-[150%] h-[200%] opacity-30 ${
              darkMode 
                ? 'bg-gradient-radial from-blue-600/40 via-purple-600/20 to-transparent' 
                : 'bg-gradient-radial from-blue-400/30 via-purple-400/15 to-transparent'
            }`}
            animate={{
              x: ['25%', '-25%', '25%'],
              y: ['20%', '-20%', '20%'],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
            style={{
              filter: 'blur(120px)',
              background: darkMode
                ? 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(96, 165, 250, 0.3) 0%, rgba(167, 139, 250, 0.15) 50%, transparent 70%)'
            }}
          />
        </div>
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='${darkMode ? '%23ffffff' : '%23000000'}' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                darkMode ? 'bg-purple-400/40' : 'bg-purple-500/30'
              }`}
              initial={{
                x: Math.random() * 1920,
                y: Math.random() * 1080,
              }}
              animate={{
                x: Math.random() * 1920,
                y: Math.random() * 1080,
              }}
              transition={{
                duration: Math.random() * 20 + 20,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5,
              }}
              style={{
                boxShadow: darkMode 
                  ? '0 0 10px rgba(167, 139, 250, 0.5)' 
                  : '0 0 10px rgba(147, 51, 234, 0.3)'
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default gradient background
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: darkMode ? [
            'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #312e81 100%)',
            'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          ] : [
            'linear-gradient(135deg, #faf5ff 0%, #ede9fe 50%, #faf5ff 100%)',
            'linear-gradient(135deg, #ede9fe 0%, #faf5ff 50%, #ede9fe 100%)',
            'linear-gradient(135deg, #faf5ff 0%, #ede9fe 50%, #faf5ff 100%)',
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}