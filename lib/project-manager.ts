import { z } from 'zod';

export interface ProjectFile {
  path: string;
  content: string;
  type: 'component' | 'page' | 'api' | 'util' | 'style' | 'config' | 'test';
  language: 'typescript' | 'javascript' | 'css' | 'json' | 'markdown';
  dependencies?: string[];
  exports?: string[];
  imports?: string[];
}

export interface ProjectStructure {
  name: string;
  description: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts?: Record<string, string>;
  environment?: Record<string, string>;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string;
  language?: string;
}

// Project templates for common architectures
export const projectTemplates = {
  'next-app': {
    name: 'Next.js App',
    description: 'Next.js application with TypeScript and Tailwind',
    structure: [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/components/',
      'src/lib/',
      'src/types/',
      'public/',
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.ts',
      '.env.local'
    ]
  },
  'react-spa': {
    name: 'React SPA',
    description: 'Single Page Application with React Router',
    structure: [
      'src/index.tsx',
      'src/App.tsx',
      'src/pages/',
      'src/components/',
      'src/hooks/',
      'src/utils/',
      'src/styles/',
      'package.json',
      'tsconfig.json',
      'vite.config.ts'
    ]
  },
  'component-library': {
    name: 'Component Library',
    description: 'Reusable React component library',
    structure: [
      'src/components/',
      'src/index.ts',
      'src/styles/',
      'stories/',
      'tests/',
      'package.json',
      'tsconfig.json',
      'rollup.config.js'
    ]
  }
};

// Schema for project generation
export const ProjectGenerationSchema = z.object({
  prompt: z.string(),
  template: z.enum(['next-app', 'react-spa', 'component-library', 'custom']),
  features: z.array(z.string()).optional(),
  styling: z.enum(['tailwind', 'styled-components', 'css-modules', 'sass']).optional(),
  testing: z.boolean().optional(),
  authentication: z.boolean().optional(),
  database: z.boolean().optional()
});

export type ProjectGenerationConfig = z.infer<typeof ProjectGenerationSchema>;

// Convert flat file list to tree structure
export function buildFileTree(files: ProjectFile[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '/',
    type: 'directory',
    children: []
  };

  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: file.path,
          type: 'file',
          content: file.content,
          language: file.language
        });
      } else {
        // It's a directory
        current.children = current.children || [];
        let dir = current.children.find(child => child.name === part && child.type === 'directory');
        
        if (!dir) {
          dir = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: 'directory',
            children: []
          };
          current.children.push(dir);
        }
        
        current = dir;
      }
    });
  });

  return root;
}

// Extract imports and exports from code
export function analyzeFileDependencies(content: string, language: string): {
  imports: string[];
  exports: string[];
} {
  const imports: string[] = [];
  const exports: string[] = [];

  if (language === 'typescript' || language === 'javascript') {
    // Extract imports
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]+}|\w+))?\s*from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Named exports
    const namedExportRegex = /export\s+{([^}]+)}/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }
  }

  return { imports, exports };
}

// Generate package.json from project structure
export function generatePackageJson(project: ProjectStructure): string {
  const packageJson = {
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: project.description,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      ...project.scripts
    },
    dependencies: project.dependencies,
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      typescript: '^5.0.0',
      ...project.devDependencies
    }
  };

  return JSON.stringify(packageJson, null, 2);
}

// Validate project structure
export function validateProjectStructure(project: ProjectStructure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required files
  const hasEntryPoint = project.files.some(f => 
    f.path === 'src/index.tsx' || 
    f.path === 'src/app/page.tsx' || 
    f.path === 'pages/index.tsx'
  );

  if (!hasEntryPoint) {
    errors.push('Project must have an entry point (index.tsx or page.tsx)');
  }

  // Check for circular dependencies
  const fileMap = new Map(project.files.map(f => [f.path, f]));
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function checkCircular(path: string): boolean {
    if (visiting.has(path)) return true;
    if (visited.has(path)) return false;

    visiting.add(path);
    const file = fileMap.get(path);
    
    if (file?.imports) {
      for (const imp of file.imports) {
        if (imp.startsWith('.') && checkCircular(imp)) {
          errors.push(`Circular dependency detected: ${path} -> ${imp}`);
          return true;
        }
      }
    }

    visiting.delete(path);
    visited.add(path);
    return false;
  }

  project.files.forEach(file => checkCircular(file.path));

  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate project structure from prompt
export async function generateProjectStructure(
  config: ProjectGenerationConfig,
  generateComponent: (prompt: string) => Promise<string>
): Promise<ProjectStructure> {
  // const template = config.template !== 'custom' 
  //   ? projectTemplates[config.template] 
  //   : null;

  const files: ProjectFile[] = [];
  const dependencies: Record<string, string> = {
    'react': '^18.0.0',
    'react-dom': '^18.0.0'
  };

  // Add framework-specific dependencies
  if (config.template === 'next-app') {
    dependencies['next'] = '^14.0.0';
  } else if (config.template === 'react-spa') {
    dependencies['react-router-dom'] = '^6.0.0';
  }

  // Add styling dependencies
  if (config.styling === 'tailwind') {
    dependencies['tailwindcss'] = '^3.0.0';
    dependencies['@tailwindcss/forms'] = '^0.5.0';
  } else if (config.styling === 'styled-components') {
    dependencies['styled-components'] = '^6.0.0';
  }

  // Generate main component based on prompt
  const mainComponent = await generateComponent(config.prompt);
  
  // Create file structure based on template
  if (config.template === 'next-app') {
    files.push({
      path: 'src/app/page.tsx',
      content: mainComponent,
      type: 'page',
      language: 'typescript'
    });

    files.push({
      path: 'src/app/layout.tsx',
      content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${config.prompt.slice(0, 50)}',
  description: 'Generated with VRUX',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      type: 'page',
      language: 'typescript'
    });

    files.push({
      path: 'src/app/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      type: 'style',
      language: 'css'
    });
  }

  // Add configuration files
  files.push({
    path: 'package.json',
    content: generatePackageJson({
      name: 'vrux-project',
      description: config.prompt,
      files: [],
      dependencies,
      devDependencies: {}
    }),
    type: 'config',
    language: 'json'
  });

  files.push({
    path: 'tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        paths: {
          '@/*': ['./src/*']
        }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    }, null, 2),
    type: 'config',
    language: 'json'
  });

  // Analyze dependencies for all files
  files.forEach(file => {
    const { imports, exports } = analyzeFileDependencies(file.content, file.language);
    file.imports = imports;
    file.exports = exports;
  });

  return {
    name: 'VRUX Project',
    description: config.prompt,
    files,
    dependencies,
    devDependencies: {}
  };
}