import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser, type AuthSession } from '../services/authService';
import { SecureTokenStorage } from '../utils/secureTokenStorage';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<{ requiresVerification: boolean; message?: string }>;
  registerOnly: (email: string, password: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Note: Auth bypass only controlled by backend for security
// Frontend always enforces authentication - backend determines if it's actually required

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
    const initializeAuth = async () => {
      // Frontend always enforces authentication
      // Backend DISABLE_AUTH will return mock responses if needed

      // Check for existing secure session
      const sessionInfo = SecureTokenStorage.getSessionInfo();
      if (sessionInfo?.isAuthenticated) {
        try {
          // Try to get access token and then fetch user profile
          const accessToken = await SecureTokenStorage.getAccessToken();
          if (accessToken) {
            const profileData = await authService.fetchProfile(accessToken);
            setUser(profileData.user);
            
            // Create session object from stored info
            const sessionData: AuthSession = {
              access_token: '', // Token is in httpOnly cookie
              refresh_token: '', // Token is in httpOnly cookie
              expires_at: sessionInfo.expires_at
            };
            setSession(sessionData);
          } else {
            // No token available, clear session
            await SecureTokenStorage.clearSession();
          }
        } catch (error) {
          console.error('Error loading stored session:', error);
          // Clear invalid session
          await SecureTokenStorage.clearSession();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Session monitoring and token refresh
  useEffect(() => {
    if (!session?.expires_at) return;

    const checkSessionExpiry = () => {
      // If token is expired, logout immediately
      if (isTokenExpired(session)) {
        console.log('Session expired - logging out user');
        logout().catch(error => console.error('Logout error during expiry check:', error));
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
          refreshToken().catch(error => {
            console.error('Failed to refresh token:', error);
          });
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
        logout().catch(error => console.error('Logout error during refresh:', error));
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout().catch(error => console.error('Logout error during refresh:', error));
    }
  };

  const clearAuth = async () => {
    setUser(null);
    setSession(null);
    
    // Clear secure token storage
    await SecureTokenStorage.clearSession();
    
    // Also clear old localStorage for backwards compatibility
    localStorage.removeItem('authSession');
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setSession(data.session);
      setUser(data.user);
      
      // Store session securely
      SecureTokenStorage.storeSession({
        ...data.session,
        user: data.user
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: string = 'user') => {
    setIsLoading(true);
    try {
      const data = await authService.register({ email, password, role });
      
      if (data.requiresVerification) {
        // Return a special result instead of throwing an error
        return { requiresVerification: true, message: 'Please check your email for verification link' };
      }

      setSession(data.session);
      setUser(data.user);
      localStorage.setItem('authSession', JSON.stringify(data.session));
      return { requiresVerification: false };
    } finally {
      setIsLoading(false);
    }
  };

  const registerOnly = async (email: string, password: string, role: string = 'user') => {
    setIsLoading(true);
    try {
      const data = await authService.register({ email, password, role });
      
      if (data.requiresVerification) {
        // Return a special result instead of throwing an error
        return { requiresVerification: true, message: 'Please check your email for verification link' };
      }

      // Don't set session or user data - just create the account
      return { requiresVerification: false, data };
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
      await clearAuth();
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