import React from 'react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg',
      outline: 'border-2 border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      destructive: 'bg-red-500 text-white hover:bg-red-600'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
      md: 'px-4 py-2 text-base rounded-xl gap-2',
      lg: 'px-6 py-3 text-lg rounded-2xl gap-2.5',
      icon: 'p-2 rounded-lg'
    };
    
    const classes = `${baseStyles} ${variants[variant]} ${sizes[size as keyof typeof sizes] || sizes.md} ${className}`;
    
    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';