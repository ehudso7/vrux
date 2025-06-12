import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowRight, 
  Building2, 
  Users, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

interface SSOLoginProps {
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  redirectUrl?: string;
  showEmailFallback?: boolean;
  className?: string;
}

export const SSOLogin: React.FC<SSOLoginProps> = ({
  onSuccess,
  onError,
  redirectUrl = '/dashboard',
  showEmailFallback = true,
  className = ''
}) => {
  const router = useRouter();
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [suggestedProvider, setSuggestedProvider] = useState<string | null>(null);

  // Load SSO providers
  useEffect(() => {
    loadProviders();

    // Check for SSO callback
    const { code, state, provider } = router.query;
    if (code && state) {
      handleCallback(code as string, state as string, provider as string);
    }
  }, [router.query]);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/auth/sso/providers');
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = async (providerId: string) => {
    setAuthenticating(providerId);
    
    try {
      // Get redirect URL
      const currentUrl = new URL(window.location.href);
      const callbackUrl = new URL('/api/auth/sso/callback', currentUrl.origin);
      callbackUrl.searchParams.set('provider', providerId);
      
      // Initialize SSO flow
      const response = await fetch('/api/auth/sso/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          redirect_uri: callbackUrl.toString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize SSO');
      }

      const { authUrl } = await response.json();
      
      // Redirect to SSO provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('SSO login failed:', error);
      toast.error('Failed to connect to SSO provider');
      setAuthenticating(null);
      onError?.(error as Error);
    }
  };

  const handleCallback = async (code: string, state: string, provider?: string) => {
    setAuthenticating(provider || 'sso');
    
    try {
      const response = await fetch(`/api/auth/sso/callback?code=${code}&state=${state}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('SSO authentication failed');
      }

      const { user } = await response.json();
      
      toast.success('Successfully logged in!');
      onSuccess?.(user);
      
      // Redirect to dashboard or specified URL
      router.push(redirectUrl);
    } catch (error) {
      console.error('SSO callback failed:', error);
      toast.error('Authentication failed. Please try again.');
      setAuthenticating(null);
      onError?.(error as Error);
      
      // Clear query params
      router.replace(router.pathname);
    }
  };

  const detectDomainProvider = (email: string) => {
    const domain = email.split('@')[1];
    if (!domain) return;

    setEmailDomain(domain);
    
    // Common domain mappings
    const domainProviders: Record<string, string> = {
      'gmail.com': 'google',
      'googlemail.com': 'google',
      'outlook.com': 'microsoft',
      'hotmail.com': 'microsoft',
      'live.com': 'microsoft',
      'github.com': 'github',
    };

    const suggested = domainProviders[domain.toLowerCase()];
    if (suggested && providers.some(p => p.id === suggested)) {
      setSuggestedProvider(suggested);
    } else {
      setSuggestedProvider(null);
    }
  };

  const renderProviderButton = (provider: SSOProvider) => {
    const isAuthenticating = authenticating === provider.id;
    const isSuggested = suggestedProvider === provider.id;
    
    return (
      <motion.button
        key={provider.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSSOLogin(provider.id)}
        disabled={authenticating !== null}
        className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
          isSuggested
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } ${authenticating !== null && !isAuthenticating ? 'opacity-50' : ''}`}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: provider.color || '#666' }}
        >
          {provider.icon || provider.name.charAt(0)}
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium flex items-center gap-2">
            {provider.name}
            {isSuggested && (
              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full">
                Recommended
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Sign in with your {provider.name} account
          </div>
        </div>
        {isAuthenticating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowRight className="w-5 h-5 text-gray-400" />
        )}
      </motion.button>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Enterprise Sign In</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Use your corporate account to access VRUX
        </p>
      </div>

      {/* Email input for domain detection */}
      {showEmailFallback && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Work Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              detectDomainProvider(e.target.value);
            }}
            placeholder="you@company.com"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
          />
          {emailDomain && !suggestedProvider && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Select your organization's SSO provider below
            </p>
          )}
        </div>
      )}

      {/* SSO Providers */}
      {providers.length > 0 ? (
        <div className="space-y-3">
          {providers.map(provider => renderProviderButton(provider))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">No SSO Providers Available</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please contact your administrator to set up enterprise authentication.
          </p>
        </Card>
      )}

      {/* Benefits */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Enterprise Benefits
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium">Single Sign-On</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Use your existing corporate credentials
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium">Enhanced Security</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Enterprise-grade authentication and compliance
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium">Team Collaboration</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Automatic team setup based on your organization
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative login */}
      {showEmailFallback && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/signin')}
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            Sign in with email instead →
          </button>
        </div>
      )}
    </div>
  );
};