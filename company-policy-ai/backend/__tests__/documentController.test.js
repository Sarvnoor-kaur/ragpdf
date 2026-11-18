import { jest } from '@jest/globals';

// Mock mongoose
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockMongoose = {
  Types: {
    ObjectId: {
      isValid: jest.fn((id) => id !== 'invalid-id' && id !== ''),
    },
  },
  startSession: jest.fn(() => mockSession),
};

jest.unstable_mockModule('mongoose', () => ({ default: mockMongoose }));

// Mock Document model
const mockDocumentConstructor = jest.fn().mockImplementation((data) => ({
  ...data,
  _id: 'doc123',
  save: jest.fn().mockResolvedValue({
    _id: 'doc123',
    ...data,
  }),
}));

mockDocumentConstructor.find = jest.fn();
mockDocumentConstructor.findById = jest.fn();
mockDocumentConstructor.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../models/Document.js', () => ({
  default: mockDocumentConstructor,
}));

// Mock Chunk model
const mockChunkModel = {
  insertMany: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
};

jest.unstable_mockModule('../models/Chunk.js', () => ({
  default: mockChunkModel,
}));

// Mock chunkService
const mockChunkService = {
  chunkText: jest.fn(),
};

jest.unstable_mockModule('../services/chunkService.js', () => mockChunkService);

// Mock embeddingService
const mockEmbeddingService = {
  processDocumentEmbeddings: jest.fn(),
};

jest.unstable_mockModule('../services/embeddingService.js', () => mockEmbeddingService);

// Mock pdf-parse via createRequire
const mockPdfParse = jest.fn();
jest.unstable_mockModule('module', () => ({
  createRequire: jest.fn(() => jest.fn(() => mockPdfParse)),
}));

// Import after mocking
const {
  uploadDocument,
  embedDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} = await import('../controllers/documentController.js');

describe('DocumentController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: 'user123', role: 'admin', department: 'IT' },
      params: {},
      body: {},
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    beforeEach(() => {
      req.file = {
        buffer: Buffer.from('fake pdf content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      };
      req.body = {
        title: 'Test Document',
        department: 'IT',
        allowedRoles: ['admin', 'employee'],
      };

      mockPdfParse.mockResolvedValue({
        text: 'This is test content from the PDF document.',
        numpages: 1,
      });

      mockChunkService.chunkText.mockReturnValue([
        {
          text: 'This is test content',
          pageStart: 1,
          pageEnd: 1,
          chunkNumber: 1,
        },
      ]);

      mockChunkModel.insertMany.mockResolvedValue([]);
      mockEmbeddingService.processDocumentEmbeddings.mockResolvedValue({});
    });

    it('should upload a document successfully', async () => {
      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('uploaded and processing started'),
          document: expect.objectContaining({
            id: 'doc123',
            title: 'Test Document',
          }),
        })
      );
    });

    it('should return 400 when no file is uploaded', async () => {
      req.file = null;

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No PDF file uploaded'),
        })
      );
    });

    it('should return 400 when title is missing', async () => {
      req.body.title = '';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Document title is required.',
        })
      );
    });

    it('should return 400 when department is missing', async () => {
      req.body.department = '';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Department is required.',
        })
      );
    });

    it('should return 400 when department is invalid', async () => {
      req.body.department = 'InvalidDept';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid department value.',
        })
      );
    });

    it('should return 400 when file is not a PDF', async () => {
      req.file.mimetype = 'text/plain';
      req.file.originalname = 'test.txt';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Only PDF files are allowed.',
        })
      );
    });

    it('should handle PDF parsing errors', async () => {
      mockPdfParse.mockRejectedValue(new Error('Corrupt PDF'));

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to parse the PDF'),
        })
      );
    });

    it('should return 422 when PDF has no extractable text', async () => {
      mockPdfParse.mockResolvedValue({
        text: '',
        numpages: 1,
      });

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('does not contain extractable text'),
        })
      );
    });

    it('should return 422 when text cannot be chunked', async () => {
      mockChunkService.chunkText.mockReturnValue([]);

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('could not be chunked'),
        })
      );
    });

    it('should parse allowedRoles from JSON string', async () => {
      req.body.allowedRoles = '["admin", "hr"]';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should parse allowedRoles from comma-separated string', async () => {
      req.body.allowedRoles = 'admin, hr, employee';

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should use default allowedRoles when not provided', async () => {
      delete req.body.allowedRoles;

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle allowedRoles as array', async () => {
      req.body.allowedRoles = ['admin', 'manager'];

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle multi-page PDFs', async () => {
      mockPdfParse.mockResolvedValue({
        text: 'Page 1 content. Page 2 content.',
        numpages: 2,
      });

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          document: expect.objectContaining({
            totalPages: 2,
          }),
        })
      );
    });

    it('should handle database save errors', async () => {
      mockDocumentConstructor.mockImplementationOnce((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      await uploadDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to save document'),
        })
      );
    });

    it('should process embeddings in background', async () => {
      await uploadDocument(req, res);

      expect(mockEmbeddingService.processDocumentEmbeddings).toHaveBeenCalledWith('doc123');
    });

    it('should handle background embedding errors gracefully', async () => {
      mockEmbeddingService.processDocumentEmbeddings.mockRejectedValue(
        new Error('Embedding failed')
      );

      await uploadDocument(req, res);

      // Should still return 201 success as embedding is background task
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('embedDocument', () => {
    beforeEach(() => {
      req.params = { id: 'doc123' };
    });

    it('should generate embeddings successfully', async () => {
      mockEmbeddingService.processDocumentEmbeddings.mockResolvedValue({
        documentId: 'doc123',
        totalChunks: 5,
        embeddedChunks: 5,
        failedChunks: 0,
      });

      await embedDocument(req, res);

      expect(mockEmbeddingService.processDocumentEmbeddings).toHaveBeenCalledWith('doc123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Document embeddings generated successfully',
        })
      );
    });

    it('should return 400 for invalid document ID', async () => {
      req.params.id = 'invalid-id';

      await embedDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid document ID.',
        })
      );
    });

    it('should handle embedding generation errors', async () => {
      mockEmbeddingService.processDocumentEmbeddings.mockRejectedValue(
        new Error('Embedding service error')
      );

      await embedDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to generate embeddings'),
        })
      );
    });

    it('should report partial failures when some chunks fail', async () => {
      mockEmbeddingService.processDocumentEmbeddings.mockResolvedValue({
        documentId: 'doc123',
        totalChunks: 5,
        embeddedChunks: 3,
        failedChunks: 2,
      });

      await embedDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Generated embeddings with some failures',
        })
      );
    });
  });

  describe('getDocuments', () => {
    beforeEach(() => {
      mockDocumentConstructor.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([
          {
            _id: 'doc1',
            title: 'Doc 1',
            department: 'IT',
          },
        ]),
      });
    });

    it('should get all documents for admin users', async () => {
      req.user.role = 'admin';

      await getDocuments(req, res);

      expect(mockDocumentConstructor.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          documents: expect.any(Array),
        })
      );
    });

    it('should filter documents for HR users', async () => {
      req.user.role = 'hr';
      req.user.department = 'HR';

      await getDocuments(req, res);

      expect(mockDocumentConstructor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { department: 'HR' },
            { department: 'General' },
          ]),
          allowedRoles: 'hr',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter documents for regular employees', async () => {
      req.user.role = 'employee';
      req.user.department = 'IT';

      await getDocuments(req, res);

      expect(mockDocumentConstructor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { department: 'General' },
            { department: 'IT' },
          ]),
          allowedRoles: 'employee',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockDocumentConstructor.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await getDocuments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve documents.',
        })
      );
    });
  });

  describe('getDocumentById', () => {
    beforeEach(() => {
      req.params = { id: 'doc123' };
      
      mockDocumentConstructor.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: 'doc123',
          title: 'Test Document',
          department: 'IT',
          allowedRoles: ['admin', 'employee'],
        }),
      });

      mockChunkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([
          { _id: 'chunk1', text: 'Chunk 1', chunkNumber: 1 },
        ]),
      });

      mockChunkModel.countDocuments.mockResolvedValue(10);
    });

    it('should get document by ID for admin', async () => {
      req.user.role = 'admin';

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          document: expect.any(Object),
          chunks: expect.any(Array),
          totalChunks: 10,
        })
      );
    });

    it('should return 400 for invalid document ID', async () => {
      req.params.id = 'invalid-id';

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid document ID.',
        })
      );
    });

    it('should return 404 when document not found', async () => {
      mockDocumentConstructor.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      });

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Document not found.',
        })
      );
    });

    it('should allow access when user department and role match', async () => {
      req.user.role = 'employee';
      req.user.department = 'IT';

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should allow access for General department documents', async () => {
      req.user.role = 'employee';
      req.user.department = 'HR';

      mockDocumentConstructor.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: 'doc123',
          title: 'General Document',
          department: 'General',
          allowedRoles: ['admin', 'employee'],
        }),
      });

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should deny access when department does not match', async () => {
      req.user.role = 'employee';
      req.user.department = 'HR';

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You do not have permission to view this document.',
        })
      );
    });

    it('should deny access when role is not allowed', async () => {
      req.user.role = 'manager';
      req.user.department = 'IT';

      mockDocumentConstructor.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: 'doc123',
          title: 'Test Document',
          department: 'IT',
          allowedRoles: ['admin', 'employee'],
        }),
      });

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You do not have permission to view this document.',
        })
      );
    });

    it('should handle database errors', async () => {
      mockDocumentConstructor.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await getDocumentById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve document.',
        })
      );
    });
  });

  describe('deleteDocument', () => {
    beforeEach(() => {
      req.params = { id: 'doc123' };

      mockDocumentConstructor.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue({
          _id: 'doc123',
          title: 'Test Document',
        }),
      });

      mockChunkModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      mockDocumentConstructor.findByIdAndDelete.mockResolvedValue({});
    });

    it('should delete document and its chunks successfully', async () => {
      await deleteDocument(req, res);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully'),
        })
      );
    });

    it('should return 400 for invalid document ID', async () => {
      req.params.id = 'invalid-id';

      await deleteDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid document ID.',
        })
      );
    });

    it('should return 404 when document not found', async () => {
      mockDocumentConstructor.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await deleteDocument(req, res);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Document not found.',
        })
      );
    });

    it('should handle database errors and rollback transaction', async () => {
      mockDocumentConstructor.findById.mockReturnValue({
        session: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await deleteDocument(req, res);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to delete document.',
        })
      );
    });

    it('should use MongoDB transactions for deletion', async () => {
      await deleteDocument(req, res);

      expect(mockMongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockChunkModel.deleteMany).toHaveBeenCalledWith(
        { documentId: 'doc123' },
        { session: mockSession }
      );
      expect(mockDocumentConstructor.findByIdAndDelete).toHaveBeenCalledWith(
        'doc123',
        { session: mockSession }
      );
    });
  });
});
