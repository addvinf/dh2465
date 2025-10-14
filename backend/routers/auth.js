import { Router } from 'express';
import { authenticateToken, requireRole, requireEmailVerification } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateUpdatePassword,
  validateRefreshToken,
  validateRequestSize,
  validateXSS,
  createRateLimit
} from '../middleware/validation.js';
import { AuthController } from '../controllers/auth/authController.js';
import { SessionController } from '../controllers/auth/sessionController.js';

const router = Router();

// Rate limiting for large system with many users
const authRateLimit = createRateLimit(15 * 60 * 1000, 500); // 500 attempts per 15 minutes
const generalRateLimit = createRateLimit(60 * 1000, 1000); // 1000 requests per minute

// Security middleware chain
const securityMiddleware = [validateRequestSize, validateXSS];

// Public authentication routes with appropriate rate limiting for large systems
router.post('/register', 
  ...securityMiddleware,
  authRateLimit, 
  validateRegistration, 
  AuthController.register
);

router.post('/login', 
  ...securityMiddleware,
  authRateLimit, 
  validateLogin, 
  AuthController.login
);

router.post('/refresh', 
  ...securityMiddleware,
  generalRateLimit,
  validateRefreshToken, 
  SessionController.refresh
);

router.post('/logout', 
  ...securityMiddleware,
  AuthController.logout
);

// Password management routes
router.post('/reset-password', 
  ...securityMiddleware,
  authRateLimit,
  validateForgotPassword, 
  AuthController.resetPassword
);

router.post('/update-password', 
  ...securityMiddleware,
  authRateLimit,
  validateUpdatePassword, 
  AuthController.updatePassword
);

// Email management routes
router.post('/check-email', 
  ...securityMiddleware,
  generalRateLimit,
  validateForgotPassword, 
  AuthController.checkEmail
);

router.post('/resend-verification', 
  ...securityMiddleware,
  authRateLimit,
  validateForgotPassword, 
  AuthController.resendVerification
);

// Secure token management routes
router.post('/set-tokens',
  ...securityMiddleware,
  generalRateLimit,
  SessionController.setSecureTokens
);

router.get('/token',
  ...securityMiddleware,
  generalRateLimit,
  SessionController.getAccessToken
);

router.post('/clear-tokens',
  ...securityMiddleware,
  generalRateLimit,
  SessionController.clearTokens
);

// Protected routes (require authentication)
router.get('/profile', 
  authenticateToken, 
  AuthController.getProfile
);

// Admin routes (require authentication + admin role)
router.get('/users', 
  authenticateToken, 
  requireRole(['admin']), 
  requireEmailVerification,
  (req, res) => {
    // TODO: Implement user management endpoint
    res.json({ message: 'User management endpoint - coming soon' });
  }
);

export default router;