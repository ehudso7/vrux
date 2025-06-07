import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Globe, 
  Lock,
  Link2,
  Loader2,
  Tag,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth-context';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  title?: string;
}

export default function ShareDialog({ open, onOpenChange, code, title = 'My Component' }: ShareDialogProps) {
  const { user } = useAuth();
  const [shareType, setShareType] = useState<'public' | 'private'>('public');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareId, setShareId] = useState('');
  
  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state
      setShareType('public');
      setDescription('');
      setTags('');
      setCopied(false);
      setSharing(false);
      setShareUrl('');
      setShareId('');
    }
    onOpenChange(newOpen);
  };
  
  const embedCode = shareUrl ? `<iframe src="${shareUrl}/embed" width="100%" height="600" frameborder="0"></iframe>` : '';

  const handleShare = async () => {
    if (!user) {
      toast.error('Please sign in to share components');
      return;
    }

    setSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          title,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          isPublic: shareType === 'public',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      const data = await response.json();
      setShareUrl(data.url);
      setShareId(data.share.id);
      
      toast.success('Component shared successfully!');
    } catch {
      toast.error('Failed to share component');
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(message);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-6"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold">Share Component</h2>
                    </div>
                    <Dialog.Close asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {!shareId ? (
                    <>
                      {/* Component Details */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Description (optional)
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your component..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            maxLength={500}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Tags (optional)
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={tags}
                              onChange={(e) => setTags(e.target.value)}
                              placeholder="react, tailwind, dashboard"
                              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>
                      </div>

                      {/* Share Type Selector */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setShareType('public')}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${shareType === 'public' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Globe className="w-5 h-5 text-gray-600 mb-2" />
                      <h3 className="font-medium text-sm">Public Link</h3>
                      <p className="text-xs text-gray-500 mt-1">Anyone with the link can view</p>
                    </button>
                    <button
                      onClick={() => setShareType('private')}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${shareType === 'private' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Lock className="w-5 h-5 text-gray-600 mb-2" />
                      <h3 className="font-medium text-sm">Private Link</h3>
                      <p className="text-xs text-gray-500 mt-1">Only invited users can view</p>
                    </button>
                  </div>

                      {/* Share Button */}
                      <Button
                        onClick={handleShare}
                        disabled={sharing || !code}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                      >
                        {sharing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Creating share link...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 mr-2" />
                            Create Share Link
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    /* Share Success Section */
                    <div className="space-y-6">
                      {/* Success Message */}
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Component Shared Successfully!</h3>
                        <p className="text-sm text-gray-600">Your component is now {shareType === 'public' ? 'publicly' : 'privately'} accessible.</p>
                      </div>

                      {/* Share Link */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Share Link
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                            <Link2 className="w-4 h-4 text-gray-400 mr-2" />
                            <input
                              type="text"
                              value={shareUrl}
                              readOnly
                              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCopy(shareUrl, 'Link copied!')}
                            className="px-3"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Embed Code */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Embed Code
                        </label>
                        <div className="relative">
                          <textarea
                            value={embedCode}
                            readOnly
                            rows={3}
                            className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 resize-none"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(embedCode, 'Embed code copied!')}
                            className="absolute top-2 right-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-4">
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-medium text-center hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Share
                        </a>
                        <Button
                          onClick={() => handleOpenChange(false)}
                          className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}