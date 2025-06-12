import * as babel from '@babel/core';
import * as t from '@babel/types';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import logger from './logger';

export interface ConversionOptions {
  framework: 'vue' | 'angular' | 'svelte';
  typescript?: boolean;
  componentName?: string;
  styleFormat?: 'css' | 'scss' | 'styled-components';
}

export interface ConversionResult {
  code: string;
  styles?: string;
  additionalFiles?: Array<{
    filename: string;
    content: string;
  }>;
  warnings?: string[];
}

export class FrameworkConverter {
  /**
   * Convert React component to other frameworks
   */
  async convert(reactCode: string, options: ConversionOptions): Promise<ConversionResult> {
    try {
      // Parse React component
      const ast = await this.parseReactComponent(reactCode);
      
      switch (options.framework) {
        case 'vue':
          return this.convertToVue(ast, reactCode, options);
        case 'angular':
          return this.convertToAngular(ast, reactCode, options);
        case 'svelte':
          return this.convertToSvelte(ast, reactCode, options);
        default:
          throw new Error(`Unsupported framework: ${options.framework}`);
      }
    } catch (error) {
      logger.error('Framework conversion failed', error as Error);
      throw error;
    }
  }

  /**
   * Parse React component to AST
   */
  private async parseReactComponent(code: string): Promise<t.File> {
    const result = await babel.parseAsync(code, {
      presets: ['@babel/preset-react', '@babel/preset-typescript'],
      plugins: ['@babel/plugin-syntax-jsx'],
      sourceType: 'module',
      filename: 'component.tsx'
    });

    if (!result) {
      throw new Error('Failed to parse React component');
    }

    return result;
  }

  /**
   * Convert to Vue 3 Composition API
   */
  private convertToVue(ast: t.File, originalCode: string, options: ConversionOptions): ConversionResult {
    const componentName = options.componentName || 'Component';
    const warnings: string[] = [];
    
    // Extract component info
    const componentInfo = this.extractComponentInfo(ast);
    
    // Generate Vue template
    const template = this.generateVueTemplate(componentInfo.jsx);
    
    // Generate Vue script
    const script = this.generateVueScript(componentInfo, options.typescript || false);
    
    // Generate styles
    const styles = this.extractStyles(originalCode);
    
    // Combine into Vue SFC
    const vueCode = `<template>
${this.indentLines(template, 2)}
</template>

<script${options.typescript ? ' lang="ts"' : ''}>
${script}
</script>

${styles ? `<style scoped>
${styles}
</style>` : ''}`;

    return {
      code: vueCode,
      warnings
    };
  }

  /**
   * Convert to Angular Component
   */
  private convertToAngular(ast: t.File, originalCode: string, options: ConversionOptions): ConversionResult {
    const componentName = options.componentName || 'Component';
    const warnings: string[] = [];
    
    // Extract component info
    const componentInfo = this.extractComponentInfo(ast);
    
    // Generate Angular template
    const template = this.generateAngularTemplate(componentInfo.jsx);
    
    // Generate Angular component
    const componentCode = `import { Component, OnInit${componentInfo.props.length > 0 ? ', Input' : ''} } from '@angular/core';

@Component({
  selector: 'app-${this.kebabCase(componentName)}',
  templateUrl: './${this.kebabCase(componentName)}.component.html',
  styleUrls: ['./${this.kebabCase(componentName)}.component.${options.styleFormat || 'css'}']
})
export class ${componentName}Component implements OnInit {
${componentInfo.props.map(prop => `  @Input() ${prop.name}${prop.required ? '!' : '?'}: ${this.convertTypeToAngular(prop.type)};`).join('\n')}

${componentInfo.state.map(state => `  ${state.name}: ${this.convertTypeToAngular(state.type)} = ${state.initialValue};`).join('\n')}

  constructor() { }

  ngOnInit(): void {
${componentInfo.effects.map(effect => `    // Effect: ${effect.dependencies.join(', ')}\n    ${effect.body}`).join('\n\n')}
  }

${componentInfo.methods.map(method => `  ${method.name}(${method.params.join(', ')}) {
${this.indentLines(method.body, 4)}
  }`).join('\n\n')}
}`;

    // Generate module file
    const moduleCode = `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ${componentName}Component } from './${this.kebabCase(componentName)}.component';

@NgModule({
  declarations: [${componentName}Component],
  imports: [CommonModule],
  exports: [${componentName}Component]
})
export class ${componentName}Module { }`;

    return {
      code: componentCode,
      additionalFiles: [
        {
          filename: `${this.kebabCase(componentName)}.component.html`,
          content: template
        },
        {
          filename: `${this.kebabCase(componentName)}.component.${options.styleFormat || 'css'}`,
          content: this.extractStyles(originalCode) || ''
        },
        {
          filename: `${this.kebabCase(componentName)}.module.ts`,
          content: moduleCode
        }
      ],
      warnings
    };
  }

  /**
   * Convert to Svelte Component
   */
  private convertToSvelte(ast: t.File, originalCode: string, options: ConversionOptions): ConversionResult {
    const warnings: string[] = [];
    
    // Extract component info
    const componentInfo = this.extractComponentInfo(ast);
    
    // Generate Svelte script
    const script = `<script${options.typescript ? ' lang="ts"' : ''}>
${componentInfo.props.map(prop => `  export let ${prop.name}${prop.required ? '' : ' = ' + (prop.defaultValue || 'undefined')};`).join('\n')}

${componentInfo.imports.filter(imp => !imp.includes('react')).join('\n')}

${componentInfo.state.map(state => `  let ${state.name} = ${state.initialValue};`).join('\n')}

${componentInfo.methods.map(method => `  function ${method.name}(${method.params.join(', ')}) {
${this.indentLines(method.body, 4)}
  }`).join('\n\n')}

${componentInfo.effects.map((effect, i) => `  // Reactive statement for effect ${i + 1}
  $: {
${this.indentLines(effect.body, 4)}
  }`).join('\n\n')}
</script>

${this.generateSvelteTemplate(componentInfo.jsx)}

<style>
${this.extractStyles(originalCode) || ''}
</style>`;

    return {
      code: script,
      warnings
    };
  }

  /**
   * Extract component information from AST
   */
  private extractComponentInfo(ast: t.File): any {
    const info = {
      imports: [] as string[],
      props: [] as any[],
      state: [] as any[],
      methods: [] as any[],
      effects: [] as any[],
      jsx: null as any
    };

    traverse(ast, {
      ImportDeclaration(path) {
        info.imports.push(generate(path.node).code);
      },
      
      VariableDeclarator(path) {
        // Detect useState hooks
        if (t.isCallExpression(path.node.init) && 
            t.isIdentifier(path.node.init.callee, { name: 'useState' })) {
          const id = path.node.id;
          if (t.isArrayPattern(id) && id.elements.length === 2) {
            info.state.push({
              name: (id.elements[0] as any).name,
              setter: (id.elements[1] as any).name,
              initialValue: generate(path.node.init.arguments[0] || t.nullLiteral()).code,
              type: 'any' // Would need type inference
            });
          }
        }
      },
      
      FunctionDeclaration(path) {
        if (path.node.id) {
          info.methods.push({
            name: path.node.id.name,
            params: path.node.params.map(p => generate(p).code),
            body: generate(path.node.body).code.slice(1, -1).trim()
          });
        }
      },
      
      ReturnStatement(path) {
        if (t.isJSXElement(path.node.argument) || t.isJSXFragment(path.node.argument)) {
          info.jsx = path.node.argument;
        }
      }
    });

    return info;
  }

  /**
   * Generate Vue template from JSX
   */
  private generateVueTemplate(jsx: any): string {
    if (!jsx) return '<div>No template</div>';
    
    const jsxCode = generate(jsx).code;
    
    // Convert JSX to Vue template syntax
    return jsxCode
      .replace(/className=/g, 'class=')
      .replace(/onClick=/g, '@click=')
      .replace(/onChange=/g, '@change=')
      .replace(/onSubmit=/g, '@submit=')
      .replace(/\{(\w+)\}/g, '{{ $1 }}')
      .replace(/\{(.+?)\}/g, (match, expr) => {
        // Handle conditional rendering
        if (expr.includes('&&')) {
          const [condition, content] = expr.split('&&').map(s => s.trim());
          return `<template v-if="${condition}">${content}</template>`;
        }
        // Handle ternary
        if (expr.includes('?')) {
          return `{{ ${expr} }}`;
        }
        return `{{ ${expr} }}`;
      });
  }

  /**
   * Generate Angular template from JSX
   */
  private generateAngularTemplate(jsx: any): string {
    if (!jsx) return '<div>No template</div>';
    
    const jsxCode = generate(jsx).code;
    
    // Convert JSX to Angular template syntax
    return jsxCode
      .replace(/className=/g, 'class=')
      .replace(/onClick=\{(\w+)\}/g, '(click)="$1()"')
      .replace(/onChange=\{(\w+)\}/g, '(change)="$1($event)"')
      .replace(/\{(\w+)\}/g, '{{ $1 }}')
      .replace(/\{(.+?)\}/g, (match, expr) => {
        // Handle conditional rendering
        if (expr.includes('&&')) {
          const [condition] = expr.split('&&').map(s => s.trim());
          return `*ngIf="${condition}"`;
        }
        return `{{ ${expr} }}`;
      });
  }

  /**
   * Generate Svelte template from JSX
   */
  private generateSvelteTemplate(jsx: any): string {
    if (!jsx) return '<div>No template</div>';
    
    const jsxCode = generate(jsx).code;
    
    // Convert JSX to Svelte template syntax
    return jsxCode
      .replace(/className=/g, 'class=')
      .replace(/onClick=\{(\w+)\}/g, 'on:click={$1}')
      .replace(/onChange=\{(\w+)\}/g, 'on:change={$1}')
      .replace(/\{(.+?)\}/g, (match, expr) => {
        // Handle conditional rendering
        if (expr.includes('&&')) {
          const [condition, content] = expr.split('&&').map(s => s.trim());
          return `{#if ${condition}}${content}{/if}`;
        }
        return `{${expr}}`;
      });
  }

  /**
   * Generate Vue script section
   */
  private generateVueScript(info: any, typescript: boolean): string {
    const imports = info.imports
      .filter((imp: string) => !imp.includes('react'))
      .join('\n');

    return `${imports}
import { ref, reactive, computed, onMounted${info.effects.length > 0 ? ', watch' : ''} } from 'vue';

export default {
  name: 'Component',
  props: {
${info.props.map((prop: any) => `    ${prop.name}: {
      type: ${this.convertTypeToVue(prop.type)},
      required: ${prop.required},
      default: ${prop.defaultValue || 'undefined'}
    }`).join(',\n')}
  },
  setup(props) {
${info.state.map((state: any) => `    const ${state.name} = ref(${state.initialValue});`).join('\n')}

${info.methods.map((method: any) => `    const ${method.name} = (${method.params.join(', ')}) => {
${this.indentLines(method.body, 6)}
    };`).join('\n\n')}

${info.effects.map((effect: any, i: number) => `    // Effect ${i + 1}
    onMounted(() => {
${this.indentLines(effect.body, 6)}
    });`).join('\n\n')}

    return {
${info.state.map((state: any) => `      ${state.name},`).join('\n')}
${info.methods.map((method: any) => `      ${method.name},`).join('\n')}
    };
  }
};`;
  }

  /**
   * Extract styles from original code
   */
  private extractStyles(code: string): string {
    // Simple extraction - in production, use proper CSS parser
    const styleMatch = code.match(/const styles = `([^`]+)`/);
    if (styleMatch) {
      return styleMatch[1];
    }
    
    // Extract Tailwind classes and generate basic CSS
    const classNames = code.match(/className="([^"]+)"/g) || [];
    const classes = new Set<string>();
    
    classNames.forEach((match: string) => {
      const classList = match.replace(/className="([^"]+)"/, '$1').split(' ');
      classList.forEach(cls => classes.add(cls));
    });
    
    // Generate basic CSS for common Tailwind classes
    return this.generateCSSFromTailwind(Array.from(classes));
  }

  /**
   * Generate CSS from Tailwind classes
   */
  private generateCSSFromTailwind(classes: string[]): string {
    const cssRules: string[] = [];
    
    classes.forEach(cls => {
      // Basic mappings - in production, use Tailwind CSS processor
      const mappings: Record<string, string> = {
        'flex': 'display: flex;',
        'flex-col': 'flex-direction: column;',
        'items-center': 'align-items: center;',
        'justify-center': 'justify-content: center;',
        'p-4': 'padding: 1rem;',
        'mt-4': 'margin-top: 1rem;',
        'text-center': 'text-align: center;',
        'font-bold': 'font-weight: bold;',
        'text-xl': 'font-size: 1.25rem;',
        'bg-blue-500': 'background-color: #3b82f6;',
        'text-white': 'color: white;',
        'rounded': 'border-radius: 0.25rem;',
        'shadow': 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);'
      };
      
      if (mappings[cls]) {
        cssRules.push(`.${cls} { ${mappings[cls]} }`);
      }
    });
    
    return cssRules.join('\n');
  }

  /**
   * Convert type to Vue type
   */
  private convertTypeToVue(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean',
      'array': 'Array',
      'object': 'Object',
      'function': 'Function'
    };
    
    return typeMap[type.toLowerCase()] || 'Object';
  }

  /**
   * Convert type to Angular type
   */
  private convertTypeToAngular(type: string): string {
    return type; // TypeScript types are the same
  }

  /**
   * Convert to kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Indent lines
   */
  private indentLines(str: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return str.split('\n').map(line => indent + line).join('\n');
  }
}

// Export singleton instance
export const frameworkConverter = new FrameworkConverter();