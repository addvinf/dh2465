/**
 * Validation middleware for authentication endpoints
 * Matching frontend validation logic exactly
 */

/**
 * Email validation regex (matches frontend exactly)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation regex (matches frontend exactly)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Valid user roles
 */
const VALID_ROLES = ['admin', 'user', 'member'];

/**
 * Request size limits (in bytes)
 */
const MAX_REQUEST_SIZE = 10000; // 10KB

/**
 * XSS protection patterns
 */
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<img[^>]+src[^>]*>/gi,
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi
];

/**
 * Check for XSS patterns in string
 * @param {string} input - String to check for XSS
 * @returns {boolean} True if XSS detected
 */
const containsXSS = (input) => {
  if (typeof input !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove XSS vectors
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 255); // Prevent buffer overflow
};

/**
 * Validate request size middleware
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']) || 0;
  
  if (contentLength > MAX_REQUEST_SIZE) {
    return res.status(413).json({
      error: 'Request too large',
      code: 'REQUEST_TOO_LARGE',
      maxSize: MAX_REQUEST_SIZE
    });
  }
  
  next();
};

/**
 * XSS protection middleware
 */
const validateXSS = (req, res, next) => {
  // Check all string values in request body
  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        if (containsXSS(value)) {
          return {
            detected: true,
            field: currentPath,
            value: value.substring(0, 100) // Truncate for logging
          };
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result.detected) return result;
      }
    }
    return { detected: false };
  };

  if (req.body && typeof req.body === 'object') {
    const xssCheck = checkObject(req.body);
    
    if (xssCheck.detected) {
      console.warn('XSS_ATTEMPT:', {
        ip: req.ip,
        field: xssCheck.field,
        value: xssCheck.value,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        error: 'Invalid input detected',
        code: 'XSS_DETECTED',
        field: xssCheck.field
      });
    }
  }
  
  next();
};

/**
 * Validate email format (matches frontend exactly)
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  if (!email || !email.trim()) {
    return false;
  }
  return EMAIL_REGEX.test(email);
};

/**
 * Validate password strength (matches frontend exactly)
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
const isValidPassword = (password) => {
  if (!password) {
    return false;
  }
  if (password.length < 8) {
    return false;
  }
  if (!PASSWORD_REGEX.test(password)) {
    return false;
  }
  return true;
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate registration data (matches frontend exactly)
 */
const validateRegistration = (req, res, next) => {
  const { email, password, role } = req.body;

  // Check email
  if (!email || !email.trim()) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address'
    });
  }

  // Check password
  if (!password) {
    return res.status(400).json({
      error: 'Password is required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long'
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    });
  }

  // Check role
  if (!role) {
    return res.status(400).json({
      error: 'Role is required'
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: 'Please select a valid role'
    });
  }

  next();
};

/**
 * Validate login data (matches frontend exactly)
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check email
  if (!email || !email.trim()) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address'
    });
  }

  // Check password
  if (!password) {
    return res.status(400).json({
      error: 'Password is required'
    });
  }

  next();
};

/**
 * Validate forgot password data (matches frontend exactly)
 */
const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  // Check email
  if (!email || !email.trim()) {
    return res.status(400).json({
      error: 'Email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address'
    });
  }

  next();
};

/**
 * Validate password update data (matches frontend exactly)
 */
const validateUpdatePassword = (req, res, next) => {
  const { password } = req.body;

  // Check password
  if (!password) {
    return res.status(400).json({
      error: 'Password is required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long'
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    });
  }

  next();
};

/**
 * Validate refresh token request
 */
export const validateRefreshToken = (req, res, next) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ 
      error: 'Refresh token is required',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  if (typeof refresh_token !== 'string' || refresh_token.length < 10) {
    return res.status(400).json({ 
      error: 'Invalid refresh token format',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }

  next();
};

/**
 * Rate limiting validation middleware
 * Simple in-memory rate limiter (use Redis in production)
 */
const rateLimitStore = new Map();

export const createRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, requests] of rateLimitStore.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, filteredRequests);
      }
    }
    
    // Check current requests
    const userRequests = rateLimitStore.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
    
    next();
  };
};

// Export all validation functions
export {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateUpdatePassword,
  validateRequestSize,
  validateXSS,
  sanitizeInput,
  containsXSS
};