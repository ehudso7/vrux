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
          border border-gray-200 rounded-xl 
          bg-white/50 backdrop-blur-sm
          focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-none
          transition-all duration-200
          placeholder:text-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';