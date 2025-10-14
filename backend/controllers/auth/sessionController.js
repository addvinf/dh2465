import { AuthService } from '../../services/authService.js';
import { TokenUtils } from '../../utils/tokenUtils.js';

/**
 * Session Controller
 * Handles token management and session operations
 */
export class SessionController {
  // ===== TOKEN MANAGEMENT =====

  /**
   * Refresh authentication token
   */
  static async refresh(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - token refresh successful',
        session: { 
          access_token: 'dev-token-refreshed',
          refresh_token: 'dev-refresh-token',
          expires_at: Date.now() / 1000 + 3600
        }
      });
    }

    try {
      const { refresh_token } = req.body;
      const result = await AuthService.refreshToken(refresh_token);
      
      return res.json({
        message: 'Token refreshed successfully',
        session: result.session
      });

    } catch (error) {
      console.error('Token refresh error:', error.message);
      
      if (error.message.includes('refresh token is invalid') || 
          error.message.includes('refresh token has expired')) {
        return res.status(401).json({ 
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      return res.status(400).json({ 
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  }

  // ===== SECURE COOKIE MANAGEMENT =====

  /**
   * Set secure tokens (for cookie-based auth)
   */
  static async setSecureTokens(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      // Set mock cookies for development
      res.cookie('access_token', 'dev-access-token', {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
      });

      res.cookie('refresh_token', 'dev-refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax', 
        maxAge: 7 * 24 * 3600000 // 7 days
      });

      return res.json({
        message: 'Auth disabled - tokens set successfully'
      });
    }

    try {
      const { access_token, refresh_token, expires_at } = req.body;

      // Calculate maxAge safely
      let accessTokenMaxAge = 3600000; // Default 1 hour
      if (expires_at && typeof expires_at === 'number') {
        const timeUntilExpiry = (expires_at - Date.now() / 1000) * 1000;
        if (timeUntilExpiry > 0) {
          accessTokenMaxAge = timeUntilExpiry;
        }
      }

      // Set secure httpOnly cookies
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: accessTokenMaxAge
      });

      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600000 // 7 days
      });

      return res.json({
        message: 'Tokens set successfully'
      });

    } catch (error) {
      console.error('Set tokens error:', error.message);
      return res.status(400).json({ 
        error: 'Failed to set tokens',
        code: 'SET_TOKENS_FAILED'
      });
    }
  }

  /**
   * Get access token from cookie
   */
  static async getAccessToken(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        access_token: 'dev-access-token',
        expires_at: Date.now() / 1000 + 3600
      });
    }

    try {
      const access_token = req.cookies?.access_token;

      if (!access_token) {
        return res.status(401).json({ 
          error: 'No access token found',
          code: 'NO_ACCESS_TOKEN'
        });
      }

      // Verify token is still valid
      const user = await TokenUtils.verifyToken(access_token);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Access token expired or invalid',
          code: 'INVALID_ACCESS_TOKEN'
        });
      }

      return res.json({
        access_token: access_token
      });

    } catch (error) {
      console.error('Get access token error:', error.message);
      return res.status(400).json({ 
        error: 'Failed to get access token',
        code: 'GET_TOKEN_FAILED'
      });
    }
  }

  /**
   * Clear all tokens (logout)
   */
  static async clearTokens(req, res) {
    try {
      // Clear httpOnly cookies
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict'
      });

      return res.json({
        message: 'Tokens cleared successfully'
      });

    } catch (error) {
      console.error('Clear tokens error:', error.message);
      return res.status(400).json({ 
        error: 'Failed to clear tokens',
        code: 'CLEAR_TOKENS_FAILED'
      });
    }
  }
}