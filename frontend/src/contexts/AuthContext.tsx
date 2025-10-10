import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser, type AuthSession } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  registerOnly: (email: string, password: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Read DISABLE_AUTH from environment (must be prefixed with VITE_ in frontend)
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === 'true';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if token is expired
  const isTokenExpired = (sessionData: AuthSession): boolean => {
    if (!sessionData.expires_at) return false;
    return Date.now() / 1000 >= sessionData.expires_at;
  };

  useEffect(() => {
    // If auth is disabled, set up mock user and session
    if (DISABLE_AUTH) {
      console.log('Frontend auth disabled - setting up mock user');
      setUser({ 
        id: 'dev-user', 
        email: 'dev@example.com', 
        role: 'admin' 
      });
      setSession({
        access_token: 'dev-token',
        refresh_token: 'dev-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      });
      setIsLoading(false);
      return;
    }

    // Check for stored session on app start
    const storedSession = localStorage.getItem('authSession');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        // Check if token is expired
        if (isTokenExpired(parsedSession)) {
          console.log('Token expired, clearing auth');
          clearAuth();
          setIsLoading(false);
          return;
        }
        setSession(parsedSession);
        fetchUserProfile(parsedSession.access_token);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        clearAuth();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Session monitoring and token refresh
  useEffect(() => {
    if (!session?.expires_at) return;

    const checkSessionExpiry = () => {
      // If token is expired, logout immediately
      if (isTokenExpired(session)) {
        console.log('Session expired - logging out user');
        logout();
        return;
      }

      // If token expires within 5 minutes, try to refresh
      const now = Date.now() / 1000;
      const expiresAt = session.expires_at;
      
      if (expiresAt) {
        const timeUntilExpiry = expiresAt - now;
        const refreshThreshold = 5 * 60; // 5 minutes

        if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0 && session.refresh_token) {
          console.log(`Token expires in ${Math.round(timeUntilExpiry / 60)} minutes, refreshing...`);
          refreshToken();
        }
      }
    };

    // Check immediately
    checkSessionExpiry();

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000);

    // Check when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSessionExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  const refreshToken = async () => {
    if (!session?.refresh_token) {
      console.warn('No refresh token available');
      return;
    }

    try {
      console.log('Attempting to refresh token...');
      const response = await fetch('http://localhost:3000/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Token refreshed successfully');
        setSession(data.session);
        localStorage.setItem('authSession', JSON.stringify(data.session));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Token refresh failed:', errorData.error || response.statusText);
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const data = await authService.fetchProfile(token);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('authSession');
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setSession(data.session);
      setUser(data.user);
      localStorage.setItem('authSession', JSON.stringify(data.session));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: string = 'admin') => {
    setIsLoading(true);
    try {
      const data = await authService.register({ email, password, role });
      
      if (data.requiresVerification) {
        throw new Error('Please check your email for verification link');
      }

      setSession(data.session);
      setUser(data.user);
      localStorage.setItem('authSession', JSON.stringify(data.session));
    } finally {
      setIsLoading(false);
    }
  };

  const registerOnly = async (email: string, password: string, role: string = 'admin') => {
    setIsLoading(true);
    try {
      const data = await authService.register({ email, password, role });
      
      if (data.requiresVerification) {
        throw new Error('Please check your email for verification link');
      }

      // Don't set session or user data - just create the account
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (session) {
        await authService.logout(session.access_token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const value = {
    user,
    session,
    login,
    register,
    registerOnly,
    logout,
    isLoading,
    isAuthenticated: !!user && !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};