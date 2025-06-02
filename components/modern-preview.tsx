import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Tablet, Smartphone, ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ModernPreviewProps {
  code: string;
  darkMode: boolean;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

export default function ModernPreview({
  code,
  darkMode,
  deviceView,
  onDeviceChange,
  fullscreen,
  onFullscreenToggle
}: ModernPreviewProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [scale, setScale] = React.useState(1);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const deviceFrames = {
    desktop: {
      className: "w-full h-full",
      viewport: { width: "100%", height: "100%" }
    },
    tablet: {
      className: "max-w-[768px] max-h-[1024px] mx-auto",
      viewport: { width: "768px", height: "1024px" }
    },
    mobile: {
      className: "max-w-[375px] max-h-[812px] mx-auto",
      viewport: { width: "375px", height: "812px" }
    }
  };

  const deviceIcons = [
    { id: 'desktop' as const, icon: Monitor, label: 'Desktop view' },
    { id: 'tablet' as const, icon: Tablet, label: 'Tablet view' },
    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile view' }
  ];

  return (
    <div className={`h-full ${
      darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    } relative overflow-hidden`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23e5e7eb' stroke-width='1' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }} />
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>

      {/* Controls Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
          darkMode ? 'bg-gray-900/80 border border-gray-700' : 'bg-white/80 border border-gray-200'
        } shadow-lg`}
      >
        {/* Device Selector */}
        <div className="flex items-center gap-1">
          {deviceIcons.map((device) => (
            <Tooltip.Root key={device.id}>
              <Tooltip.Trigger asChild>
                <button
                  onClick={() => onDeviceChange(device.id)}
                  className={`p-2 rounded transition-all ${
                    deviceView === device.id 
                      ? darkMode
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                        : 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <device.icon className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                {device.label}
              </Tooltip.Content>
            </Tooltip.Root>
          ))}
        </div>

        <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className={`px-2 py-1 text-xs rounded ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => setScale(1)}
            className={`p-1 rounded ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* Actions */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded transition-all ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
            Refresh preview
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={onFullscreenToggle}
              className={`p-2 rounded transition-all ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </Tooltip.Content>
        </Tooltip.Root>
      </motion.div>

      {/* Preview Container */}
      <div className="relative h-full p-4 sm:p-6 lg:p-8 overflow-auto flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${deviceView}-${isRefreshing}`}
            initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 30,
              duration: 0.5 
            }}
            className={deviceFrames[deviceView].className}
            style={{ transform: `scale(${scale})` }}
          >
            {/* Device Frame */}
            <div className={`h-full relative ${
              deviceView === 'mobile' 
                ? 'bg-gray-900 p-2 rounded-[3rem] shadow-2xl' 
                : deviceView === 'tablet' 
                ? 'bg-gray-900 p-2 rounded-[2rem] shadow-2xl'
                : ''
            }`}>
              {/* Device Bezel */}
              {deviceView !== 'desktop' && (
                <div className={`absolute inset-2 ${
                  deviceView === 'mobile' ? 'rounded-[2.5rem]' : 'rounded-[1.5rem]'
                } bg-black`} />
              )}

              {/* Screen */}
              <div className={`relative h-full ${
                deviceView === 'mobile' 
                  ? 'rounded-[2.5rem] overflow-hidden' 
                  : deviceView === 'tablet'
                  ? 'rounded-[1.5rem] overflow-hidden'
                  : 'rounded-2xl overflow-hidden shadow-2xl'
              }`}>
                {/* Browser Chrome for Desktop */}
                {deviceView === 'desktop' && (
                  <div className={`${
                    darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                  } border-b px-4 py-3 flex items-center gap-3`}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors cursor-pointer" />
                    </div>
                    <div className={`flex-1 mx-4`}>
                      <div className={`px-4 py-1.5 rounded-lg ${
                        darkMode ? 'bg-gray-800' : 'bg-gray-100'
                      } text-xs font-mono flex items-center gap-2`}>
                        <span className="text-gray-500">localhost:3000</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Component Preview */}
                <div className={`${
                  darkMode ? 'bg-gray-950' : 'bg-white'
                } ${
                  deviceView === 'desktop' ? 'h-[calc(100%-53px)]' : 'h-full'
                } overflow-auto`}>
                  <div className={`${
                    deviceView === 'desktop' ? 'p-8' : 'p-4'
                  } h-full`}>
                    <LiveProvider 
                      code={code} 
                      scope={{ 
                        React, 
                        useState: React.useState, 
                        useEffect: React.useEffect, 
                        useRef: React.useRef,
                        useCallback: React.useCallback,
                        useMemo: React.useMemo,
                        motion,
                        AnimatePresence
                      }}
                      noInline={false}
                    >
                      <LiveError className="text-red-500 bg-red-50 dark:bg-red-950/50 p-4 rounded-lg text-sm mb-4 font-mono border border-red-200 dark:border-red-800" />
                      <LivePreview />
                    </LiveProvider>
                  </div>
                </div>

                {/* Device Notch/Island */}
                {deviceView === 'mobile' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl" />
                )}
                {deviceView === 'tablet' && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full" />
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!code && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`w-32 h-32 mx-auto mb-6 rounded-3xl ${
              darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
            } backdrop-blur-sm flex items-center justify-center`}>
              <Monitor className={`w-16 h-16 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
            </div>
            <h3 className={`text-xl font-medium mb-3 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Preview Yet
            </h3>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} max-w-md mx-auto`}>
              Start by describing the component you want to build, and the preview will appear here with live updates
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}