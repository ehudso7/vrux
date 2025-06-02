import React, { useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import * as ScrollArea from '@radix-ui/react-scroll-area';

interface SmoothScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  darkMode: boolean;
}

export default function SmoothScrollArea({ children, className = '', darkMode }: SmoothScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollY = useSpring(0, { stiffness: 100, damping: 30 });
  const scrollProgress = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const progress = scrollTop / (scrollHeight - clientHeight);
        scrollY.set(progress * 100);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [scrollY]);

  return (
    <ScrollArea.Root className={`relative overflow-hidden ${className}`}>
      <ScrollArea.Viewport ref={scrollRef} className="h-full w-full rounded">
        {children}
      </ScrollArea.Viewport>
      
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-0.5 bg-transparent transition-all duration-300 hover:bg-gray-100/10 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="vertical"
      >
        <motion.div
          className="relative flex-1"
          style={{ opacity: scrollProgress }}
        >
          <ScrollArea.Thumb 
            className={`relative flex-1 rounded-[10px] ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-400 hover:bg-gray-500'
            } transition-colors before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]`}
          />
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-[10px] blur-md"
            style={{
              background: darkMode 
                ? 'linear-gradient(to bottom, rgba(147, 51, 234, 0.4), rgba(59, 130, 246, 0.4))'
                : 'linear-gradient(to bottom, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
              opacity: scrollProgress,
            }}
          />
        </motion.div>
      </ScrollArea.Scrollbar>
      
      <ScrollArea.Corner className={darkMode ? 'bg-gray-800' : 'bg-gray-200'} />
    </ScrollArea.Root>
  );
}