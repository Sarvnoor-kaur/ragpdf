import { jest } from '@jest/globals';

// Mock bcryptjs
const mockBcrypt = {
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
};

jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));

// Mock mongoose
const mockMongoose = {
  Schema: class Schema {
    constructor(definition, options) {
      this.definition = definition;
      this.options = options;
      this.methods = {};
      this.statics = {};
      this._transformers = {};
    }
    pre(hook, fn) {
      this._preHooks = this._preHooks || {};
      this._preHooks[hook] = fn;
    }
    set(key, value) {
      this._transformers[key] = value;
    }
  },
  model: jest.fn((name, schema) => {
    return class MockModel {
      constructor(data) {
        Object.assign(this, data);
        this.isModified = jest.fn();
      }
      static schema = schema;
    };
  }),
};

jest.unstable_mockModule('mongoose', () => ({ default: mockMongoose }));

// Import after mocking
const User = (await import('../models/User.js')).default;

describe('User Model', () => {
  describe('Password hashing', () => {
    it('should hash password before saving', async () => {
      const schema = User.schema;
      const saveHook = schema._preHooks.save;

      const mockUser = {
        password: 'plain-password',
        isModified: jest.fn().mockReturnValue(true),
      };

      const next = jest.fn();

      await saveHook.call(mockUser, next);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plain-password', 'mock-salt');
      expect(mockUser.password).toBe('hashed-password');
      expect(next).toHaveBeenCalled();
    });

    it('should not hash password if not modified', async () => {
      const schema = User.schema;
      const saveHook = schema._preHooks.save;

      // Clear all mock calls first
      mockBcrypt.hash.mockClear();

      const mockUser = {
        password: 'already-hashed',
        isModified: jest.fn().mockReturnValue(false),
      };

      const next = jest.fn();

      await saveHook.call(mockUser, next);

      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle hashing errors', async () => {
      const schema = User.schema;
      const saveHook = schema._preHooks.save;

      mockBcrypt.hash.mockRejectedValueOnce(new Error('Hashing failed'));

      const mockUser = {
        password: 'plain-password',
        isModified: jest.fn().mockReturnValue(true),
      };

      const next = jest.fn();

      await saveHook.call(mockUser, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('comparePassword method', () => {
    it('should compare passwords correctly', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const user = new User({ password: 'hashed-password' });
      user.comparePassword = async function (candidatePassword) {
        return await mockBcrypt.compare(candidatePassword, this.password);
      };

      const result = await user.comparePassword('plain-password');

      expect(mockBcrypt.compare).toHaveBeenCalledWith('plain-password', 'hashed-password');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const user = new User({ password: 'hashed-password' });
      user.comparePassword = async function (candidatePassword) {
        return await mockBcrypt.compare(candidatePassword, this.password);
      };

      const result = await user.comparePassword('wrong-password');

      expect(result).toBe(false);
    });
  });

  describe('toJSON transformation', () => {
    it('should remove password from JSON output', () => {
      const schema = User.schema;
      const transform = schema._transformers.toJSON.transform;

      const doc = {};
      const ret = {
        _id: 'user123',
        __v: 0,
        password: 'hashed-password',
        name: 'Test User',
        email: 'test@example.com',
      };

      const result = transform(doc, ret, {});

      expect(result.password).toBeUndefined();
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
      expect(result.id).toBe('user123');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('User schema validation', () => {
    it('should have correct schema definition', () => {
      const schema = User.schema;

      expect(schema.definition.name.type).toBe(String);
      expect(schema.definition.name.required).toEqual([true, 'Name is required']);
      expect(schema.definition.email.type).toBe(String);
      expect(schema.definition.email.required).toEqual([true, 'Email is required']);
      expect(schema.definition.email.unique).toBe(true);
      expect(schema.definition.password.type).toBe(String);
      expect(schema.definition.password.required).toEqual([true, 'Password is required']);
    });

    it('should have role enum with correct values', () => {
      const schema = User.schema;

      expect(schema.definition.role.enum.values).toEqual(['admin', 'hr', 'manager', 'employee']);
      expect(schema.definition.role.default).toBe('employee');
    });

    it('should have department enum with correct values', () => {
      const schema = User.schema;

      expect(schema.definition.department.enum.values).toEqual([
        'HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'Sales', 'General'
      ]);
      expect(schema.definition.department.default).toBe('General');
    });
  });
});
