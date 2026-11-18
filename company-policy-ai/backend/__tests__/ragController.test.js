import { jest } from '@jest/globals';

// Mock RAG service
const mockRagService = {
  generateRAGAnswer: jest.fn(),
};

jest.unstable_mockModule('../services/ragService.js', () => mockRagService);

// Import after mocking
const { askQuestion } = await import('../controllers/ragController.js');

describe('RAG Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'user123', role: 'employee', department: 'IT' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('askQuestion', () => {
    it('should return 400 if question is missing', async () => {
      req.body = {};

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A valid question is required.',
        })
      );
    });

    it('should return 400 if question is not a string', async () => {
      req.body = { question: 123 };

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A valid question is required.',
        })
      );
    });

    it('should return 400 if question is too short', async () => {
      req.body = { question: 'Hi' };

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Question must be at least 3 characters long.',
        })
      );
    });

    it('should return 400 if question is too long', async () => {
      req.body = { question: 'a'.repeat(1001) };

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Question must not exceed 1000 characters.',
        })
      );
    });

    it('should generate RAG answer successfully', async () => {
      req.body = { question: 'What is the vacation policy?' };

      mockRagService.generateRAGAnswer.mockResolvedValue({
        answer: 'You get 15 days of vacation per year.',
        sources: [
          { documentId: 'doc1', documentName: 'HR Policy', page: 5 },
        ],
      });

      await askQuestion(req, res);

      expect(mockRagService.generateRAGAnswer).toHaveBeenCalledWith(
        'What is the vacation policy?',
        req.user
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          question: 'What is the vacation policy?',
          answer: 'You get 15 days of vacation per year.',
          sources: [
            { documentId: 'doc1', documentName: 'HR Policy', page: 5 },
          ],
        },
      });
    });

    it('should trim whitespace from question', async () => {
      req.body = { question: '  What is the policy?  ' };

      mockRagService.generateRAGAnswer.mockResolvedValue({
        answer: 'Answer',
        sources: [],
      });

      await askQuestion(req, res);

      expect(mockRagService.generateRAGAnswer).toHaveBeenCalledWith(
        'What is the policy?',
        req.user
      );
    });

    it('should handle errors gracefully', async () => {
      req.body = { question: 'What is the policy?' };

      mockRagService.generateRAGAnswer.mockRejectedValue(
        new Error('Gemini API error')
      );

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Sorry, I couldn't process your question right now. Please try again later.",
      });
    });

    it('should pass user context to RAG service', async () => {
      req.body = { question: 'Test question' };
      req.user = { _id: 'user456', role: 'admin', department: 'HR' };

      mockRagService.generateRAGAnswer.mockResolvedValue({
        answer: 'Answer',
        sources: [],
      });

      await askQuestion(req, res);

      expect(mockRagService.generateRAGAnswer).toHaveBeenCalledWith(
        'Test question',
        req.user
      );
    });
  });
});
