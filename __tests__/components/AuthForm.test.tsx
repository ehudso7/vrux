import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '../../components/AuthForm';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../lib/auth-context');
jest.mock('react-hot-toast');

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockPush = jest.fn();

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Sign In Mode', () => {
    it('renders sign in form correctly', () => {
      render(<AuthForm mode="signin" />);
      
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="signin" />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    });

    it('submits sign in form successfully', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ success: true });
      
      render(<AuthForm mode="signin" />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(toast.success).toHaveBeenCalledWith('Welcome back!');
      });
    });

    it('handles sign in error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<AuthForm mode="signin" />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });
  });

  describe('Sign Up Mode', () => {
    it('renders sign up form correctly', () => {
      render(<AuthForm mode="signup" />);
      
      expect(screen.getByText('Create an account')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('validates password match', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="signup" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');
      await user.click(submitButton);

      expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
    });

    it('submits sign up form successfully', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValueOnce({ success: true });
      
      render(<AuthForm mode="signup" />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(toast.success).toHaveBeenCalledWith('Account created successfully!');
      });
    });
  });

  describe('OAuth Integration', () => {
    it('renders OAuth buttons', () => {
      render(<AuthForm mode="signin" />);
      
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    });

    it('handles OAuth sign in', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="signin" />);
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      expect(toast).toHaveBeenCalledWith('OAuth integration coming soon!');
    });
  });
});