import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { z } from 'zod';
import { 
  ProjectGenerationSchema,
  generateProjectStructure
} from '@/lib/project-manager';
// import withErrorHandler from '@/lib/error-handler';
// import { sanitizeCode } from '@/lib/ai-validation';
// import limiter from '@/lib/rate-limiter';
import logger from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function generateComponent(prompt: string): Promise<string> {
  const systemPrompt = `You are an expert React developer. Generate a complete, working React component based on the user's description.
  
  Requirements:
  - Use TypeScript
  - Use functional components with hooks
  - Use Tailwind CSS for styling
  - Include proper type definitions
  - Make the component self-contained and reusable
  - Add appropriate props interface
  - Include helpful comments
  - Follow React best practices`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const code = response.choices[0]?.message?.content || '';
  return code; // sanitizeCode(code);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  // const limited = await limiter.check(req, res);
  // if (limited) {
  //   return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  // }

  try {
    const config = ProjectGenerationSchema.parse(req.body);
    
    logger.info('Generating project structure', { 
      template: config.template,
      features: config.features?.length || 0 
    });

    // Generate project structure
    const project = await generateProjectStructure(config, generateComponent);

    // Add additional files based on features
    if (config.features?.includes('api')) {
      project.files.push({
        path: 'src/api/index.ts',
        content: `import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`API server running on port \${PORT}\`);
});`,
        type: 'api',
        language: 'typescript'
      });

      project.dependencies['express'] = '^4.18.0';
      project.dependencies['cors'] = '^2.8.5';
      project.devDependencies['@types/express'] = '^4.17.0';
      project.devDependencies['@types/cors'] = '^2.8.0';
    }

    if (config.authentication) {
      project.files.push({
        path: 'src/lib/auth.ts',
        content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}`,
        type: 'util',
        language: 'typescript'
      });

      project.dependencies['@supabase/supabase-js'] = '^2.38.0';
    }

    if (config.testing) {
      project.files.push({
        path: 'src/tests/setup.ts',
        content: `import '@testing-library/jest-dom';`,
        type: 'test',
        language: 'typescript'
      });

      project.files.push({
        path: 'jest.config.js',
        content: `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};`,
        type: 'config',
        language: 'javascript'
      });

      project.devDependencies['jest'] = '^29.0.0';
      project.devDependencies['@testing-library/react'] = '^14.0.0';
      project.devDependencies['@testing-library/jest-dom'] = '^6.0.0';
      project.devDependencies['ts-jest'] = '^29.0.0';
      project.devDependencies['@types/jest'] = '^29.0.0';
    }

    logger.info('Project structure generated successfully', {
      files: project.files.length,
      dependencies: Object.keys(project.dependencies).length
    });

    res.status(200).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid project generation request', { errors: error.errors });
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }

    logger.error('Project generation failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to generate project structure' });
  }
}

export default handler;