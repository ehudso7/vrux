import { motion } from 'framer-motion';
import { Copy, Eye } from 'lucide-react';
import { useState } from 'react';

interface TemplateCardProps {
  title: string;
  description: string;
  preview?: string;
  likes: number;
  users: number;
  onClick: () => void;
  onCopy: () => void;
  onPreview: () => void;
}

export default function TemplateCard({
  title,
  description,
  preview,
  likes,
  users,
  onClick,
  onCopy,
  onPreview
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      onPreview();
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative">
        {preview ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-4xl mb-2">{preview}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-600">Preview</span>
          </div>
        )}
        
        {showError && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <p className="text-red-600 dark:text-red-400 font-medium">Loading...</p>
          </div>
        )}

        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4"
          >
            <button
              onClick={handlePreview}
              className="p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="p-3 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {description}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1">
            ❤️ {likes} likes
          </span>
          <span className="flex items-center gap-1">
            👥 {users} uses
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Copy Code
        </button>
        <button
          onClick={onClick}
          className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Use This Template
        </button>
      </div>
    </motion.div>
  );
}
