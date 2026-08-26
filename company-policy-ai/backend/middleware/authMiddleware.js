import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract the token
      token = req.headers.authorization.split(' ')[1];

      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database, excluding password field
      req.user = await User.findById(decoded.userId);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      
      let message = 'Not authorized, token validation failed';
      if (error.name === 'TokenExpiredError') {
        message = 'Not authorized, token expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Not authorized, invalid token format';
      }

      return res.status(401).json({
        success: false,
        message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Scalable role authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user state missing',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

// Alias for Step 2 requirement consistency
export const requireRole = authorize;

