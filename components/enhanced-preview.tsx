import { useState, useRef, useEffect } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';
import { Button } from './ui/button';
import * as React from 'react';
import * as FramerMotion from 'framer-motion';

interface EnhancedPreviewProps {
  code: string;
  variant?: number;
  onElementClick?: (element: Element) => void;
}

const deviceFrames = {
  desktop: {
    width: '100%',
    height: '100%',
    scale: 1,
    frame: false,
  },
  tablet: {
    width: '768px',
    height: '1024px',
    scale: 0.8,
    frame: true,
  },
  mobile: {
    width: '375px',
    height: '667px',
    scale: 0.8,
    frame: true,
  },
};

export default function EnhancedPreview({ code, variant = 0, onElementClick }: EnhancedPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const previewRef = useRef<HTMLDivElement>(null);

  const scope = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useRef: React.useRef,
    ...FramerMotion,
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      previewRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Add click handler for element selection
  useEffect(() => {
    if (!onElementClick) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as Element;
      if (target && previewRef.current?.contains(target)) {
        onElementClick(target);
      }
    };

    const preview = previewRef.current;
    if (preview) {
      preview.addEventListener('click', handleClick, true);
      return () => preview.removeEventListener('click', handleClick, true);
    }
  }, [onElementClick]);

  const deviceConfig = deviceFrames[device];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'relative'}`}
    >
      <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Toolbar */}
        <div className="bg-gray-900/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Device Selector */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <Button
                variant={device === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDevice('desktop')}
                className="px-3 py-1.5"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={device === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDevice('tablet')}
                className="px-3 py-1.5"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={device === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDevice('mobile')}
                className="px-3 py-1.5"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="p-1.5"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="p-1.5"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className="p-1.5"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2"
            >
              <Palette className="w-4 h-4" />
            </Button>

            {/* Grid Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="p-2"
            >
              {showGrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="p-2"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div 
          ref={previewRef}
          className={`relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} ${
            isFullscreen ? 'h-[calc(100vh-4rem)]' : 'h-[600px]'
          } overflow-auto flex items-center justify-center p-8`}
          style={{
            backgroundImage: showGrid
              ? `linear-gradient(to right, ${theme === 'dark' ? '#1f2937' : '#e5e7eb'} 1px, transparent 1px),
                 linear-gradient(to bottom, ${theme === 'dark' ? '#1f2937' : '#e5e7eb'} 1px, transparent 1px)`
              : 'none',
            backgroundSize: '20px 20px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${device}-${variant}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                width: deviceConfig.width,
                height: deviceConfig.height,
                transform: `scale(${(zoom / 100) * deviceConfig.scale})`,
                transformOrigin: 'center',
              }}
              className="relative"
            >
              {/* Device Frame */}
              {deviceConfig.frame && (
                <div className="absolute inset-0 pointer-events-none">
                  {device === 'tablet' && (
                    <div className="absolute inset-0 bg-gray-800 rounded-3xl p-8 shadow-2xl">
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-700 rounded-full"></div>
                    </div>
                  )}
                  {device === 'mobile' && (
                    <div className="absolute inset-0 bg-gray-800 rounded-[2.5rem] p-4 shadow-2xl">
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-full"></div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview */}
              <div 
                className={`${
                  deviceConfig.frame 
                    ? device === 'tablet' 
                      ? 'absolute inset-8 rounded-xl' 
                      : 'absolute inset-4 rounded-[2rem]'
                    : 'w-full h-full'
                } bg-white overflow-auto`}
              >
                <LiveProvider 
                  code={code} 
                  scope={scope}
                >
                  <LiveError className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg font-mono text-sm" />
                  <div className={theme === 'dark' ? 'dark' : ''}>
                    <LivePreview className="w-full h-full" />
                  </div>
                </LiveProvider>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Variant Indicator */}
          {variant !== undefined && (
            <div className="absolute top-4 right-4 bg-gray-900/90 text-white px-3 py-1 rounded-full text-sm">
              Variant {variant + 1}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}