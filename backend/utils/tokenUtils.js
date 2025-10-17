import { createSupabaseClientFromEnv } from '../supabase.js';

/**
 * Token utilities for JWT verification and validation
 * Following industry standards for token management
 */
export class TokenUtils {
  /**
   * Verify JWT token with Supabase
   * @param {string} token - JWT access token
   * @returns {Promise<Object>} User object if valid
   * @throws {Error} If token is invalid or expired
   */
  static async verifyToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    try {
      const supabase = await createSupabaseClientFromEnv();
      if (!supabase) {
        throw new Error('Database connection failed');
      }

  const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      const appMeta = user.app_metadata || {};
      const usrMeta = user.user_metadata || {};
      const role = appMeta.role || usrMeta.role || 'user';
      let organizations = appMeta.organizations || usrMeta.organizations || [];
      if (!Array.isArray(organizations)) {
        organizations = organizations ? [String(organizations)] : [];
      }

      return {
        id: user.id,
        email: user.email,
        role,
        organizations,
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at
      };
    } catch (error) {
      if (error.message.includes('JWT')) {
        throw new Error('Invalid token format');
      }
      throw error;
    }
  }

  /**
   * Extract token from Authorization header or httpOnly cookie
   * @param {Object} req - Express request object
   * @returns {string|null} Token if present, null otherwise
   */
  static extractTokenFromRequest(req) {
    // Try Authorization header first (for API calls)
    const authHeader = req.headers['authorization'];
    
    if (authHeader) {
      // Support both "Bearer token" and "token" formats
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      } else if (parts.length === 1) {
        return parts[0];
      }
    }

    // Fallback to httpOnly cookie (for web app)
    if (req.cookies?.auth_access_token) {
      return req.cookies.auth_access_token;
    }
    
    return null;
  }

  /**
   * Check if token is close to expiring
   * @param {string} token - JWT token
   * @param {number} bufferMinutes - Minutes before expiry to consider "close to expiring"
   * @returns {boolean} True if token expires within buffer time
   */
  static isTokenExpiringSoon(token, bufferMinutes = 5) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const expiresIn = payload.exp - now;
      
      return expiresIn < (bufferMinutes * 60);
    } catch (error) {
      // If we can't parse the token, assume it's expiring
      return true;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null if invalid
   */
  static getTokenExpiration(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}