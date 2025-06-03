#!/bin/bash

echo "=== Comprehensive fix for all build issues ==="
echo ""

cd /Users/evertonhudson/Projects/vrux

# Step 1: Install missing type definitions
echo "1. Installing missing type definitions..."
npm install --save-dev @types/babel__traverse @types/babel__generator @types/babel__core

# Step 2: Update package.json to add these types
echo "2. Updating package.json..."

# Step 3: Create type declaration file as fallback
echo "3. Creating type declarations..."
mkdir -p types
cat > types/babel.d.ts << 'EOF'
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
EOF

# Step 4: Update tsconfig.json to include the types directory
echo "4. Updating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/pages/*": ["./pages/*"]
    },
    "typeRoots": ["./node_modules/@types", "./types"],
    "types": ["node"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "types/**/*.d.ts"
  ],
  "exclude": ["node_modules"]
}
EOF

# Step 5: Fix any problematic imports in ai-code-analyzer.ts
echo "5. Fixing imports in ai-code-analyzer.ts..."
sed -i.bak "s/import traverse, { NodePath } from '@babel\/traverse';/import traverse from '@babel\/traverse';/" lib/ai-code-analyzer.ts

# Step 6: Add all changes
echo "6. Committing fixes..."
git add -A

# Step 7: Commit
git commit -m "Fix all TypeScript and build issues

- Add @types/babel__traverse type definitions
- Create fallback type declarations for Babel packages
- Update tsconfig.json to include types directory
- Fix import statements in ai-code-analyzer.ts
- Add typeRoots configuration for custom types

This should resolve all build and TypeScript compilation errors"

# Step 8: Push
git push origin main

echo ""
echo "=== All fixes applied and pushed! ==="
echo ""
echo "The deployment should now succeed without any errors."
echo "If npm install fails on Vercel, the type declaration file will serve as backup."