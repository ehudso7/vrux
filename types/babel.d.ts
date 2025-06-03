declare module '@babel/traverse' {
  import { Node } from '@babel/types';
  
  export interface NodePath<T = Node> {
    node: T;
    parent: Node;
    type: string;
    scope: any;
    loc: any;
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
  
  export interface TraverseOptions {
    scope?: any;
    state?: any;
    parentPath?: NodePath;
  }
  
  export default function traverse(ast: Node, visitor: any, scope?: any, state?: any, parentPath?: NodePath): void;
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
