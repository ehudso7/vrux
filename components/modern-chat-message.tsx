import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  User, 
  Terminal, 
  FileCode, 
  Activity, 
  AlertCircle,
  Sparkles,
  Clock
} from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'user' | 'assistant' | 'system' | 'file' | 'terminal' | 'step';
    content: string;
    timestamp: Date;
    variant?: number;
    metadata?: Record<string, unknown>;
  };
  darkMode: boolean;
  variant?: { name: string; icon: React.ReactNode };
}

const typeConfig = {
  user: {
    icon: User,
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    align: 'justify-end',
  },
  assistant: {
    icon: Bot,
    bgColor: 'bg-gradient-to-br from-purple-500 to-pink-500',
    textColor: 'text-white',
    align: 'justify-start',
  },
  system: {
    icon: AlertCircle,
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    align: 'justify-start',
  },
  terminal: {
    icon: Terminal,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    align: 'justify-start',
  },
  file: {
    icon: FileCode,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    align: 'justify-start',
  },
  step: {
    icon: Activity,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    align: 'justify-start',
  },
};

export default function ModernChatMessage({ message, darkMode, variant }: ChatMessageProps) {
  const config = typeConfig[message.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={`flex gap-3 ${config.align}`}
    >
      {/* Avatar */}
      {message.type !== 'user' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <Avatar.Root className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
            <Avatar.Fallback className={`w-full h-full flex items-center justify-center ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </Avatar.Fallback>
          </Avatar.Root>
          {message.type === 'assistant' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Message Content */}
      <motion.div
        initial={{ x: message.type === 'user' ? 20 : -20 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', delay: 0.15 }}
        className={`flex-1 ${message.type === 'user' ? 'max-w-[80%]' : ''}`}
      >
        <div className={`rounded-2xl px-4 py-3 shadow-lg ${
          message.type === 'user'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ml-auto'
            : message.type === 'terminal'
            ? darkMode 
              ? 'bg-gray-900 border border-green-500/20' 
              : 'bg-gray-900'
            : darkMode 
            ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50' 
            : 'bg-white border border-gray-200/50'
        }`}>
          {/* Message Text */}
          <p className={`text-sm leading-relaxed ${
            message.type === 'terminal' 
              ? 'font-mono text-green-400' 
              : message.type === 'user'
              ? 'text-white'
              : darkMode 
              ? 'text-gray-200' 
              : 'text-gray-800'
          }`}>
            {message.content}
          </p>

          {/* Timestamp */}
          <div className={`flex items-center gap-2 mt-2 text-xs ${
            message.type === 'user' 
              ? 'text-purple-200' 
              : darkMode 
              ? 'text-gray-500' 
              : 'text-gray-400'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{message.timestamp.toLocaleTimeString()}</span>
          </div>

          {/* Variant Badge */}
          {message.variant !== undefined && variant && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2"
            >
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {variant.icon}
                <span>{variant.name}</span>
              </span>
            </motion.div>
          )}
        </div>

        {/* File Metadata */}
        {message.type === 'file' && message.metadata && 'fileName' in message.metadata && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 flex items-center gap-2 text-xs ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>{message.metadata.fileName as string}</span>
          </motion.div>
        )}
      </motion.div>

      {/* User Avatar */}
      {message.type === 'user' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <Avatar.Root className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
            <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <User className="w-5 h-5 text-white" />
            </Avatar.Fallback>
          </Avatar.Root>
        </motion.div>
      )}
    </motion.div>
  );
}