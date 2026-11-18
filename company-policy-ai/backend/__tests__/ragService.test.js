import { jest } from '@jest/globals';

// Mock dependencies before importing the service
const mockDocument = {
  find: jest.fn(),
  findById: jest.fn(),
};

const mockGenerateEmbedding = jest.fn();
const mockGenerateGroundedAnswer = jest.fn();
const mockSearchSimilarChunks = jest.fn();

jest.unstable_mockModule('../models/Document.js', () => ({
  default: mockDocument,
}));

jest.unstable_mockModule('../services/geminiService.js', () => ({
  generateEmbedding: mockGenerateEmbedding,
  generateGroundedAnswer: mockGenerateGroundedAnswer,
}));

jest.unstable_mockModule('../services/vectorSearchService.js', () => ({
  searchSimilarChunks: mockSearchSimilarChunks,
}));

const { generateRAGAnswer } = await import('../services/ragService.js');

describe('RAG Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRAGAnswer', () => {
    it('should generate answer for admin user with full access', async () => {
      const user = { role: 'admin', department: 'IT' };
      const question = 'What is the leave policy?';

      mockGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockSearchSimilarChunks.mockResolvedValue([
        {
          documentId: 'doc1',
          text: 'Leave policy content',
          pageStart: 1,
          pageEnd: 1,
          score: 0.85,
          _id: 'chunk1',
        },
      ]);
      mockDocument.findById.mockResolvedValue({
        title: 'Leave Policy',
        originalFileName: 'leave-policy.pdf',
      });
      mockGenerateGroundedAnswer.mockResolvedValue('Employees get 20 days leave.');

      const result = await generateRAGAnswer(question, user);

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('sources');
      expect(result.answer).toBe('Employees get 20 days leave.');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]).toMatchObject({
        documentId: 'doc1',
        page: 1,
        score: 0.85,
      });
    });

    it('should return fallback when user has no authorized documents', async () => {
      const user = { role: 'employee', department: 'Marketing' };
      const question = 'What is the policy?';

      mockDocument.find.mockResolvedValue([]);

      const result = await generateRAGAnswer(question, user);

      expect(result.answer).toBe(
        "I couldn't find this information in the documents you have access to."
      );
      expect(result.sources).toHaveLength(0);
    });

    it('should filter results by user department and role', async () => {
      const user = { role: 'employee', department: 'HR' };
      const question = 'What is the HR policy?';

      mockDocument.find.mockResolvedValue([
        { _id: 'doc1', title: 'HR Policy', department: 'HR', allowedRoles: ['employee'] },
      ]);
      mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
      mockSearchSimilarChunks.mockResolvedValue([
        {
          documentId: 'doc1',
          text: 'HR policy content',
          pageStart: 1,
          pageEnd: 1,
          score: 0.90,
          _id: 'chunk1',
        },
      ]);
      mockDocument.findById.mockResolvedValue({
        title: 'HR Policy',
        originalFileName: 'hr-policy.pdf',
      });
      mockGenerateGroundedAnswer.mockResolvedValue('HR policy details');

      const result = await generateRAGAnswer(question, user);

      expect(result.answer).toBe('HR policy details');
      expect(mockDocument.find).toHaveBeenCalledWith({
        status: 'ready',
        allowedRoles: 'employee',
        $or: [{ department: 'General' }, { department: 'HR' }],
      });
    });

    it('should return fallback when no relevant chunks found', async () => {
      const user = { role: 'admin', department: 'IT' };
      const question = 'What is the policy?';

      mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
      mockSearchSimilarChunks.mockResolvedValue([
        {
          documentId: 'doc1',
          text: 'Irrelevant content',
          pageStart: 1,
          pageEnd: 1,
          score: 0.50, // Below threshold
          _id: 'chunk1',
        },
      ]);

      const result = await generateRAGAnswer(question, user);

      expect(result.answer).toBe(
        "I couldn't find this information in the documents you have access to."
      );
      expect(result.sources).toHaveLength(0);
    });

    it('should build context from multiple chunks', async () => {
      const user = { role: 'admin', department: 'IT' };
      const question = 'What are the policies?';

      mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
      mockSearchSimilarChunks.mockResolvedValue([
        {
          documentId: 'doc1',
          text: 'Policy 1 content',
          pageStart: 1,
          pageEnd: 1,
          score: 0.90,
          _id: 'chunk1',
        },
        {
          documentId: 'doc2',
          text: 'Policy 2 content',
          pageStart: 2,
          pageEnd: 3,
          score: 0.85,
          _id: 'chunk2',
        },
      ]);
      mockDocument.findById
        .mockResolvedValueOnce({ title: 'Policy 1', originalFileName: 'policy1.pdf' })
        .mockResolvedValueOnce({ title: 'Policy 2', originalFileName: 'policy2.pdf' });
      mockGenerateGroundedAnswer.mockResolvedValue('Combined policy information');

      const result = await generateRAGAnswer(question, user);

      expect(result.sources).toHaveLength(2);
      expect(mockGenerateGroundedAnswer).toHaveBeenCalled();
      const contextArg = mockGenerateGroundedAnswer.mock.calls[0][1];
      expect(contextArg).toContain('Policy 1 content');
      expect(contextArg).toContain('Policy 2 content');
    });
  });
});
