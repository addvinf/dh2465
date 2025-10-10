import { Router } from 'express';
import { createSupabaseClientFromEnv } from '../supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

// Register endpoint using Supabase Auth
router.post('/register', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({ 
      message: 'Auth disabled - mock registration',
      user: { id: 'dev-user', email: req.body.email, role: 'admin' },
      session: { access_token: 'dev-token' }
    });
  }

  try {
    const { email, password, role = 'admin' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          role: role // Store role in user metadata
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(200).json({ 
        message: 'Registration successful. Please check your email for verification.',
        requiresVerification: true 
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user'
      },
      session: data.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint using Supabase Auth
router.post('/login', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({
      message: 'Auth disabled - mock login',
      user: { id: 'dev-user', email: req.body.email, role: 'admin' },
      session: { access_token: 'dev-token' }
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user'
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({ session: { access_token: 'dev-token' } });
  }

  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const supabase = await createSupabaseClientFromEnv();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ session: data.session });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({ message: 'Logged out successfully' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const supabase = await createSupabaseClientFromEnv();
      await supabase.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logged out successfully' }); // Always succeed
  }
});

// Password reset request endpoint
router.post('/reset-password', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({ message: 'Auth disabled - mock password reset' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: 'http://localhost:5173/update-password'
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update password endpoint
router.post('/update-password', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.json({ message: 'Auth disabled - mock password update' });
  }

  try {
    const { password, access_token } = req.body;

    if (!password || !access_token) {
      return res.status(400).json({ error: 'Password and access token are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Set the session with the provided access token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: req.body.refresh_token || ''
    });

    if (sessionError || !sessionData.user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;