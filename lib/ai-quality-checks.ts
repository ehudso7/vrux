import logger from './logger';

export interface QualityMetrics {
  accessibility: AccessibilityScore;
  performance: PerformanceScore;
  bestPractices: BestPracticesScore;
  seo: SEOScore;
  overall: number;
}

interface AccessibilityScore {
  score: number;
  issues: string[];
}

interface PerformanceScore {
  score: number;
  estimatedRenderTime: number;
  componentComplexity: number;
}

interface BestPracticesScore {
  score: number;
  violations: string[];
}

interface SEOScore {
  score: number;
  suggestions: string[];
}

export class AIQualityChecker {
  static async evaluateComponent(code: string): Promise<QualityMetrics> {
    const accessibility = this.checkAccessibility(code);
    const performance = this.checkPerformance(code);
    const bestPractices = this.checkBestPractices(code);
    const seo = this.checkSEO(code);
    
    const overall = (
      accessibility.score * 0.3 +
      performance.score * 0.3 +
      bestPractices.score * 0.3 +
      seo.score * 0.1
    );
    
    const metrics = {
      accessibility,
      performance,
      bestPractices,
      seo,
      overall
    };
    
    logger.info('Component quality evaluated', {
      overall: overall.toFixed(2),
      accessibility: accessibility.score,
      performance: performance.score,
      bestPractices: bestPractices.score,
      seo: seo.score
    });
    
    return metrics;
  }
  
  private static checkAccessibility(code: string): AccessibilityScore {
    const issues: string[] = [];
    let score = 100;
    
    // Check for alt attributes on images
    const imgMatches = code.match(/<img[^>]*>/g) || [];
    for (const img of imgMatches) {
      if (!img.includes('alt=')) {
        issues.push('Image missing alt attribute');
        score -= 10;
      }
    }
    
    // Check for ARIA labels on interactive elements
    const interactiveElements = ['button', 'input', 'select', 'textarea'];
    for (const element of interactiveElements) {
      const pattern = new RegExp(`<${element}[^>]*>`, 'g');
      const matches = code.match(pattern) || [];
      for (const match of matches) {
        if (!match.includes('aria-label') && !match.includes('aria-labelledby')) {
          // Check if it has visible text content
          const hasVisibleText = new RegExp(`<${element}[^>]*>[^<]+</${element}>`).test(code);
          if (!hasVisibleText) {
            issues.push(`${element} element missing ARIA label`);
            score -= 5;
          }
        }
      }
    }
    
    // Check for proper heading hierarchy
    const headings = code.match(/<h[1-6][^>]*>/g) || [];
    const headingLevels = headings.map(h => parseInt(h.match(/<h([1-6])/)?.[1] || '0'));
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        issues.push('Heading hierarchy skips levels');
        score -= 5;
        break;
      }
    }
    
    // Check for keyboard navigation
    if (code.includes('onClick') && !code.includes('onKeyDown')) {
      issues.push('Interactive elements may not be keyboard accessible');
      score -= 10;
    }
    
    // Check for color contrast hints
    if (!code.includes('dark:') && code.includes('text-gray-400')) {
      issues.push('Low contrast text colors detected');
      score -= 5;
    }
    
    return {
      score: Math.max(0, score),
      issues
    };
  }
  
  private static checkPerformance(code: string): PerformanceScore {
    let score = 100;
    let componentComplexity = 0;
    
    // Count hooks usage
    const hooksCount = (code.match(/use[A-Z]\w+/g) || []).length;
    componentComplexity += hooksCount * 2;
    
    // Count state variables
    const stateCount = (code.match(/useState/g) || []).length;
    componentComplexity += stateCount * 3;
    
    // Count effect hooks
    const effectCount = (code.match(/useEffect/g) || []).length;
    componentComplexity += effectCount * 5;
    
    // Penalize excessive re-renders
    if (effectCount > 3) {
      score -= 20;
    }
    
    // Check for memoization
    const hasMemoization = /useMemo|useCallback|React\.memo/.test(code);
    if (componentComplexity > 15 && !hasMemoization) {
      score -= 15;
    }
    
    // Check for large inline functions
    const inlineFunctions = code.match(/=>\s*{[^}]{100,}}/g) || [];
    if (inlineFunctions.length > 2) {
      score -= 10;
    }
    
    // Estimate render time (rough approximation)
    const estimatedRenderTime = componentComplexity * 10; // ms
    
    return {
      score: Math.max(0, score),
      estimatedRenderTime,
      componentComplexity
    };
  }
  
  private static checkBestPractices(code: string): BestPracticesScore {
    const violations: string[] = [];
    let score = 100;
    
    // Check for prop types or TypeScript
    if (!code.includes('interface') && !code.includes('type') && !code.includes('PropTypes')) {
      violations.push('Missing type definitions for props');
      score -= 15;
    }
    
    // Check for error boundaries
    if (code.includes('throw') && !code.includes('try') && !code.includes('catch')) {
      violations.push('Error handling not implemented');
      score -= 10;
    }
    
    // Check for console.log statements
    if (code.includes('console.log')) {
      violations.push('Console.log statements should be removed');
      score -= 5;
    }
    
    // Check for hardcoded values
    const hardcodedStrings = code.match(/["'][^"']{20,}["']/g) || [];
    if (hardcodedStrings.length > 5) {
      violations.push('Too many hardcoded strings - consider using constants');
      score -= 10;
    }
    
    // Check for proper event handler naming
    if (code.includes('onclick') || code.includes('onchange')) {
      violations.push('Event handlers should use camelCase (onClick, onChange)');
      score -= 10;
    }
    
    // Check for missing key props in lists
    if (code.includes('.map(') && !code.includes('key=')) {
      violations.push('List items missing key prop');
      score -= 15;
    }
    
    // Check for direct state mutations
    if (/state\.\w+\s*=/.test(code)) {
      violations.push('Direct state mutation detected');
      score -= 20;
    }
    
    return {
      score: Math.max(0, score),
      violations
    };
  }
  
  private static checkSEO(code: string): SEOScore {
    const suggestions: string[] = [];
    let score = 100;
    
    // Check for semantic HTML
    const semanticElements = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
    const hasSemanticHTML = semanticElements.some(element => code.includes(`<${element}`));
    if (!hasSemanticHTML) {
      suggestions.push('Use semantic HTML elements for better SEO');
      score -= 20;
    }
    
    // Check for heading tags
    if (!/<h[1-6]/.test(code)) {
      suggestions.push('Add heading tags for better content structure');
      score -= 15;
    }
    
    // Check for meta-friendly content
    if (code.includes('<title>') || code.includes('Head')) {
      score += 10; // Bonus for SEO awareness
    }
    
    // Check for lazy loading images
    if (code.includes('<img') && !code.includes('loading=')) {
      suggestions.push('Consider adding loading="lazy" to images');
      score -= 5;
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      suggestions
    };
  }
  
  // Generate improvement suggestions based on quality metrics
  static generateImprovementPrompt(metrics: QualityMetrics): string {
    const improvements: string[] = [];
    
    if (metrics.accessibility.score < 80) {
      improvements.push('improve accessibility by adding ARIA labels and ensuring keyboard navigation');
    }
    
    if (metrics.performance.score < 80) {
      improvements.push('optimize performance by memoizing expensive computations and reducing re-renders');
    }
    
    if (metrics.bestPractices.score < 80) {
      improvements.push('follow React best practices including proper error handling and type definitions');
    }
    
    if (metrics.seo.score < 80) {
      improvements.push('enhance SEO with semantic HTML and proper content structure');
    }
    
    if (improvements.length === 0) {
      return '';
    }
    
    return `Please ${improvements.join(', ')}.`;
  }
}