import { LiveProvider, LivePreview, LiveError } from 'react-live';
import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PreviewProps } from '../lib/types';

// Enhanced scope for react-live with all common React features
const scope = {
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,
  // Add Fragment support
  Fragment: React.Fragment,
};

export default function Preview({ code }: PreviewProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Better code wrapping logic with error handling
  const processedCode = useMemo(() => {
    if (!code || code.trim() === '') {
      setError(null);
      return '';
    }
    
    try {
      // Clean the code first
      let cleanCode = code.trim();
      
      // Remove any surrounding backticks or markdown
      cleanCode = cleanCode.replace(/^```[a-z]*\n?|\n?```$/gi, '');
      
      // Fix common syntax errors
      // Remove trailing ')' that might cause issues
      if (cleanCode.endsWith(')') && !cleanCode.endsWith('();') && !cleanCode.endsWith(');')) {
        const openCount = (cleanCode.match(/\(/g) || []).length;
        const closeCount = (cleanCode.match(/\)/g) || []).length;
        if (closeCount > openCount) {
          cleanCode = cleanCode.slice(0, -1);
        }
      }
    
    // Check if it's already a complete component
    const hasExport = cleanCode.includes('export default');
    const hasFunction = cleanCode.includes('function') && cleanCode.includes('return');
    const hasArrowFunction = cleanCode.includes('=>') && cleanCode.includes('return');
    const hasReturnStatement = cleanCode.includes('return');
    
    // If it looks like a complete component, use it as is
    if (hasExport || (hasFunction && hasReturnStatement) || (hasArrowFunction && hasReturnStatement)) {
      // Ensure it has an export default
      if (!hasExport) {
        // Try to find the component name
        const functionMatch = cleanCode.match(/(?:function|const)\s+(\w+)/);
        if (functionMatch) {
          cleanCode = `${cleanCode}\n\nexport default ${functionMatch[1]};`;
        } else {
          // Wrap in a default export
          cleanCode = `const Component = ${cleanCode};\nexport default Component;`;
        }
      }
      return cleanCode;
    }
    
    // Otherwise, wrap it as JSX
    return `export default function Component() {
  return (
    ${cleanCode}
  );
}`;
  }, [code]);

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!code) {
    return (
      <div className="flex items-center justify-center p-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Your generated UI will appear here</p>
          <p className="text-gray-400 text-sm">Start by describing a component above</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-gray-200">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Live Preview
          </h2>
          <span className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Interactive
          </span>
        </div>
      </div>
      
      <LiveProvider 
        code={processedCode} 
        scope={scope}
        noInline={false}
      >
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-xl bg-white">
          {/* Error Display */}
          <LiveError className="text-red-600 text-sm font-mono p-4 bg-red-50 border-b border-red-200" />
          
          {/* Preview Container with better styling */}
          <div className="relative min-h-[300px] p-8 bg-gradient-to-br from-white to-gray-50">
            <div className="relative z-10">
              <LivePreview />
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, gray 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
          </div>
        </div>
      </LiveProvider>
    </div>
  );
} 