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
  Users,
  Link2,
  QrCode
} from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: string;
}

export default function ShareDialog({ open, onOpenChange, componentId }: ShareDialogProps) {
  const [shareType, setShareType] = useState<'public' | 'private'>('public');
  const [copied, setCopied] = useState(false);
  
  // Generate shareable URL (in production this would be a real URL)
  const shareUrl = `https://vrux.app/share/${componentId}`;
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`;

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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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

                  {/* Share Link */}
                  <div className="space-y-4">
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

                    {/* QR Code */}
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                      <div className="text-center space-y-2">
                        <QrCode className="w-24 h-24 text-gray-300 mx-auto" />
                        <p className="text-xs text-gray-500">QR code generation coming soon</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>0 views</span>
                      </span>
                      <span>Expires: Never</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="gradient-primary text-white">
                        Create Link
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}