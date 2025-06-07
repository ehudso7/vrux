import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import type { SharedComponent } from '../../../lib/share-store';

export default function EmbedPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [share, setShare] = useState<SharedComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchShare(id);
    }
  }, [id]);

  const fetchShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/share?id=${shareId}`);
      
      if (response.status === 404) {
        setError('This component could not be found.');
        setLoading(false);
        return;
      }
      
      if (response.status === 401) {
        setError('This component is private.');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load component');
      }
      
      const data = await response.json();
      setShare(data.share);
    } catch {
      setError('Failed to load component.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error || 'Component not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto bg-white">
      <LiveProvider
        code={share.code}
        scope={{
          React,
          useState,
          useEffect,
          motion,
        }}
        theme={{
          plain: {
            backgroundColor: 'transparent',
          },
          styles: [],
        }}
        noInline={false}
      >
        <LiveError className="text-red-500 text-sm p-4 bg-red-50 rounded-lg m-4" />
        <LivePreview className="font-sans p-4" />
      </LiveProvider>
      
      {/* Powered by VRUX watermark */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-gray-200">
        <a 
          href="https://vrux.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Powered by VRUX
        </a>
      </div>
    </div>
  );
}