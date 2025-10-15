import { AuthService } from '../../services/authService.js';

/**
 * Authentication Controller
 * Handles core authentication and user management operations
 */
export class AuthController {
  // ===== CORE AUTHENTICATION =====

  /**
   * User registration endpoint
   */
  static async register(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({ 
        message: 'Auth disabled - mock registration successful',
        user: { 
          id: 'dev-user', 
          email: req.body.email, 
          role: req.body.role || 'admin' 
        },
        session: { access_token: 'dev-token' }
      });
    }

    try {
      const { email, password, role } = req.body;
      const result = await AuthService.registerUser(email, password, role);

      if (result.requiresVerification) {
        return res.status(201).json({ 
          message: 'Registration successful. Please check your email for verification.',
          requiresVerification: true,
          user: result.user
        });
      }

      return res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        session: result.session
      });

    } catch (error) {
      console.error('Registration error:', error.message);
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }
      
      return res.status(400).json({ 
        error: 'Registration failed. Please try again.',
        code: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * User login endpoint
   */
  static async login(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - mock login successful',
        user: { 
          id: 'dev-user', 
          email: req.body.email, 
          role: 'admin' 
        },
        session: { access_token: 'dev-token' }
      });
    }

    try {
      const { email, password } = req.body;
      const result = await AuthService.loginUser(email, password);

      return res.json({
        message: 'Login successful',
        user: result.user,
        session: result.session
      });

    } catch (error) {
      console.error('Login error:', error.message);
      
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({ 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      } else if (error.message.includes('Email not confirmed')) {
        return res.status(403).json({ 
          error: 'Please verify your email before signing in',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }
      
      return res.status(400).json({ 
        error: 'Login failed. Please check your credentials.',
        code: 'LOGIN_FAILED'
      });
    }
  }

  /**
   * User logout endpoint
   */
  static async logout(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - mock logout successful'
      });
    }

    try {
      const result = await AuthService.logoutUser(req.session);
      
      return res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error.message);
      return res.status(400).json({ 
        error: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  }

  // ===== PASSWORD MANAGEMENT =====

  /**
   * Reset password request
   */
  static async resetPassword(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - password reset successful'
      });
    }

    try {
      const { email } = req.body;
      await AuthService.requestPasswordReset(email);
      
      return res.json({
        message: 'Password reset email sent'
      });

    } catch (error) {
      console.error('Password reset error:', error.message);
      return res.status(400).json({ 
        error: 'Password reset failed',
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  }

  /**
   * Update password
   */
  static async updatePassword(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - password update successful'
      });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      await AuthService.updatePassword(userId, currentPassword, newPassword);
      
      return res.json({
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Password update error:', error.message);
      
      if (error.message.includes('current password is incorrect')) {
        return res.status(401).json({ 
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }
      
      return res.status(400).json({ 
        error: 'Password update failed',
        code: 'PASSWORD_UPDATE_FAILED'
      });
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        message: 'Auth disabled - verification resend successful'
      });
    }

    try {
      const { email } = req.body;
      await AuthService.resendVerificationEmail(email);
      
      return res.json({
        message: 'Verification email sent'
      });

    } catch (error) {
      console.error('Resend verification error:', error.message);
      
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ 
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED'
        });
      }
      
      return res.status(400).json({ 
        error: 'Failed to resend verification email',
        code: 'RESEND_FAILED'
      });
    }
  }

  // ===== USER MANAGEMENT =====

  /**
   * Get user profile
   */
  static async getProfile(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        user: {
          id: 'dev-user',
          email: 'dev@example.com',
          role: 'admin'
        }
      });
    }

    try {
      const userId = req.user.id;
      const user = await AuthService.getUserById(userId);
      
      return res.json({
        user: user
      });

    } catch (error) {
      console.error('Profile fetch error:', error.message);
      return res.status(400).json({ 
        error: 'Failed to fetch profile',
        code: 'PROFILE_FETCH_FAILED'
      });
    }
  }

  /**
   * Check if email exists
   */
  static async checkEmail(req, res) {
    if (process.env.DISABLE_AUTH === 'true') {
      return res.json({
        exists: false,
        message: 'Auth disabled - email check bypassed'
      });
    }

    try {
      const { email } = req.body;
      const exists = await AuthService.checkEmailExists(email);
      
      return res.json({ exists });

    } catch (error) {
      console.error('Email check error:', error.message);
      return res.status(400).json({ 
        error: 'Email check failed',
        code: 'EMAIL_CHECK_FAILED'
      });
    }
  }
}