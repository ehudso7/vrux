export function enhancePrompt(originalPrompt: string): string {
  // Remove extra whitespace
  const cleanPrompt = originalPrompt.trim().replace(/\s+/g, ' ');
  
  // Check if prompt is too vague
  const vaguePhrases = ['make a', 'create a', 'build a', 'generate a'];
  const isVague = vaguePhrases.some(phrase => 
    cleanPrompt.toLowerCase().startsWith(phrase) && cleanPrompt.split(' ').length < 6
  );

  // Build enhanced prompt
  let enhanced = cleanPrompt;

  // Add technical specifications if missing
  if (!cleanPrompt.toLowerCase().includes('react') && !cleanPrompt.toLowerCase().includes('component')) {
    enhanced = `Create a React component with ${enhanced}`;
  }

  // Add styling context if missing
  if (!cleanPrompt.toLowerCase().includes('tailwind') && !cleanPrompt.toLowerCase().includes('style')) {
    enhanced += ' using Tailwind CSS for styling';
  }

  // Add responsive design if not mentioned
  if (!cleanPrompt.toLowerCase().includes('responsive') && !cleanPrompt.toLowerCase().includes('mobile')) {
    enhanced += ', ensuring responsive design for all screen sizes';
  }

  // Add modern UI patterns if vague
  if (isVague) {
    enhanced += ' with modern UI patterns, smooth animations, and professional aesthetics';
  }

  // Add accessibility if not mentioned
  if (!cleanPrompt.toLowerCase().includes('accessible') && !cleanPrompt.toLowerCase().includes('aria')) {
    enhanced += ', including proper accessibility features';
  }

  // Add TypeScript if not mentioned
  if (!cleanPrompt.toLowerCase().includes('typescript') && !cleanPrompt.toLowerCase().includes('types')) {
    enhanced += ' with TypeScript support';
  }

  // Specific enhancements for common requests
  const enhancements: Record<string, string> = {
    'dashboard': 'with data visualization, KPI cards, charts, and a sidebar navigation',
    'form': 'with validation, error handling, and proper field states',
    'table': 'with sorting, filtering, pagination, and responsive design',
    'card': 'with hover effects, proper spacing, and visual hierarchy',
    'modal': 'with backdrop, close button, and focus management',
    'navbar': 'with responsive menu, logo placement, and smooth transitions',
    'hero': 'with compelling headline, call-to-action buttons, and background effects',
    'landing': 'with hero section, features grid, testimonials, and footer',
    'gallery': 'with grid layout, lightbox effect, and lazy loading',
    'blog': 'with article cards, categories, and reading time estimates',
    'pricing': 'with tier comparison, highlighted popular option, and feature lists',
    'auth': 'with login/signup forms, social auth buttons, and validation',
    'profile': 'with avatar, user details, and editable fields',
    'settings': 'with grouped options, toggles, and save functionality',
    'chat': 'with message bubbles, typing indicators, and scroll behavior'
  };

  // Apply specific enhancements
  for (const [keyword, enhancement] of Object.entries(enhancements)) {
    if (cleanPrompt.toLowerCase().includes(keyword) && !cleanPrompt.includes(enhancement)) {
      enhanced += ` ${enhancement}`;
      break;
    }
  }

  // Add animation suggestion if not present
  if (!cleanPrompt.toLowerCase().includes('animat') && !cleanPrompt.toLowerCase().includes('transition')) {
    enhanced += '. Include subtle animations and smooth transitions';
  }

  // Clean up the enhanced prompt
  enhanced = enhanced.replace(/\s+/g, ' ').trim();
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  // Ensure it ends with a period
  if (!enhanced.endsWith('.')) {
    enhanced += '.';
  }

  return enhanced;
}

export function getPromptSuggestions(prompt: string): string[] {
  const suggestions: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Context-based suggestions
  if (lowerPrompt.includes('dashboard')) {
    suggestions.push('Add real-time data updates');
    suggestions.push('Include dark mode toggle');
    suggestions.push('Add export functionality');
  }

  if (lowerPrompt.includes('form')) {
    suggestions.push('Add field validation');
    suggestions.push('Include loading states');
    suggestions.push('Add success feedback');
  }

  if (lowerPrompt.includes('table')) {
    suggestions.push('Add bulk actions');
    suggestions.push('Include search functionality');
    suggestions.push('Add column visibility toggle');
  }

  if (lowerPrompt.includes('landing')) {
    suggestions.push('Add testimonial carousel');
    suggestions.push('Include pricing section');
    suggestions.push('Add newsletter signup');
  }

  // General suggestions if no specific context
  if (suggestions.length === 0) {
    suggestions.push('Add loading states');
    suggestions.push('Include error handling');
    suggestions.push('Add animations');
    suggestions.push('Make it responsive');
    suggestions.push('Add dark mode support');
  }

  return suggestions.slice(0, 3);
}