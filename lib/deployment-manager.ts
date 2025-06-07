import { z } from 'zod';
import { Octokit } from '@octokit/rest';
// import archiver from 'archiver';

// Deployment provider configurations
export const deploymentProviders = {
  vercel: {
    name: 'Vercel',
    icon: '▲',
    color: 'bg-black',
    features: ['Serverless', 'Edge Functions', 'Analytics'],
  },
  netlify: {
    name: 'Netlify',
    icon: '◆',
    color: 'bg-teal-600',
    features: ['Forms', 'Identity', 'Functions'],
  },
  railway: {
    name: 'Railway',
    icon: '🚂',
    color: 'bg-purple-600',
    features: ['Databases', 'Redis', 'Cron Jobs'],
  },
};

export const deploymentConfigSchema = z.object({
  provider: z.enum(['vercel', 'netlify', 'railway']),
  projectName: z.string(),
  framework: z.enum(['nextjs', 'react', 'vue', 'svelte']).default('react'),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
  customDomain: z.string().optional(),
});

export type DeploymentConfig = z.infer<typeof deploymentConfigSchema>;

export interface DeploymentResult {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
  logs?: string[];
}

// Generate package.json for the project
export interface PackageJson {
  name: string;
  version: string;
  private: boolean;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function generatePackageJson(config: {
  name: string;
  framework: string;
  dependencies?: Record<string, string>;
}): string {
  const basePackage: PackageJson = {
    name: config.name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: config.framework === 'nextjs' ? 'next dev' : 'vite',
      build: config.framework === 'nextjs' ? 'next build' : 'vite build',
      start: config.framework === 'nextjs' ? 'next start' : 'vite preview',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      ...config.dependencies,
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      typescript: '^5.0.0',
    },
  };

  if (config.framework === 'nextjs') {
    basePackage.dependencies.next = '^14.0.0';
  } else {
    basePackage.devDependencies.vite = '^5.0.0';
    basePackage.devDependencies['@vitejs/plugin-react'] = '^4.0.0';
  }

  return JSON.stringify(basePackage, null, 2);
}

// Create a zip file from project files
// This function needs to be called from a server-side context (API route)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createProjectZip(_files: { path: string; content: string }[]): Promise<Buffer> {
  // This function should only be called from server-side code
  // The actual implementation should be in an API route
  throw new Error('createProjectZip must be called from server-side code');
}

// Deploy to Vercel
export async function deployToVercel(
  config: DeploymentConfig,
  files: { path: string; content: string }[]
): Promise<DeploymentResult> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      throw new Error('Vercel token not configured');
    }

    // Create deployment payload
    const deploymentFiles = files.map(file => ({
      file: file.path,
      data: Buffer.from(file.content).toString('base64'),
    }));

    const vercelApiUrl = process.env.VERCEL_API_URL || 'https://api.vercel.com/v13/deployments';
    const response = await fetch(vercelApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.projectName,
        files: deploymentFiles,
        projectSettings: {
          framework: config.framework,
          buildCommand: config.buildCommand,
          outputDirectory: config.outputDirectory,
        },
        env: config.environmentVariables,
        target: 'production',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel deployment failed: ${error}`);
    }

    const deployment = await response.json();
    
    return {
      success: true,
      url: `https://${deployment.url}`,
      deploymentId: deployment.id,
      logs: [`Deployment created: ${deployment.id}`, `URL: https://${deployment.url}`],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    };
  }
}

// Deploy to Netlify
export async function deployToNetlify(
  config: DeploymentConfig,
  files: { path: string; content: string }[]
): Promise<DeploymentResult> {
  try {
    const netlifyToken = process.env.NETLIFY_TOKEN;
    if (!netlifyToken) {
      throw new Error('Netlify token not configured');
    }

    // Create a zip file
    const zipBuffer = await createProjectZip(files);

    // Create site if it doesn't exist
    const netlifyApiUrl = process.env.NETLIFY_API_URL || 'https://api.netlify.com/api/v1';
    const createSiteResponse = await fetch(`${netlifyApiUrl}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.projectName,
        custom_domain: config.customDomain,
      }),
    });

    if (!createSiteResponse.ok && createSiteResponse.status !== 422) {
      throw new Error('Failed to create Netlify site');
    }

    const site = await createSiteResponse.json();
    const siteId = site.id || config.projectName;

    // Deploy the zip
    const deployResponse = await fetch(
      `${netlifyApiUrl}/sites/${siteId}/deploys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/zip',
        },
        body: zipBuffer,
      }
    );

    if (!deployResponse.ok) {
      throw new Error('Failed to deploy to Netlify');
    }

    const deployment = await deployResponse.json();

    return {
      success: true,
      url: deployment.ssl_url || deployment.url,
      deploymentId: deployment.id,
      logs: [
        `Site created/updated: ${siteId}`,
        `Deployment ID: ${deployment.id}`,
        `URL: ${deployment.ssl_url || deployment.url}`,
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    };
  }
}

// Create GitHub repository
export async function createGitHubRepo(
  name: string,
  files: { path: string; content: string }[],
  isPrivate: boolean = false
): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const octokit = new Octokit({ auth: githubToken });

    // Create repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      auto_init: true,
      description: 'Created with VRUX',
    });

    // Create files in the repository
    for (const file of files) {
      await octokit.repos.createOrUpdateFileContents({
        owner: repo.owner.login,
        repo: repo.name,
        path: file.path,
        message: `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
      });
    }

    return {
      success: true,
      repoUrl: repo.html_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create repository',
    };
  }
}

// Main deployment function
export async function deployProject(
  config: DeploymentConfig,
  code: string,
  additionalFiles?: { path: string; content: string }[]
): Promise<DeploymentResult> {
  // Prepare files
  const files: { path: string; content: string }[] = [
    {
      path: 'package.json',
      content: generatePackageJson({
        name: config.projectName,
        framework: config.framework,
      }),
    },
  ];

  // Add main component file
  if (config.framework === 'nextjs') {
    files.push(
      {
        path: 'pages/index.tsx',
        content: code,
      },
      {
        path: 'pages/_app.tsx',
        content: `import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}`,
      },
      {
        path: 'styles/globals.css',
        content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      }
    );
  } else {
    files.push(
      {
        path: 'src/App.tsx',
        content: code,
      },
      {
        path: 'src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        path: 'src/index.css',
        content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
      }
    );
  }

  // Add additional files if provided
  if (additionalFiles) {
    files.push(...additionalFiles);
  }

  // Deploy based on provider
  switch (config.provider) {
    case 'vercel':
      return deployToVercel(config, files);
    case 'netlify':
      return deployToNetlify(config, files);
    case 'railway':
      // Railway deployment would be implemented here
      return {
        success: false,
        error: 'Railway deployment not yet implemented',
      };
    default:
      return {
        success: false,
        error: 'Unknown deployment provider',
      };
  }
}