import { createSupabaseClientFromEnv } from '../supabase.js';

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

export const authenticateToken = async (req, res, next) => {
  // Skip auth in development mode
  if (DISABLE_AUTH) {
    console.log('Auth disabled - allowing request');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user' // Store role in user_metadata
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (DISABLE_AUTH) {
      return next(); // Skip role check in dev mode
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};