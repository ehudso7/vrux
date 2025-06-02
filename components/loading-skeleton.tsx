import React from 'react';

interface SkeletonProps {
  darkMode: boolean;
}

export function CodeEditorSkeleton({ darkMode }: SkeletonProps) {
  return (
    <div className={`h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className={`w-8 h-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded`} />
            <div className={`h-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded`} style={{ width: `${Math.random() * 60 + 20}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreviewSkeleton({ darkMode }: SkeletonProps) {
  return (
    <div className={`h-full ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} p-8`}>
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className={`h-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg`} />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-32 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg`} />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded`} style={{ width: `${Math.random() * 40 + 60}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FileTreeSkeleton() {
  return (
    <div className="p-3 space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${i > 2 ? 12 : 0}px` }}>
          <div className="w-4 h-4 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded" style={{ width: `${Math.random() * 40 + 60}px` }} />
        </div>
      ))}
    </div>
  );
}