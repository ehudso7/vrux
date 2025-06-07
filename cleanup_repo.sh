// 1. First, update pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authStore } from '../../../lib/auth-store';
import logger from '../../../lib/logger';
import { requireDomain } from '../../../lib/domain-restriction';
import { withAuthRateLimit, logFailedAuth, getUserIdentifier } from '../../../lib/auth-rate-limiter';

async function signinHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email and password are required',
        code: 'INVALID_REQUEST'
      });
    }

    // Find user
    const user = authStore.findUserByEmail(email);
    const identifier = getUserIdentifier(req);
    
    if (!user) {
      logFailedAuth('signin', identifier, 'user_not_found', { email });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    if (!authStore.verifyPassword(user.id, password)) {
      logFailedAuth('signin', identifier, 'invalid_password', { email });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Create session
    const sessionId = authStore.createSession(user.id);

    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    logger.info('User signed in', { userId: user.id, email: user.email });

    // Return user data (without password)
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      plan: user.plan,
      apiCalls: user.apiCalls,
      maxApiCalls: user.maxApiCalls,
    });
  } catch (error) {
    logger.error('Sign in error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred during sign in',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Fixed handler with proper error handling
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // In development, skip domain restriction
    if (process.env.NODE_ENV === 'development') {
      return await withAuthRateLimit(signinHandler, 'signin')(req, res);
    }
    // In production, apply domain restriction
    return await requireDomain(withAuthRateLimit(signinHandler, 'signin'))(req, res);
  } catch (error) {
    // Always return JSON for API errors
    logger.error('Signin endpoint error', error as Error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process signin request',
      code: 'SIGNIN_ERROR'
    });
  }
};

export default handler;

// 2. Create pages/api/auth/test.ts to verify API is working
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Auth API is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

// 3. Update lib/auth-store.ts to handle development mode properly
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  plan: 'free' | 'pro' | 'enterprise';
  apiCalls: number;
  maxApiCalls: number;
}

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

class AuthStore {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private emailIndex: Map<string, string> = new Map();

  constructor() {
    // Add a test user for development
    if (process.env.NODE_ENV === 'development') {
      const testUser: User = {
        id: 'test-user-1',
        email: 'test@vrux.dev',
        password: bcrypt.hashSync('password123', 10),
        name: 'Test User',
        createdAt: new Date(),
        plan: 'free',
        apiCalls: 0,
        maxApiCalls: 100
      };
      this.users.set(testUser.id, testUser);
      this.emailIndex.set(testUser.email.toLowerCase(), testUser.id);
      logger.info('Test user created for development', { email: testUser.email });
    }
  }

  createUser(data: { email: string; password: string; name: string }): User {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    
    const user: User = {
      id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      createdAt: new Date(),
      plan: 'free',
      apiCalls: 0,
      maxApiCalls: 100
    };

    this.users.set(id, user);
    this.emailIndex.set(data.email.toLowerCase(), id);
    
    logger.info('User created', { userId: id, email: data.email });
    return user;
  }

  findUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  verifyPassword(userId: string, password: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    return bcrypt.compareSync(password, user.password);
  }

  createSession(userId: string): string {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.sessions.set(sessionId, session);
    logger.info('Session created', { sessionId, userId });
    return sessionId;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.info('Session deleted', { sessionId });
  }

  updateUserApiCalls(userId: string, increment: number = 1): void {
    const user = this.users.get(userId);
    if (user) {
      user.apiCalls += increment;
      logger.info('API calls updated', { userId, apiCalls: user.apiCalls });
    }
  }
}

// Export singleton instance
export const authStore = new AuthStore();

// 4. Run these commands to fix the issue:
// npm install bcryptjs @types/bcryptjs
// npm run dev

// 5. Test the auth API:
// curl http://localhost:3000/api/auth/test
// Should return: {"message":"Auth API is working correctly","timestamp":"...","environment":"development"}

// 6. Test signup:
// curl -X POST http://localhost:3000/api/auth/signup \
//   -H "Content-Type: application/json" \
//   -d '{"email":"newuser@example.com","password":"Test123!","name":"New User"}'
