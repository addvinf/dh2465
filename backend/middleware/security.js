/**
 * Security Middleware
 * Centralized security headers and protection middleware
 * 
 * SECURITY NOTE: This app uses sameSite: 'none' cookies for cross-origin auth.
 * This is necessary for separate frontend/backend domains but requires extra protection:
 * - CORS is strictly configured to allowed origins only
 * - Origin validation in auth middleware
 * - httpOnly cookies prevent XSS access
 * - secure flag requires HTTPS
 * - JWT tokens provide additional verification
 */

/**
 * Security headers middleware - prevents XSS, clickjacking, MIME attacks
 */
export const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy - Prevent XSS and injection attacks
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // HTTPS enforcement (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Hide Express version
  res.removeHeader('X-Powered-By');
  
  // Prevent MIME type confusion
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  next();
};

/**
 * HTTPS enforcement middleware - Force HTTPS in production
 */
export const httpsEnforcement = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && 
      !req.secure && 
      req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

/**
 * Secure CORS configuration
 */
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://dh2465.vercel.app',
        'https://dh2465.vercel.app', // Your Vercel frontend
        // Add other production domains here
      ]
    : [
        'http://localhost:3001', 
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://127.0.0.1:5173'
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

/**
 * Global error handler - prevents information leakage
 */
export const errorHandler = (err, req, res, next) => {
  // Log full error for debugging (only in logs, not response)
  console.error('🚨 Server Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    error: isDevelopment ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  
  // Don't include stack traces in production
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ 
    error: "Not Found",
    code: "ENDPOINT_NOT_FOUND"
  });
};