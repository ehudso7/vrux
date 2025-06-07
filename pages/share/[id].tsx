import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Eye, 
  Heart, 
  Copy, 
  Download, 
  Calendar, 
  User,
  Tag,
  ArrowLeft,
  Loader2,
  Check,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Share2,
  AlertCircle
} from 'lucide-react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as Tabs from '@radix-ui/react-tabs';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../lib/auth-context';
import type { SharedComponent } from '../../lib/share-store';

export default function SharedComponentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [share, setShare] = useState<SharedComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const fetchShare = useCallback(async (shareId: string) => {
    try {
      const response = await fetch(`/api/share?id=${shareId}`);
      
      if (response.status === 404) {
        setError('This share could not be found or may have been deleted.');
        setLoading(false);
        return;
      }
      
      if (response.status === 401) {
        // Need to sign in to view private shares
        router.push(`/signin?redirect=/share/${shareId}`);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load share');
      }
      
      const data = await response.json();
      setShare(data.share);
      setLikeCount(data.share.likes);
      
      // Check if user has liked this share (would need another endpoint)
      // For now, we'll just track it locally
    } catch {
      setError('Failed to load shared component. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchShare(id);
    }
  }, [id, fetchShare]);

  const handleLike = async () => {
    if (!user) {
      router.push(`/signin?redirect=/share/${id}`);
      return;
    }
    
    try {
      const response = await fetch(`/api/share/${id}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to like share');
      }
      
      const data = await response.json();
      setLiked(data.liked);
      setLikeCount(data.likes);
      
      toast.success(data.liked ? 'Added to favorites!' : 'Removed from favorites');
    } catch {
      toast.error('Failed to update like status');
    }
  };

  const handleCopy = async () => {
    if (!share) return;
    
    try {
      await navigator.clipboard.writeText(share.code);
      setCopied(true);
      toast.success('Code copied to clipboard!', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    if (!share) return;
    
    const blob = new Blob([share.code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${share.title.toLowerCase().replace(/\s+/g, '-')}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Component downloaded!', { duration: 2000 });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: share?.title || 'VRUX Component',
          text: share?.description || 'Check out this amazing component',
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied!', { duration: 2000 });
      } catch {
        toast.error('Failed to copy share link');
      }
    }
  };

  const deviceFrames = {
    desktop: "w-full h-full",
    tablet: "max-w-[768px] max-h-[1024px] mx-auto",
    mobile: "max-w-[375px] max-h-[667px] mx-auto"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading component...</p>
        </div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Component Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This shared component could not be found.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{share.title} - VRUX</title>
        <meta name="description" content={share.description || `Check out this component: ${share.title}`} />
        <meta property="og:title" content={`${share.title} - VRUX`} />
        <meta property="og:description" content={share.description || 'Amazing React component built with VRUX'} />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Header */}
        <nav className="bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl">VRUX</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 dark:text-gray-400">Shared Component</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    liked 
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Component Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{share.title}</h1>
            {share.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {share.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{share.userName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(share.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{share.views} views</span>
              </div>
              {share.tags && share.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <div className="flex gap-1">
                    {share.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Component Display */}
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
              {/* Tab Header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <Tabs.List className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <Tabs.Trigger
                      value="preview"
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </div>
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="code"
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Code
                      </div>
                    </Tabs.Trigger>
                  </Tabs.List>

                  <div className="flex items-center gap-2">
                    {activeTab === 'preview' && (
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                        {[
                          { id: 'desktop' as const, icon: Monitor },
                          { id: 'tablet' as const, icon: Tablet },
                          { id: 'mobile' as const, icon: Smartphone },
                        ].map((device) => (
                          <button
                            key={device.id}
                            onClick={() => setDeviceView(device.id)}
                            className={`p-2 rounded transition-all ${
                              deviceView === device.id
                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <device.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <Tabs.Content value="preview" className="h-[600px] p-8 overflow-auto">
                <div className={deviceFrames[deviceView]}>
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
                    <LiveError className="text-red-500 text-sm mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg" />
                    <LivePreview className="font-sans" />
                  </LiveProvider>
                </div>
              </Tabs.Content>

              <Tabs.Content value="code" className="h-[600px]">
                <Editor
                  defaultValue={share.code}
                  language="javascript"
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
      </div>
    </>
  );
}