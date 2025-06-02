import { createHash, randomBytes } from 'crypto';

// In-memory user store for demo purposes
// In production, this would be a real database
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  plan: 'free' | 'pro' | 'enterprise';
  apiCalls: number;
  maxApiCalls: number;
}

interface Session {
  userId: string;
  expiresAt: Date;
}

class AuthStore {
  private users: Map<string, StoredUser> = new Map();
  private sessions: Map<string, Session> = new Map();

  constructor() {
    // Create a demo user
    this.createUser({
      email: 'demo@vrux.app',
      password: 'demo123',
      name: 'Demo User',
    });
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  createUser(data: { email: string; password: string; name: string }): StoredUser {
    const userId = randomBytes(16).toString('hex');
    const user: StoredUser = {
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash: this.hashPassword(data.password),
      name: data.name,
      createdAt: new Date(),
      plan: 'free',
      apiCalls: 0,
      maxApiCalls: 100,
    };

    this.users.set(user.email, user);
    return user;
  }

  findUserByEmail(email: string): StoredUser | null {
    return this.users.get(email.toLowerCase()) || null;
  }

  findUserById(id: string): StoredUser | null {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  verifyPassword(user: StoredUser, password: string): boolean {
    return user.passwordHash === this.hashPassword(password);
  }

  createSession(userId: string): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour sessions

    this.sessions.set(sessionId, {
      userId,
      expiresAt,
    });

    // Clean up expired sessions
    this.cleanupSessions();

    return sessionId;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  updateUser(userId: string, data: Partial<StoredUser>): StoredUser | null {
    const user = this.findUserById(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...data, id: user.id };
    this.users.set(updatedUser.email, updatedUser);
    return updatedUser;
  }

  incrementApiCalls(userId: string): void {
    const user = this.findUserById(userId);
    if (user) {
      user.apiCalls++;
      this.users.set(user.email, user);
    }
  }

  private cleanupSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const authStore = new AuthStore();