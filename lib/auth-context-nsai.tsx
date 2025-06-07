import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo users for offline mode
const DEMO_USERS = [
  {
    id: '1',
    email: 'demo@nsaidata.com',
    password: 'demo1234',
    name: 'Demo User',
    plan: 'pro' as const,
    createdAt: new Date().toISOString()
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('nsai_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('nsai_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Try API first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('nsai_user', JSON.stringify(data.user));
        localStorage.setItem('nsai_token', data.token);
        toast.success('Welcome back!');
        router.push('/dashboard');
        return;
      }
    } catch {
      // Fallback to demo mode
    }

    // Demo mode login
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (demoUser) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = demoUser;
      setUser(userWithoutPassword);
      localStorage.setItem('nsai_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('nsai_token', 'demo_token_' + Date.now());
      toast.success('Welcome to NSAI Data (Demo Mode)');
      router.push('/dashboard');
    } else {
      toast.error('Invalid email or password');
      throw new Error('Invalid credentials');
    }
    
    setLoading(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    try {
      // Try API first
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('nsai_user', JSON.stringify(data.user));
        localStorage.setItem('nsai_token', data.token);
        toast.success('Welcome to NSAI Data!');
        router.push('/dashboard');
        return;
      }
    } catch {
      // Fallback to demo mode
    }

    // Demo mode registration
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      plan: 'free',
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage (demo mode)
    const users = JSON.parse(localStorage.getItem('nsai_demo_users') || '[]');
    users.push({ ...newUser, password });
    localStorage.setItem('nsai_demo_users', JSON.stringify(users));
    
    setUser(newUser);
    localStorage.setItem('nsai_user', JSON.stringify(newUser));
    localStorage.setItem('nsai_token', 'demo_token_' + Date.now());
    toast.success('Account created successfully!');
    router.push('/dashboard');
    
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nsai_user');
    localStorage.removeItem('nsai_token');
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// HOC for protected pages
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}