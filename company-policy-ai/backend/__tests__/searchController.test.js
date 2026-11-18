import { jest } from '@jest/globals';

// Mock search service
const mockSearchService = {
  searchDocuments: jest.fn(),
};

jest.unstable_mockModule('../services/searchService.js', () => mockSearchService);

// Import after mocking
const { searchDocuments } = await import('../controllers/searchController.js');

describe('Search Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: { _id: 'user123', role: 'employee', department: 'IT' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('searchDocuments', () => {
    it('should return 400 if query parameter is missing', async () => {
      req.query = {};

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A valid search query is required (e.g. ?q=your question).',
        })
      );
    });

    it('should return 400 if query is not a string', async () => {
      req.query = { q: 123 };

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A valid search query is required (e.g. ?q=your question).',
        })
      );
    });

    it('should return 400 if query is too short', async () => {
      req.query = { q: 'ab' };

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Search query must be at least 3 characters long.',
        })
      );
    });

    it('should return 400 if query is too long', async () => {
      req.query = { q: 'a'.repeat(501) };

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Search query must not exceed 500 characters.',
        })
      );
    });

    it('should perform search successfully', async () => {
      req.query = { q: 'vacation policy' };

      const mockResults = [
        {
          documentId: 'doc1',
          documentName: 'HR Policy',
          chunk: 'Vacation policy details...',
          score: 0.95,
        },
        {
          documentId: 'doc2',
          documentName: 'Employee Handbook',
          chunk: 'PTO information...',
          score: 0.87,
        },
      ];

      mockSearchService.searchDocuments.mockResolvedValue(mockResults);

      await searchDocuments(req, res);

      expect(mockSearchService.searchDocuments).toHaveBeenCalledWith(
        'vacation policy',
        {},
        req.user
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        query: 'vacation policy',
        results: mockResults,
      });
    });

    it('should trim whitespace from query', async () => {
      req.query = { q: '  search query  ' };

      mockSearchService.searchDocuments.mockResolvedValue([]);

      await searchDocuments(req, res);

      expect(mockSearchService.searchDocuments).toHaveBeenCalledWith(
        'search query',
        {},
        req.user
      );
    });

    it('should handle errors gracefully', async () => {
      req.query = { q: 'test query' };

      mockSearchService.searchDocuments.mockRejectedValue(
        new Error('Vector search error')
      );

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Semantic search is temporarily unavailable or an error occurred.',
      });
    });

    it('should pass user context to search service', async () => {
      req.query = { q: 'test search' };
      req.user = { _id: 'user456', role: 'admin', department: 'HR' };

      mockSearchService.searchDocuments.mockResolvedValue([]);

      await searchDocuments(req, res);

      expect(mockSearchService.searchDocuments).toHaveBeenCalledWith(
        'test search',
        {},
        req.user
      );
    });

    it('should return empty results when no matches found', async () => {
      req.query = { q: 'nonexistent query' };

      mockSearchService.searchDocuments.mockResolvedValue([]);

      await searchDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        query: 'nonexistent query',
        results: [],
      });
    });
  });
});
