import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { AIChatBoxProps } from '../lib/types';

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  "A hero section with gradient background and animated text",
  "A pricing card with monthly/yearly toggle",
  "A modern contact form with validation states",
  "A testimonial carousel with avatar images",
  "A feature grid with icons and hover effects"
];

export default function AIChatBox({ onGenerate }: AIChatBoxProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedExample, setSelectedExample] = useState<number>(-1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setSelectedExample(-1);

    try {
      await onGenerate(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate component');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string, index: number): void => {
    setPrompt(example);
    setSelectedExample(index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">
          What would you like to <span className="text-gradient">create today?</span>
        </h2>
        <p className="text-gray-600">
          Describe your component in natural language and watch the magic happen
        </p>
      </div>

      {/* Example Prompts */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example, index)}
              className={`
                px-4 py-2 text-sm rounded-full transition-all duration-200
                ${selectedExample === index 
                  ? 'gradient-primary text-white shadow-medium' 
                  : 'glass border border-gray-200/50 hover:border-purple-500/20 hover:bg-purple-500/5'
                }
              `}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
            placeholder="Describe your UI component..."
            disabled={isLoading}
            className="h-14 px-6 pr-32 text-base rounded-2xl border-gray-200/50 focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          />
          <Button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl gradient-primary text-white hover-lift disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                Generate
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-slide-up">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </form>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <FeatureItem
          icon="🎯"
          title="Context Aware"
          description="Understands component relationships"
        />
        <FeatureItem
          icon="♿"
          title="Accessible"
          description="WCAG compliant by default"
        />
        <FeatureItem
          icon="📱"
          title="Responsive"
          description="Mobile-first approach"
        />
      </div>
    </div>
  );
}

// Feature Item Component
interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
} 