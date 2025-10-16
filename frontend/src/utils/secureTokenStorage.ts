/**
 * Secure Token Storage Utility
 * Manages authentication tokens securely using httpOnly cookies
 */

export class SecureTokenStorage {
  private static readonly SESSION_INFO_KEY = 'auth_session_info';

  /**
   * Store authentication session securely
   * Access tokens go to httpOnly cookies, non-sensitive data to localStorage
   */
  static storeSession(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user?: any;
  }): void {
    // Store sensitive tokens in httpOnly cookies via backend
    this.setSecureTokens(session.access_token, session.refresh_token);

    // Store non-sensitive session info in localStorage
    const sessionInfo = {
      expires_at: session.expires_at,
      user: session.user,
      isAuthenticated: true,
      timestamp: Date.now()
    };

    localStorage.setItem(this.SESSION_INFO_KEY, JSON.stringify(sessionInfo));
  }

  /**
   * Get session information (non-sensitive data from localStorage)
   */
  static getSessionInfo(): {
    expires_at?: number;
    user?: any;
    isAuthenticated: boolean;
    timestamp?: number;
  } | null {
    try {
      const stored = localStorage.getItem(this.SESSION_INFO_KEY);
      if (!stored) return null;

      const sessionInfo = JSON.parse(stored);
      
      // Validate session hasn't expired
      if (sessionInfo.expires_at && Date.now() / 1000 >= sessionInfo.expires_at) {
        this.clearSession();
        return null;
      }

      return sessionInfo;
    } catch (error) {
      console.error('Error reading session info:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Get access token from httpOnly cookie (via backend endpoint)
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Set secure tokens via backend (httpOnly cookies)
   */
  private static async setSecureTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/auth/set-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      });
    } catch (error) {
      console.error('Error setting secure tokens:', error);
      // Fallback to localStorage for development (not secure)
      if (import.meta.env.DEV) {
        console.warn('⚠️ Fallback: Using localStorage for tokens in development');
        localStorage.setItem('fallback_access_token', accessToken);
        localStorage.setItem('fallback_refresh_token', refreshToken);
      }
    }
  }

  /**
   * Clear all authentication data
   */
  static async clearSession(): Promise<void> {
    // Clear httpOnly cookies via backend
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/auth/clear-tokens`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }

    // Clear localStorage data
    localStorage.removeItem(this.SESSION_INFO_KEY);
    
    // Clear fallback tokens if they exist
    localStorage.removeItem('fallback_access_token');
    localStorage.removeItem('fallback_refresh_token');
  }

  /**
   * Check if user has valid session (client-side check only)
   */
  static hasValidSession(): boolean {
    const sessionInfo = this.getSessionInfo();
    return sessionInfo?.isAuthenticated === true;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies with refresh token
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update session info with new expiration
        const currentInfo = this.getSessionInfo();
        if (currentInfo) {
          const updatedInfo = {
            ...currentInfo,
            expires_at: data.expires_at,
            timestamp: Date.now()
          };
          localStorage.setItem(this.SESSION_INFO_KEY, JSON.stringify(updatedInfo));
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Development fallback: get access token from localStorage
   */
  static getFallbackAccessToken(): string | null {
    if (import.meta.env.DEV) {
      return localStorage.getItem('fallback_access_token');
    }
    return null;
  }
}