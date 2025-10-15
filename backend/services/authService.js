import { createSupabaseClientFromEnv } from '../supabase.js';
import { TokenUtils } from '../utils/tokenUtils.js';

/**
 * Authentication service handling all auth-related business logic
 * Following industry standards for service layer architecture
 */
export class AuthService {
  /**
   * Create and validate Supabase client connection
   * @returns {Promise<Object>} Supabase client
   * @throws {Error} If connection fails
   */
  static async createSupabaseClient() {
    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      throw new Error('Database connection failed');
    }
    return supabase;
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password  
   * @param {string} role - User role (default: 'user')
   * @returns {Promise<Object>} Registration result
   */
  static async registerUser(email, password, role = 'user') {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: { 
            role,
            createdAt: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || role,
          emailConfirmed: data.user.email_confirmed_at !== null
        } : null,
        session: data.session,
        requiresVerification: !data.session
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result with user and session
   */
  static async loginUser(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in');
        }
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed - invalid response');
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user',
          emailConfirmed: data.user.email_confirmed_at !== null,
          lastSignIn: data.user.last_sign_in_at
        },
        session: data.session
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Refresh user session using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<Object>} New session data
   */
  static async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }

      if (!data.session) {
        throw new Error('Failed to refresh session');
      }

      return {
        session: data.session,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user'
        } : null
      };
    } catch (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }
  }

  /**
   * Sign out user
   * @returns {Promise<void>}
   */
  static async signOut() {
    try {
      const supabase = await this.createSupabaseClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Log error but don't throw - logout should always succeed from client perspective
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw - logout should always appear successful to client
    }
  }

  /**
   * Initiate password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async resetPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(), 
        {
          redirectTo: `${process.env.CLIENT_URL || 'http://localhost:5173'}/update-password`
        }
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Update user password using reset token
   * @param {string} password - New password
   * @param {string} accessToken - Reset access token
   * @param {string} refreshToken - Reset refresh token
   * @returns {Promise<void>}
   */
  static async updatePassword(password, accessToken, refreshToken) {
    if (!password || !accessToken) {
      throw new Error('Password and access token are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      // First verify the reset token is valid
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });

      if (sessionError || !sessionData.user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  /**
   * Resend email verification
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async resendVerification(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim()
      });

      if (error) {
        // Handle rate limiting gracefully
        if (error.message.includes('rate limit')) {
          throw new Error('Please wait before requesting another verification email');
        }
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error(`Verification email failed: ${error.message}`);
    }
  }

  /**
   * Check if email exists in the system
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  static async checkEmailExists(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      // Use admin API to check if user exists
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        throw new Error(`Email check failed: ${error.message}`);
      }

      const emailExists = data.users.some(user => 
        user.email?.toLowerCase() === email.toLowerCase().trim()
      );

      return emailExists;
    } catch (error) {
      throw new Error(`Email check failed: ${error.message}`);
    }
  }

  /**
   * Get user by ID (admin operation)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  static async getUserById(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const supabase = await this.createSupabaseClient();
      
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('User not found');
      }

      return {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        emailConfirmed: data.user.email_confirmed_at !== null,
        createdAt: data.user.created_at,
        lastSignIn: data.user.last_sign_in_at
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  
}