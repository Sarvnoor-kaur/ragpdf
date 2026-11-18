import { jest } from '@jest/globals';

// Mock User model before importing controller
const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: mockUserModel
}));

// Mock jwt
const mockJwt = {
  sign: jest.fn(() => 'mock-jwt-token')
};

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt
}));

// Import after mocking
const { registerUser, loginUser, getMe } = await import('../controllers/authController.js');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'employee',
        department: 'IT',
      };

      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee',
        department: 'IT',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);

      await registerUser(req, res);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          user: mockUser,
          token: 'mock-jwt-token',
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { email: 'test@example.com' };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Please provide name, email, and password',
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A user with this email already exists',
        })
      );
    });

    it('should handle database errors', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue(new Error('Database error'));

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during registration',
        })
      );
    });
  });

  describe('loginUser', () => {
    it('should login successfully with correct credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee',
        department: 'IT',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: {
            id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'employee',
            department: 'IT',
          },
          token: 'mock-jwt-token',
        })
      );
    });

    it('should return 400 if email or password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Please provide email and password',
        })
      );
    });

    it('should return 401 if user not found', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials',
        })
      );
    });

    it('should return 401 if password is incorrect', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid credentials',
        })
      );
    });

    it('should handle server errors during login', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error during login',
        })
      );
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      req.user = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employee',
        department: 'IT',
      };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: req.user,
        })
      );
    });

    it('should handle errors when fetching profile', async () => {
      req.user = null;

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error fetching user profile',
        })
      );
    });
  });
});
