import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import logger from './logger';

export interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'oidc';
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  icon?: string;
  color?: string;
}

export interface SSOUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
  providerId: string;
  metadata?: Record<string, any>;
}

export interface SSOSession {
  state: string;
  codeVerifier?: string;
  provider: string;
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

// SSO Provider configurations
export const SSO_PROVIDERS: Record<string, Partial<SSOProvider>> = {
  google: {
    id: 'google',
    name: 'Google',
    type: 'oauth2',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    icon: '🔵',
    color: '#4285F4'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    type: 'oauth2',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
    icon: '⚫',
    color: '#24292e'
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft',
    type: 'oauth2',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'openid email profile',
    icon: '🟦',
    color: '#0078D4'
  },
  okta: {
    id: 'okta',
    name: 'Okta',
    type: 'oidc',
    authorizationUrl: '{domain}/oauth2/v1/authorize',
    tokenUrl: '{domain}/oauth2/v1/token',
    userInfoUrl: '{domain}/oauth2/v1/userinfo',
    scope: 'openid email profile',
    icon: '🔷',
    color: '#007DC1'
  },
  auth0: {
    id: 'auth0',
    name: 'Auth0',
    type: 'oidc',
    authorizationUrl: '{domain}/authorize',
    tokenUrl: '{domain}/oauth/token',
    userInfoUrl: '{domain}/userinfo',
    scope: 'openid email profile',
    icon: '🟠',
    color: '#EB5424'
  }
};

export class SSOManager {
  private sessions: Map<string, SSOSession> = new Map();
  private providers: Map<string, SSOProvider> = new Map();

  constructor() {
    // Initialize providers from environment
    this.initializeProviders();
  }

  /**
   * Initialize SSO providers from environment variables
   */
  private initializeProviders() {
    // Google
    if (process.env.GOOGLE_CLIENT_ID) {
      this.registerProvider({
        ...SSO_PROVIDERS.google,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      } as SSOProvider);
    }

    // GitHub
    if (process.env.GITHUB_CLIENT_ID) {
      this.registerProvider({
        ...SSO_PROVIDERS.github,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      } as SSOProvider);
    }

    // Microsoft
    if (process.env.MICROSOFT_CLIENT_ID) {
      this.registerProvider({
        ...SSO_PROVIDERS.microsoft,
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      } as SSOProvider);
    }

    // Custom SAML provider
    if (process.env.SAML_SSO_URL) {
      this.registerProvider({
        id: 'saml',
        name: 'Corporate SSO',
        type: 'saml',
        clientId: process.env.SAML_CLIENT_ID!,
        authorizationUrl: process.env.SAML_SSO_URL,
        tokenUrl: process.env.SAML_SSO_URL,
        userInfoUrl: process.env.SAML_SSO_URL,
        scope: '',
        icon: '🔐',
        color: '#666666'
      });
    }
  }

  /**
   * Register an SSO provider
   */
  registerProvider(provider: SSOProvider): void {
    this.providers.set(provider.id, provider);
    logger.info('SSO provider registered', { provider: provider.id });
  }

  /**
   * Get available SSO providers
   */
  getProviders(): SSOProvider[] {
    return Array.from(this.providers.values()).map(p => ({
      ...p,
      clientSecret: undefined // Don't expose secrets
    }));
  }

  /**
   * Get a specific provider
   */
  getProvider(providerId: string): SSOProvider | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Initialize SSO authentication flow
   */
  async initializeAuth(
    providerId: string,
    redirectUri: string,
    customParams?: Record<string, string>
  ): Promise<{ authUrl: string; state: string }> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown SSO provider: ${providerId}`);
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Generate PKCE code verifier for OAuth2
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;
    
    if (provider.type === 'oauth2') {
      codeVerifier = crypto.randomBytes(32).toString('base64url');
      codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    }

    // Store session
    const session: SSOSession = {
      state,
      codeVerifier,
      provider: providerId,
      redirectUri,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    this.sessions.set(state, session);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: provider.type === 'saml' ? 'SAMLResponse' : 'code',
      scope: provider.scope,
      state,
      ...customParams
    });

    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    const authUrl = `${provider.authorizationUrl}?${params.toString()}`;

    return { authUrl, state };
  }

  /**
   * Handle SSO callback
   */
  async handleCallback(
    code: string,
    state: string,
    providerId?: string
  ): Promise<SSOUser> {
    // Validate state
    const session = this.sessions.get(state);
    if (!session) {
      throw new Error('Invalid state parameter');
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      this.sessions.delete(state);
      throw new Error('SSO session expired');
    }

    const provider = this.getProvider(session.provider);
    if (!provider) {
      throw new Error('Provider not found');
    }

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(
        provider,
        code,
        session.redirectUri,
        session.codeVerifier
      );

      // Get user info
      const userInfo = await this.getUserInfo(provider, tokens.access_token);

      // Map to SSO user
      const ssoUser = this.mapUserInfo(provider.id, userInfo);

      // Clean up session
      this.sessions.delete(state);

      logger.info('SSO authentication successful', {
        provider: provider.id,
        userId: ssoUser.id
      });

      return ssoUser;
    } catch (error) {
      logger.error('SSO callback failed', error as Error, {
        provider: provider.id,
        state
      });
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    provider: SSOProvider,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<any> {
    const params: any = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: provider.clientId,
    };

    if (provider.clientSecret) {
      params.client_secret = provider.clientSecret;
    }

    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams(params).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user info from provider
   */
  private async getUserInfo(provider: SSOProvider, accessToken: string): Promise<any> {
    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Map provider-specific user info to standard format
   */
  private mapUserInfo(providerId: string, userInfo: any): SSOUser {
    switch (providerId) {
      case 'google':
        return {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
          providerId: userInfo.id,
          metadata: {
            locale: userInfo.locale,
            verified_email: userInfo.verified_email
          }
        };

      case 'github':
        return {
          id: userInfo.id.toString(),
          email: userInfo.email,
          name: userInfo.name || userInfo.login,
          picture: userInfo.avatar_url,
          provider: 'github',
          providerId: userInfo.id.toString(),
          metadata: {
            login: userInfo.login,
            company: userInfo.company,
            location: userInfo.location
          }
        };

      case 'microsoft':
        return {
          id: userInfo.id,
          email: userInfo.mail || userInfo.userPrincipalName,
          name: userInfo.displayName,
          picture: undefined, // Would need Graph API photo endpoint
          provider: 'microsoft',
          providerId: userInfo.id,
          metadata: {
            jobTitle: userInfo.jobTitle,
            officeLocation: userInfo.officeLocation
          }
        };

      default:
        // Generic mapping
        return {
          id: userInfo.sub || userInfo.id || userInfo.email,
          email: userInfo.email || userInfo.mail || userInfo.preferred_username,
          name: userInfo.name || userInfo.displayName || userInfo.given_name,
          picture: userInfo.picture || userInfo.avatar_url,
          provider: providerId,
          providerId: userInfo.sub || userInfo.id,
          metadata: userInfo
        };
    }
  }

  /**
   * Handle SAML response
   */
  async handleSAMLResponse(samlResponse: string): Promise<SSOUser> {
    // In production, use a proper SAML library like saml2-js or passport-saml
    // This is a simplified example
    try {
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
      
      // Parse SAML response (simplified)
      const emailMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
      const email = emailMatch ? emailMatch[1] : null;

      if (!email) {
        throw new Error('Unable to extract email from SAML response');
      }

      return {
        id: email,
        email,
        provider: 'saml',
        providerId: email,
        metadata: {
          samlResponse: decoded
        }
      };
    } catch (error) {
      logger.error('SAML response parsing failed', error as Error);
      throw new Error('Invalid SAML response');
    }
  }

  /**
   * Validate SSO configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.providers.size === 0) {
      errors.push('No SSO providers configured');
    }

    this.providers.forEach((provider, id) => {
      if (!provider.clientId) {
        errors.push(`${id}: Missing client ID`);
      }
      if (provider.type === 'oauth2' && !provider.clientSecret && id !== 'github') {
        errors.push(`${id}: Missing client secret`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = new Date();
    for (const [state, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(state);
      }
    }
  }
}

// Export singleton instance
export const ssoManager = new SSOManager();

// API handler helper
export async function handleSSOAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  action: 'providers' | 'init' | 'callback'
) {
  switch (action) {
    case 'providers':
      // Return available SSO providers
      const providers = ssoManager.getProviders();
      return res.json({ providers });

    case 'init':
      // Initialize SSO flow
      const { provider, redirect_uri } = req.body;
      if (!provider || !redirect_uri) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      try {
        const { authUrl, state } = await ssoManager.initializeAuth(
          provider,
          redirect_uri
        );
        return res.json({ authUrl, state });
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }

    case 'callback':
      // Handle SSO callback
      const { code, state: callbackState } = req.query;
      if (!code || !callbackState) {
        return res.status(400).json({ error: 'Missing callback parameters' });
      }

      try {
        const user = await ssoManager.handleCallback(
          code as string,
          callbackState as string
        );
        return res.json({ user });
      } catch (error: any) {
        return res.status(401).json({ error: error.message });
      }

    default:
      return res.status(404).json({ error: 'Unknown SSO action' });
  }
}