import { analyzeCode, generateDiff, suggestFollowUps, type CodeAnalysis } from './ai-code-analyzer';
import { enhancePrompt } from './prompt-enhancer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  code?: string;
  analysis?: CodeAnalysis;
  suggestions?: string[];
  timestamp: Date;
  type?: 'text' | 'code' | 'edit' | 'suggestion';
  metadata?: {
    tokensUsed?: number;
    generationTime?: number;
    model?: string;
  };
}

export interface ChatContext {
  messages: ChatMessage[];
  currentCode: string;
  codeHistory: { code: string; timestamp: Date; message: string }[];
  projectContext: {
    framework: 'react' | 'vue' | 'angular';
    styling: 'tailwind' | 'css' | 'styled-components';
    typescript: boolean;
  };
}

export class ChatProcessor {
  private context: ChatContext;
  private lastAnalysis: CodeAnalysis | null = null;

  constructor() {
    this.context = {
      messages: [],
      currentCode: '',
      codeHistory: [],
      projectContext: {
        framework: 'react',
        styling: 'tailwind',
        typescript: true
      }
    };
  }

  processUserMessage(message: string, currentCode?: string): {
    enhancedPrompt: string;
    intent: 'create' | 'edit' | 'explain' | 'fix' | 'enhance';
    targetElements?: string[];
    suggestedActions: string[];
  } {
    const lowerMessage = message.toLowerCase();
    
    // Detect intent
    let intent: 'create' | 'edit' | 'explain' | 'fix' | 'enhance' = 'create';
    
    if (currentCode) {
      if (lowerMessage.includes('change') || lowerMessage.includes('update') || lowerMessage.includes('modify')) {
        intent = 'edit';
      } else if (lowerMessage.includes('fix') || lowerMessage.includes('debug') || lowerMessage.includes('error')) {
        intent = 'fix';
      } else if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
        intent = 'explain';
      } else if (lowerMessage.includes('improve') || lowerMessage.includes('enhance') || lowerMessage.includes('better')) {
        intent = 'enhance';
      }
    }

    // Extract target elements for edits
    const targetElements = this.extractTargetElements(message, currentCode);

    // Generate enhanced prompt based on intent
    let enhancedPrompt = message;
    
    if (intent === 'edit' && currentCode) {
      enhancedPrompt = this.createEditPrompt(message, currentCode, targetElements);
    } else if (intent === 'fix' && currentCode) {
      enhancedPrompt = this.createFixPrompt(message, currentCode);
    } else if (intent === 'enhance' && currentCode) {
      enhancedPrompt = this.createEnhancePrompt(message, currentCode);
    } else {
      enhancedPrompt = enhancePrompt(message);
    }

    // Suggest related actions
    const suggestedActions = this.generateSuggestedActions(intent, message, currentCode);

    return {
      enhancedPrompt,
      intent,
      targetElements,
      suggestedActions
    };
  }

  processAssistantResponse(code: string, userPrompt: string): {
    code: string;
    analysis: CodeAnalysis;
    suggestions: string[];
    improvements: string[];
    diff?: string;
  } {
    // Analyze the generated code
    const analysis = analyzeCode(code);
    this.lastAnalysis = analysis;

    // Generate follow-up suggestions
    const suggestions = suggestFollowUps(analysis, userPrompt);

    // Check for improvements
    const improvements = this.generateImprovements(analysis);

    // Generate diff if this is an edit
    let diff;
    if (this.context.currentCode) {
      diff = generateDiff(this.context.currentCode, code);
    }

    // Update context
    this.context.currentCode = code;
    this.context.codeHistory.push({
      code,
      timestamp: new Date(),
      message: userPrompt
    });

    return {
      code,
      analysis,
      suggestions,
      improvements,
      diff
    };
  }

  private extractTargetElements(message: string, code?: string): string[] {
    if (!code) return [];

    const targets: string[] = [];
    
    // Extract component names mentioned
    const componentRegex = /<(\w+)/g;
    const matches = code.matchAll(componentRegex);
    
    for (const match of matches) {
      const componentName = match[1];
      if (message.toLowerCase().includes(componentName.toLowerCase())) {
        targets.push(componentName);
      }
    }

    // Extract specific elements mentioned (button, input, etc.)
    const commonElements = ['button', 'input', 'form', 'card', 'modal', 'header', 'footer', 'nav'];
    commonElements.forEach(element => {
      if (message.toLowerCase().includes(element)) {
        targets.push(element);
      }
    });

    return [...new Set(targets)];
  }

  private createEditPrompt(message: string, currentCode: string, targets: string[]): string {
    let prompt = `Given this existing React component:\n\n${currentCode}\n\n`;
    prompt += `Make the following changes: ${message}\n\n`;
    
    if (targets.length > 0) {
      prompt += `Focus on these elements: ${targets.join(', ')}\n`;
    }
    
    prompt += `
Requirements:
1. Maintain all existing functionality unless explicitly asked to change
2. Keep the same component structure and naming
3. Preserve all imports and dependencies
4. Only modify the specific parts mentioned
5. Ensure the component remains fully functional
6. Add any new imports if needed for the changes
7. Maintain consistent code style
8. Return the complete modified component`;

    return prompt;
  }

  private createFixPrompt(message: string, currentCode: string): string {
    const analysis = analyzeCode(currentCode);
    
    let prompt = `Fix the following issues in this React component:\n\n${currentCode}\n\n`;
    prompt += `User reported: ${message}\n\n`;
    
    if (analysis.issues.length > 0) {
      prompt += `Detected issues:\n${analysis.issues.map(i => `- ${i.message}`).join('\n')}\n\n`;
    }
    
    prompt += `
Fix requirements:
1. Address all user-reported issues
2. Fix any detected code issues
3. Ensure proper error handling
4. Add missing dependencies or imports
5. Maintain TypeScript types if present
6. Test that all functionality works
7. Return the complete fixed component`;

    return prompt;
  }

  private createEnhancePrompt(message: string, currentCode: string): string {
    const analysis = analyzeCode(currentCode);
    
    let prompt = `Enhance this React component:\n\n${currentCode}\n\n`;
    prompt += `Enhancement request: ${message}\n\n`;
    
    if (analysis.suggestions.length > 0) {
      prompt += `Suggested improvements:\n${analysis.suggestions.map(s => `- ${s.message}`).join('\n')}\n\n`;
    }
    
    prompt += `
Enhancement requirements:
1. Improve performance where possible
2. Add better error handling and loading states
3. Enhance accessibility (ARIA, keyboard navigation)
4. Add smooth animations and transitions
5. Improve responsive design
6. Add TypeScript types if not present
7. Make the UI more modern and polished
8. Return the complete enhanced component`;

    return prompt;
  }

  private generateSuggestedActions(intent: string, message: string, code?: string): string[] {
    const actions: string[] = [];

    if (intent === 'create') {
      actions.push('Add animations and transitions');
      actions.push('Make it responsive for mobile');
      actions.push('Add dark mode support');
      actions.push('Include error handling');
    } else if (intent === 'edit' && code) {
      actions.push('Undo last change');
      actions.push('Preview before/after');
      actions.push('Apply to similar elements');
      actions.push('Save as new variant');
    } else if (intent === 'fix') {
      actions.push('Run accessibility check');
      actions.push('Validate TypeScript types');
      actions.push('Check for performance issues');
      actions.push('Test error scenarios');
    } else if (intent === 'enhance') {
      actions.push('Add loading skeletons');
      actions.push('Implement virtualization');
      actions.push('Add keyboard shortcuts');
      actions.push('Optimize bundle size');
    }

    return actions;
  }

  private generateImprovements(analysis: CodeAnalysis): string[] {
    const improvements: string[] = [];

    // Performance improvements
    if (analysis.components.some((c) => c.complexity === 'high')) {
      improvements.push('Consider memoizing expensive computations with useMemo');
      improvements.push('Use React.memo for components that re-render frequently');
    }

    // Accessibility improvements
    if (!analysis.suggestions.some((s) => s.type === 'accessibility')) {
      improvements.push('Add ARIA labels to interactive elements');
      improvements.push('Ensure proper keyboard navigation order');
    }

    // Code quality improvements
    if (analysis.issues.length > 0) {
      improvements.push('Fix ESLint warnings for better code quality');
      improvements.push('Add proper TypeScript types to avoid runtime errors');
    }

    return improvements;
  }

  getContextSummary(): string {
    const recentMessages = this.context.messages.slice(-5);
    const components = this.lastAnalysis?.components.map((c) => c.name).join(', ') || 'None';
    
    return `
Recent conversation context:
- Components created: ${components}
- Recent actions: ${recentMessages.map(m => m.type || 'text').join(', ')}
- Current framework: ${this.context.projectContext.framework}
- Styling: ${this.context.projectContext.styling}
    `.trim();
  }

  suggestNextSteps(): string[] {
    if (!this.lastAnalysis) return [];

    const suggestions: string[] = [];

    // Based on component analysis
    if (this.lastAnalysis.stateVariables.length === 0) {
      suggestions.push('Add interactive features with state management');
    }

    if (!this.lastAnalysis.hooks.some((h) => h.name === 'useEffect')) {
      suggestions.push('Add data fetching or side effects');
    }

    if (this.lastAnalysis.eventHandlers.length < 2) {
      suggestions.push('Add more interactive elements and event handlers');
    }

    // Based on code patterns
    if (!this.context.currentCode.includes('loading')) {
      suggestions.push('Add loading states for better UX');
    }

    if (!this.context.currentCode.includes('error')) {
      suggestions.push('Implement error boundaries and error handling');
    }

    return suggestions;
  }
}