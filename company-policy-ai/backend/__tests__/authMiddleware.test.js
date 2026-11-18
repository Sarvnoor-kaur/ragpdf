import { jest } from '@jest/globals';

// Mock jwt
const mockJwt = {
  verify: jest.fn(),
};

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt
}));

// Mock User model
const mockUserModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: mockUserModel
}));

// Import after mocking
const { protect, authorize } = await import('../middleware/authMiddleware.js');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('protect middleware', () => {
    it('should authenticate valid JWT token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee',
      };

      mockJwt.verify.mockReturnValue({ userId: 'user123' });
      mockUserModel.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, no token provided',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic invalid-token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, no token provided',
        })
      );
    });

    it('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';

      mockJwt.verify.mockReturnValue({ userId: 'user123' });
      mockUserModel.findById.mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, user not found',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, token expired',
        })
      );
    });

    it('should return 401 for invalid token format', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, invalid token format',
        })
      );
    });

    it('should handle generic JWT errors', async () => {
      req.headers.authorization = 'Bearer error-token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Generic JWT error');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, token validation failed',
        })
      );
    });
  });

  describe('authorize middleware', () => {
    it('should allow user with correct role', () => {
      req.user = { role: 'admin' };

      const middleware = authorize('admin', 'hr');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow user with one of multiple roles', () => {
      req.user = { role: 'hr' };

      const middleware = authorize('admin', 'hr', 'manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user role not authorized', () => {
      req.user = { role: 'employee' };

      const middleware = authorize('admin', 'hr');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Forbidden: User role 'employee' is not authorized to access this resource",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user state missing', () => {
      req.user = null;

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authorized, user state missing',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
