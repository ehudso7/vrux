declare module '@babel/traverse' {
  import { Node } from '@babel/types';
  
  export interface NodePath<T = Node> {
    node: T;
    parent: Node;
    type: string;
    isIdentifier(): boolean;
    isCallExpression(): boolean;
    isMemberExpression(): boolean;
    isImportDeclaration(): boolean;
    isVariableDeclarator(): boolean;
    isFunctionDeclaration(): boolean;
    isArrowFunctionExpression(): boolean;
    isExportDefaultDeclaration(): boolean;
    traverse(visitor: any): void;
  }
  
  export default function traverse(ast: Node, visitor: any): void;
}

declare module '@babel/generator' {
  import { Node } from '@babel/types';
  
  interface GeneratorOptions {
    compact?: boolean;
    concise?: boolean;
    minified?: boolean;
    quotes?: 'single' | 'double';
    retainLines?: boolean;
    retainFunctionParens?: boolean;
    comments?: boolean;
  }
  
  interface GeneratorResult {
    code: string;
    map?: any;
  }
  
  export default function generate(ast: Node, options?: GeneratorOptions): GeneratorResult;
}
