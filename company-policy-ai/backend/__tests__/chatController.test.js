import { jest } from '@jest/globals';

// Mock mongoose
const mockMongoose = {
  Types: {
    ObjectId: {
      isValid: jest.fn((id) => id !== 'invalid-id'),
    },
  },
};

jest.unstable_mockModule('mongoose', () => ({ default: mockMongoose }));

// Mock Conversation model
const mockConversationModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../models/Conversation.js', () => ({
  default: mockConversationModel
}));

// Mock RAG service
const mockRagService = {
  generateRAGAnswer: jest.fn(),
};

jest.unstable_mockModule('../services/ragService.js', () => mockRagService);

// Import after mocking
const {
  createConversation,
  getUserConversations,
  getConversationById,
  sendMessage,
  deleteConversation,
} = await import('../controllers/chatController.js');

describe('ChatController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: 'user123', role: 'employee' },
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a new conversation successfully', async () => {
      const mockConversation = {
        _id: 'conv123',
        userId: 'user123',
        title: 'New Chat',
        messages: [],
      };

      mockConversationModel.create.mockResolvedValue(mockConversation);

      await createConversation(req, res);

      expect(mockConversationModel.create).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'New Chat',
        messages: [],
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        conversation: mockConversation,
      });
    });

    it('should handle errors during conversation creation', async () => {
      mockConversationModel.create.mockRejectedValue(new Error('Database error'));

      await createConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create new conversation.',
        })
      );
    });
  });

  describe('getUserConversations', () => {
    it('should get all user conversations', async () => {
      const mockConversations = [
        { _id: 'conv1', title: 'Chat 1', updatedAt: new Date() },
        { _id: 'conv2', title: 'Chat 2', updatedAt: new Date() },
      ];

      mockConversationModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockConversations),
          }),
        }),
      });

      await getUserConversations(req, res);

      expect(mockConversationModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        conversations: mockConversations,
      });
    });

    it('should handle errors when fetching conversations', async () => {
      mockConversationModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await getUserConversations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve conversations.',
        })
      );
    });
  });

  describe('getConversationById', () => {
    it('should return 400 for invalid conversation ID', async () => {
      req.params.id = 'invalid-id';

      await getConversationById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid conversation ID.',
      });
    });

    it('should return 404 if conversation not found', async () => {
      req.params.id = 'conv123';
      mockConversationModel.findById.mockResolvedValue(null);

      await getConversationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conversation not found.',
      });
    });

    it('should return 403 if user not authorized', async () => {
      req.params.id = 'conv123';
      const mockConversation = {
        userId: { toString: () => 'other-user' },
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await getConversationById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You are not authorized to access this conversation.',
      });
    });

    it('should return conversation if authorized', async () => {
      req.params.id = 'conv123';
      const mockConversation = {
        _id: 'conv123',
        userId: { toString: () => 'user123' },
        title: 'Test Chat',
        messages: [],
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await getConversationById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        conversation: mockConversation,
      });
    });
  });

  describe('sendMessage', () => {
    it('should return 400 for invalid conversation ID', async () => {
      req.params.id = 'invalid-id';
      req.body.question = 'What is the policy?';

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid conversation ID.',
      });
    });

    it('should return 400 if question is missing', async () => {
      req.params.id = 'conv123';
      req.body.question = '';

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Question is required.',
      });
    });

    it('should return 400 if question too short', async () => {
      req.params.id = 'conv123';
      req.body.question = 'Hi';

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Question must be at least 3 characters long.',
      });
    });

    it('should return 400 if question too long', async () => {
      req.params.id = 'conv123';
      req.body.question = 'a'.repeat(1001);

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Question must not exceed 1000 characters.',
      });
    });

    it('should process message and return answer successfully', async () => {
      req.params.id = 'conv123';
      req.body.question = 'What is the vacation policy?';

      const mockConversation = {
        _id: 'conv123',
        userId: { toString: () => 'user123' },
        title: 'New Chat',
        messages: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockRagService.generateRAGAnswer.mockResolvedValue({
        answer: 'The vacation policy allows 15 days per year.',
        sources: [{ documentId: 'doc1', pageStart: 1 }],
      });

      await sendMessage(req, res);

      expect(mockRagService.generateRAGAnswer).toHaveBeenCalledWith(
        'What is the vacation policy?',
        req.user
      );
      expect(mockConversation.messages).toHaveLength(2);
      expect(mockConversation.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          answer: 'The vacation policy allows 15 days per year.',
        })
      );
    });

    it('should update conversation title on first message', async () => {
      req.params.id = 'conv123';
      req.body.question = 'What is the vacation policy for employees?';

      const mockConversation = {
        _id: 'conv123',
        userId: { toString: () => 'user123' },
        title: 'New Chat',
        messages: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockRagService.generateRAGAnswer.mockResolvedValue({
        answer: 'Answer',
        sources: [],
      });

      await sendMessage(req, res);

      expect(mockConversation.title).toContain('What is the vacation');
    });

    it('should return 403 if user not authorized to send message', async () => {
      req.params.id = 'conv123';
      req.body.question = 'Test question';

      const mockConversation = {
        userId: { toString: () => 'other-user' },
      };

      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteConversation', () => {
    it('should return 400 for invalid conversation ID', async () => {
      req.params.id = 'invalid-id';

      await deleteConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid conversation ID.',
      });
    });

    it('should return 404 if conversation not found', async () => {
      req.params.id = 'conv123';
      mockConversationModel.findById.mockResolvedValue(null);

      await deleteConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conversation not found.',
      });
    });

    it('should return 403 if user not authorized to delete', async () => {
      req.params.id = 'conv123';
      const mockConversation = {
        userId: { toString: () => 'other-user' },
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await deleteConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You are not authorized to delete this conversation.',
      });
    });

    it('should delete conversation successfully', async () => {
      req.params.id = 'conv123';
      const mockConversation = {
        userId: { toString: () => 'user123' },
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockConversationModel.findByIdAndDelete.mockResolvedValue(mockConversation);

      await deleteConversation(req, res);

      expect(mockConversationModel.findByIdAndDelete).toHaveBeenCalledWith('conv123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    });
  });
});
