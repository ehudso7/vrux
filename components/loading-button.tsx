import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  darkMode?: boolean;
}

export default function LoadingButton({
  children,
  loading = false,
  loadingText,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  darkMode = false,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: darkMode 
      ? 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-600' 
      : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 focus:ring-gray-500',
    ghost: darkMode
      ? 'text-gray-300 hover:bg-gray-800 focus:ring-gray-600'
      : 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5'
  };

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: loading ? 0 : 1,
          scale: loading ? 0 : 1
        }}
        transition={{ duration: 0.15 }}
      >
        {icon && <span className={iconSize[size]}>{icon}</span>}
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{
          x: loading ? (icon ? -8 : 0) : 0
        }}
        transition={{ duration: 0.15 }}
      >
        {loading ? (loadingText || children) : children}
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{
          opacity: loading ? 1 : 0,
          scale: loading ? 1 : 0,
          x: loading ? 0 : -8
        }}
        transition={{ duration: 0.15 }}
        className="absolute"
      >
        <Loader2 className={`${iconSize[size]} animate-spin`} />
      </motion.div>
    </button>
  );
}

// Usage examples:
// <LoadingButton loading={isGenerating} icon={<Send />}>
//   Generate
// </LoadingButton>
//
// <LoadingButton 
//   loading={isDeploying}
//   loadingText="Deploying..."
//   variant="secondary"
//   size="lg"
// >
//   Deploy to Vercel
// </LoadingButton>