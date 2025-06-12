import { createMocks } from 'node-mocks-http';
import signInHandler from '../../pages/api/auth/signin';
import signUpHandler from '../../pages/api/auth/signup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../__mocks__/prisma';
import { SubscriptionTier, AuthProvider } from '@prisma/client';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock rate limiter
jest.mock('../../lib/auth-rate-limiter', () => ({
  withAuthRateLimit: (handler: any) => handler,
  logFailedAuth: jest.fn(),
  getUserIdentifier: jest.fn(() => 'test-identifier'),
}));

describe('Auth API Routes with Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('/api/auth/signin', () => {
    it('signs in user successfully with database', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        subscription: SubscriptionTier.PRO,
        subscriptionExpiry: new Date('2025-12-31'),
        apiCallsCount: 50,
        apiCallsReset: new Date('2025-07-01'),
        createdAt: new Date(),
        provider: AuthProvider.LOCAL,
        providerId: null,
        stripeCustomerId: 'cus_123',
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      await signInHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      
      expect(response).toMatchObject({
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'PRO',
        },
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('returns 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
      });

      await signInHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid credentials',
      });
    });

    it('handles database errors gracefully', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      await signInHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Database operation failed',
      });
    });
  });

  describe('/api/auth/signup', () => {
    it('creates new user with all god-tier features', async () => {
      const newUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        avatarUrl: null,
        subscription: SubscriptionTier.FREE,
        subscriptionExpiry: null,
        apiCallsCount: 0,
        apiCallsReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        provider: AuthProvider.LOCAL,
        providerId: null,
        stripeCustomerId: null,
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(newUser);
      prismaMock.analytics.create.mockResolvedValue({
        id: 'analytics-123',
        userId: newUser.id,
        event: 'SUBSCRIPTION_UPGRADED',
        metadata: {},
        ip: null,
        userAgent: null,
        referrer: null,
        createdAt: new Date(),
      });
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValue('new-user-token');

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'securepassword123',
          name: 'New User',
        },
      });

      await signUpHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const response = JSON.parse(res._getData());
      
      expect(response).toMatchObject({
        token: 'new-user-token',
        user: {
          id: 'new-user-123',
          email: 'newuser@example.com',
          name: 'New User',
          subscription: 'FREE',
          apiCallsCount: 0,
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('securepassword123', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          password: 'hashed-password',
          name: 'New User',
          subscription: SubscriptionTier.FREE,
        }),
      });

      // Verify analytics tracking
      expect(prismaMock.analytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'new-user-123',
          event: 'SUBSCRIPTION_UPGRADED',
        }),
      });
    });

    it('enforces strong password requirements', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        },
      });

      await signUpHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Password must be at least 8 characters long',
      });
    });

    it('prevents duplicate email registration', async () => {
      const existingUser = {
        id: 'existing-123',
        email: 'existing@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(existingUser as any);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Duplicate User',
        },
      });

      await signUpHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'User already exists',
      });
    });
  });
});