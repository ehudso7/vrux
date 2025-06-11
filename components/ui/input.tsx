import React from 'react';
import { InputHTMLAttributes, forwardRef } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 
          border border-gray-200 dark:border-gray-700 rounded-xl 
          bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
          text-gray-900 dark:text-white
          focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
          transition-all duration-200
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';