import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export interface CodeAnalysis {
  components: ComponentInfo[];
  imports: string[];
  stateVariables: StateVariable[];
  props: PropInfo[];
  hooks: HookInfo[];
  eventHandlers: EventHandler[];
  suggestions: Suggestion[];
  issues: Issue[];
}

interface ComponentInfo {
  name: string;
  type: 'functional' | 'class';
  hasState: boolean;
  hasEffects: boolean;
  complexity: 'low' | 'medium' | 'high';
}

interface StateVariable {
  name: string;
  initialValue: string;
  usageCount: number;
}

interface PropInfo {
  name: string;
  type?: string;
  required: boolean;
  defaultValue?: string;
}

interface HookInfo {
  name: string;
  dependencies?: string[];
  line: number;
}

interface EventHandler {
  name: string;
  event: string;
  complexity: number;
}

interface Suggestion {
  type: 'performance' | 'accessibility' | 'best-practice' | 'style';
  message: string;
  severity: 'info' | 'warning' | 'error';
  line?: number;
  fix?: {
    description: string;
    code: string;
  };
}

interface Issue {
  type: string;
  message: string;
  line?: number;
  column?: number;
}

export function analyzeCode(code: string): CodeAnalysis {
  const analysis: CodeAnalysis = {
    components: [],
    imports: [],
    stateVariables: [],
    props: [],
    hooks: [],
    eventHandlers: [],
    suggestions: [],
    issues: []
  };

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true
    });

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        analysis.imports.push(source);
      },

      FunctionDeclaration(path) {
        if (t.isIdentifier(path.node.id)) {
          const name = path.node.id.name;
          if (name[0] === name[0].toUpperCase()) {
            analyzeComponent(path, name, analysis);
          }
        }
      },

      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          path.node.id.name[0] === path.node.id.name[0].toUpperCase() &&
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
        ) {
          analyzeComponent(path, path.node.id.name, analysis);
        }
      },

      CallExpression(path) {
        if (t.isIdentifier(path.node.callee)) {
          const name = path.node.callee.name;
          
          // Analyze hooks
          if (name.startsWith('use')) {
            analyzeHook(path, name, analysis);
          }
          
          // Analyze state
          if (name === 'useState') {
            analyzeState(path, analysis);
          }
        }
      },

      JSXAttribute(path) {
        if (t.isJSXIdentifier(path.node.name)) {
          const attrName = path.node.name.name;
          
          // Analyze event handlers
          if (attrName.startsWith('on')) {
            analyzeEventHandler(path, attrName, analysis);
          }
        }
      }
    });

    // Generate suggestions based on analysis
    generateSuggestions(analysis);
    
    // Check for common issues
    checkForIssues(code, analysis);

  } catch (error) {
    analysis.issues.push({
      type: 'parse-error',
      message: error instanceof Error ? error.message : 'Failed to parse code'
    });
  }

  return analysis;
}

function analyzeComponent(path: NodePath, name: string, analysis: CodeAnalysis) {
  let hasState = false;
  let hasEffects = false;
  let complexity = 0;

  traverse(path.node, {
    CallExpression(innerPath) {
      if (t.isIdentifier(innerPath.node.callee)) {
        const hookName = innerPath.node.callee.name;
        if (hookName === 'useState') hasState = true;
        if (hookName === 'useEffect') hasEffects = true;
        if (hookName.startsWith('use')) complexity++;
      }
    },
    JSXElement() {
      complexity++;
    }
  }, path.scope, path);

  analysis.components.push({
    name,
    type: 'functional',
    hasState,
    hasEffects,
    complexity: complexity < 5 ? 'low' : complexity < 10 ? 'medium' : 'high'
  });
}

function analyzeHook(path: NodePath, name: string, analysis: CodeAnalysis) {
  const hook: HookInfo = {
    name,
    line: path.node.loc?.start.line || 0
  };

  // Analyze useEffect dependencies
  if (name === 'useEffect' && t.isCallExpression(path.node) && path.node.arguments.length > 1) {
    const deps = path.node.arguments[1];
    if (t.isArrayExpression(deps)) {
      hook.dependencies = deps.elements
        .filter((el): el is t.Identifier => t.isIdentifier(el))
        .map((el) => el.name);
    }
  }

  analysis.hooks.push(hook);
}

function analyzeState(path: NodePath, analysis: CodeAnalysis) {
  if (path.parent && t.isVariableDeclarator(path.parent) && t.isCallExpression(path.node)) {
    const id = path.parent.id;
    if (t.isArrayPattern(id) && id.elements.length > 0) {
      const stateVar = id.elements[0];
      if (t.isIdentifier(stateVar)) {
        const initialValue = path.node.arguments[0];
        analysis.stateVariables.push({
          name: stateVar.name,
          initialValue: generate(initialValue).code,
          usageCount: 0
        });
      }
    }
  }
}

function analyzeEventHandler(path: NodePath, event: string, analysis: CodeAnalysis) {
  if (!t.isJSXAttribute(path.node)) return;
  
  const value = path.node.value;
  let complexity = 1;

  if (t.isJSXExpressionContainer(value) && value.expression) {
    // Calculate complexity based on the handler
    traverse(value.expression, {
      CallExpression() { complexity++; },
      ConditionalExpression() { complexity += 2; },
      LogicalExpression() { complexity++; }
    }, path.scope, path);
  }

  analysis.eventHandlers.push({
    name: `${event}Handler`,
    event,
    complexity
  });
}

function generateSuggestions(analysis: CodeAnalysis) {
  // Performance suggestions
  if (analysis.stateVariables.length > 5) {
    analysis.suggestions.push({
      type: 'performance',
      message: 'Consider using useReducer for complex state management',
      severity: 'info'
    });
  }

  // Check for missing dependencies in useEffect
  analysis.hooks
    .filter(h => h.name === 'useEffect' && h.dependencies)
    .forEach(hook => {
      if (hook.dependencies && hook.dependencies.length === 0) {
        analysis.suggestions.push({
          type: 'best-practice',
          message: 'Empty dependency array in useEffect - make sure this is intentional',
          severity: 'warning',
          line: hook.line
        });
      }
    });

  // Accessibility suggestions
  if (!analysis.imports.some(imp => imp.includes('aria'))) {
    analysis.suggestions.push({
      type: 'accessibility',
      message: 'Consider adding ARIA attributes for better accessibility',
      severity: 'info'
    });
  }

  // Component complexity
  analysis.components.forEach(comp => {
    if (comp.complexity === 'high') {
      analysis.suggestions.push({
        type: 'best-practice',
        message: `Component ${comp.name} is complex. Consider breaking it into smaller components`,
        severity: 'warning'
      });
    }
  });
}

function checkForIssues(code: string, analysis: CodeAnalysis) {
  // Check for console.log statements
  if (code.includes('console.log')) {
    analysis.issues.push({
      type: 'debug-code',
      message: 'Remove console.log statements before production'
    });
  }

  // Check for TODO comments
  const todoMatch = code.match(/\/\/\s*TODO|\/\*\s*TODO/g);
  if (todoMatch) {
    analysis.issues.push({
      type: 'todo',
      message: `Found ${todoMatch.length} TODO comment(s)`
    });
  }

  // Check for any type usage
  if (code.includes(': any')) {
    analysis.issues.push({
      type: 'typescript',
      message: 'Avoid using "any" type - use specific types instead'
    });
  }
}

export function generateDiff(oldCode: string, newCode: string): string {
  // Simple line-based diff for now
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const diff: string[] = [];

  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    if (i >= oldLines.length) {
      diff.push(`+ ${newLines[i]}`);
    } else if (i >= newLines.length) {
      diff.push(`- ${oldLines[i]}`);
    } else if (oldLines[i] !== newLines[i]) {
      diff.push(`- ${oldLines[i]}`);
      diff.push(`+ ${newLines[i]}`);
    } else {
      diff.push(`  ${oldLines[i]}`);
    }
  }

  return diff.join('\n');
}

export function suggestFollowUps(analysis: CodeAnalysis, prompt: string): string[] {
  const suggestions: string[] = [];

  // Based on component complexity
  if (analysis.components.some(c => c.complexity === 'high')) {
    suggestions.push('Break this component into smaller, reusable parts');
    suggestions.push('Add prop types or TypeScript interfaces');
  }

  // Based on state usage
  if (analysis.stateVariables.length > 0) {
    suggestions.push('Add form validation to the input fields');
    suggestions.push('Persist the state to localStorage');
    suggestions.push('Add loading and error states');
  }

  // Based on imports
  if (!analysis.imports.includes('framer-motion')) {
    suggestions.push('Add smooth animations with Framer Motion');
  }

  // Based on accessibility
  if (analysis.suggestions.some(s => s.type === 'accessibility')) {
    suggestions.push('Improve accessibility with ARIA labels and keyboard navigation');
  }

  // Based on the original prompt
  if (prompt.toLowerCase().includes('form')) {
    suggestions.push('Add client-side validation');
    suggestions.push('Implement form submission handling');
  }

  if (prompt.toLowerCase().includes('list') || prompt.toLowerCase().includes('table')) {
    suggestions.push('Add sorting functionality');
    suggestions.push('Implement pagination or infinite scroll');
    suggestions.push('Add search/filter capabilities');
  }

  if (prompt.toLowerCase().includes('card') || prompt.toLowerCase().includes('modal')) {
    suggestions.push('Add a close animation');
    suggestions.push('Make it dismissible with Escape key');
  }

  return suggestions.slice(0, 4); // Return top 4 suggestions
}