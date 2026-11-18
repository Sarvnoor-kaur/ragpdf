import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create mock functions
const mockCountDocuments = jest.fn();
const mockAggregate = jest.fn();
const mockFind = jest.fn();
const mockDistinct = jest.fn();

// Mock the models before importing controllers
jest.unstable_mockModule('../models/Document.js', () => ({
  default: {
    countDocuments: mockCountDocuments,
    aggregate: mockAggregate,
  },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Conversation.js', () => ({
  default: {
    countDocuments: jest.fn(),
    find: mockFind,
    distinct: mockDistinct,
    aggregate: mockAggregate,
  },
}));

// Import after mocking
const { getOverviewMetrics, getQueryTrends, getDocumentsByDepartment } = await import('../controllers/analyticsController.js');
const Document = (await import('../models/Document.js')).default;
const User = (await import('../models/User.js')).default;
const Conversation = (await import('../models/Conversation.js')).default;

describe('Analytics Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        role: 'admin',
        department: 'IT',
        _id: 'user123',
      },
      query: {},
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getOverviewMetrics', () => {
    it('should return overview metrics for admin user', async () => {
      // Mock data
      Document.countDocuments.mockResolvedValue(10);
      User.countDocuments.mockResolvedValue(25);
      Conversation.countDocuments.mockResolvedValue(50);
      Conversation.find.mockResolvedValue([
        {
          messages: [
            { role: 'user' },
            { role: 'assistant', sources: [{ documentId: 'doc1' }] },
          ],
        },
      ]);
      Conversation.distinct.mockResolvedValue(['user1', 'user2', 'user3']);

      await getOverviewMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalDocuments: 10,
          totalUsers: 25,
          totalConversations: 50,
          totalQueries: 1,
          queriesWithSources: 1,
          activeUsers: 3,
          percentageWithSources: 100,
        }),
      });
    });

    it('should apply department filter for non-admin users', async () => {
      req.user.role = 'employee';

      Document.countDocuments.mockResolvedValue(5);
      User.countDocuments.mockResolvedValue(10);
      Conversation.countDocuments.mockResolvedValue(20);
      Conversation.find.mockResolvedValue([]);
      Conversation.distinct.mockResolvedValue([]);

      await getOverviewMetrics(req, res);

      expect(Document.countDocuments).toHaveBeenCalledWith({
        department: 'IT',
        status: 'ready',
      });
    });

    it('should handle errors gracefully', async () => {
      Document.countDocuments.mockRejectedValue(new Error('Database error'));

      await getOverviewMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch overview metrics',
        error: 'Database error',
      });
    });
  });

  describe('getQueryTrends', () => {
    it('should return query trends with date filtering', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        interval: 'day',
      };

      const mockTrends = [
        {
          _id: { year: 2024, period: 1 },
          totalQueries: 10,
          queriesWithSources: 8,
        },
      ];

      Conversation.aggregate.mockResolvedValue(mockTrends);

      await getQueryTrends(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrends,
      });
    });

    it('should handle different interval types', async () => {
      req.query.interval = 'month';
      Conversation.aggregate.mockResolvedValue([]);

      await getQueryTrends(req, res);

      expect(Conversation.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getDocumentsByDepartment', () => {
    it('should return documents grouped by department', async () => {
      const mockDocs = [
        { _id: 'HR', count: 5, totalPages: 100 },
        { _id: 'IT', count: 8, totalPages: 150 },
      ];

      Document.aggregate.mockResolvedValue(mockDocs);

      await getDocumentsByDepartment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDocs,
      });
    });

    it('should restrict data for employee role', async () => {
      req.user.role = 'employee';
      Document.aggregate.mockResolvedValue([]);

      await getDocumentsByDepartment(req, res);

      expect(Document.aggregate).toHaveBeenCalledWith([
        { $match: { status: 'ready', department: 'IT' } },
        expect.any(Object),
        expect.any(Object),
      ]);
    });
  });
});
