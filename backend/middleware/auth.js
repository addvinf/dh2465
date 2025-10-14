import { TokenUtils } from '../utils/tokenUtils.js';

// SECURITY: Auth bypass enabled (for development/testing)
const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

/**
 * Enhanced JWT authentication middleware
 * Follows industry standards for token verification and error handling
 */
export const authenticateToken = async (req, res, next) => {
  // Skip auth in development mode
  if (DISABLE_AUTH) {
    console.log('Auth disabled - allowing request');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  try {
    // Extract token from request
    const token = TokenUtils.extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token with Supabase
    const user = await TokenUtils.verifyToken(token);

    // Add verified user info to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Return appropriate error status based on error type
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.message.includes('Invalid token format')) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    } else if (error.message.includes('Database connection failed')) {
      return res.status(500).json({ 
        error: 'Internal server error',
        code: 'DATABASE_ERROR'
      });
    } else {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  }
};

/**
 * Role-based authorization middleware
 * Supports multiple roles and hierarchical permissions
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (DISABLE_AUTH) {
      return next(); // Skip role check in dev mode
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      console.log(`Access denied: User ${req.user.email} with role '${req.user.role}' attempted to access resource requiring roles: ${roles.join(', ')}`);
      
      return res.status(403).json({ 
        error: 'Insufficient permissions for this resource',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerification = (req, res, next) => {
  if (DISABLE_AUTH) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.emailConfirmed) {
    return res.status(403).json({ 
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Optional authentication - sets req.user if token is present but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  if (DISABLE_AUTH) {
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  try {
    const token = TokenUtils.extractTokenFromRequest(req);
    
    if (token) {
      const user = await TokenUtils.verifyToken(token);
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return an error - just continue without user
    console.log('Optional auth failed:', error.message);
    next();
  }
};