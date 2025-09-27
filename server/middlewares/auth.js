/**
 * Authentication Middleware
 * Provides JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token middleware
 * Extracts and validates JWT token from Authorization header
 * Sets req.user with decoded token data
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if header follows "Bearer <token>" format
    const tokenParts = authHeader.split(' ');
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Use "Bearer <token>".'
      });
    }

    const token = tokenParts[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.'
        });
      } else {
        throw jwtError;
      }
    }

    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is deactivated.'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Role-based access control middleware factory
 * Returns middleware that checks if user has required role
 * @param {string|string[]} requiredRole - Single role or array of allowed roles
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const userRole = req.user.role;
    
    // Handle single role or array of roles
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Verifies token if present but doesn't fail if missing
 * Useful for endpoints that provide different data for authenticated vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists and is active
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          role: user.role,
          email: user.email,
          name: user.name
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      // Invalid or expired token, continue without authentication
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional auth error:', error);
    // On error, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Admin or owner access middleware
 * Allows access if user is admin or owns the resource
 * Requires req.resourceUserId to be set by previous middleware
 */
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }

  const { role, userId } = req.user;
  const resourceUserId = req.resourceUserId;

  if (role === 'admin' || userId === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own resources or need admin privileges.'
  });
};

/**
 * Rate limiting by user middleware
 * Applies different rate limits based on user role
 */
const roleBasedRateLimit = (req, res, next) => {
  // This is a placeholder for more advanced rate limiting
  // Could implement different limits for different roles
  if (req.user) {
    switch (req.user.role) {
      case 'admin':
        // Admins get higher limits
        req.rateLimit = { maxRequests: 1000, windowMs: 15 * 60 * 1000 };
        break;
      case 'doctor':
        // Doctors get moderate limits
        req.rateLimit = { maxRequests: 500, windowMs: 15 * 60 * 1000 };
        break;
      default:
        // Regular users get standard limits
        req.rateLimit = { maxRequests: 100, windowMs: 15 * 60 * 1000 };
    }
  } else {
    // Anonymous users get lower limits
    req.rateLimit = { maxRequests: 50, windowMs: 15 * 60 * 1000 };
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
  requireAdminOrOwner,
  roleBasedRateLimit
};