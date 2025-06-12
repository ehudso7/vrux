import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast');

// Mock fetch
global.fetch = jest.fn();

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (fetch as jest.Mock).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initial State', () => {
    it('initializes with no user and loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('loads user from localStorage on mount', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      localStorage.setItem('auth_token', 'mock-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Sign In', () => {
    it('signs in successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          token: 'new-token', 
          user: mockUser 
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('handles sign in error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword');
      })).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Sign Up', () => {
    it('signs up successfully', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'New User' };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          token: 'new-token', 
          user: mockUser 
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123', 'New User');
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'new@example.com', 
          password: 'password123',
          name: 'New User'
        }),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });
  });

  describe('Sign Out', () => {
    it('signs out successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      localStorage.setItem('auth_token', 'mock-token');
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toEqual(mockUser);

      await act(async () => {
        await result.current.signOut();
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });
  });

  describe('Update Profile', () => {
    it('updates profile successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const updatedUser = { ...mockUser, name: 'Updated User' };
      localStorage.setItem('auth_token', 'mock-token');
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: updatedUser }),
        });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated User' });
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ name: 'Updated User' }),
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });
});