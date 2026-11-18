import { jest } from '@jest/globals';

// Mock mongoose
const mockMongoose = {
  Schema: class Schema {
    constructor(definition, options) {
      this.definition = definition;
      this.options = options;
    }
    set(key, value) {
      this._transformers = this._transformers || {};
      this._transformers[key] = value;
    }
  },
  model: jest.fn((name, schema) => {
    return class MockModel {
      constructor(data) {
        Object.assign(this, data);
      }
      static schema = schema;
    };
  }),
};

mockMongoose.Schema.Types = {
  ObjectId: 'ObjectId',
};

jest.unstable_mockModule('mongoose', () => ({ default: mockMongoose }));

// Import after mocking
const Document = (await import('../models/Document.js')).default;
const Chunk = (await import('../models/Chunk.js')).default;
const Conversation = (await import('../models/Conversation.js')).default;

describe('Document Model', () => {
  it('should have correct schema definition', () => {
    const schema = Document.schema;

    expect(schema.definition.title.type).toBe(String);
    expect(schema.definition.title.required).toEqual([true, 'Document title is required']);
    expect(schema.definition.originalFileName.type).toBe(String);
    expect(schema.definition.fileSize.type).toBe(Number);
    expect(schema.definition.mimeType.default).toBe('application/pdf');
  });

  it('should have department enum with correct values', () => {
    const schema = Document.schema;

    expect(schema.definition.department.enum.values).toEqual([
      'HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'Sales', 'General'
    ]);
    expect(schema.definition.department.default).toBe('General');
  });

  it('should have allowedRoles enum with correct values', () => {
    const schema = Document.schema;

    expect(schema.definition.allowedRoles.enum.values).toEqual([
      'admin', 'hr', 'manager', 'employee'
    ]);
  });

  it('should have status enum with correct values', () => {
    const schema = Document.schema;

    expect(schema.definition.status.enum.values).toEqual([
      'processing', 'ready', 'failed', 'archived'
    ]);
    expect(schema.definition.status.default).toBe('processing');
  });

  it('should have uploadedBy as ObjectId reference', () => {
    const schema = Document.schema;

    expect(schema.definition.uploadedBy.type).toBe('ObjectId');
    expect(schema.definition.uploadedBy.ref).toBe('User');
    expect(schema.definition.uploadedBy.required).toEqual([true, 'Uploader reference is required']);
  });

  it('should have timestamps enabled', () => {
    const schema = Document.schema;

    expect(schema.options.timestamps).toBe(true);
  });

  it('should transform toJSON correctly', () => {
    const schema = Document.schema;
    const transform = schema._transformers.toJSON.transform;

    const doc = {};
    const ret = {
      _id: 'doc123',
      __v: 0,
      title: 'Test Document',
      originalFileName: 'test.pdf',
    };

    const result = transform(doc, ret, {});

    expect(result.id).toBe('doc123');
    expect(result._id).toBeUndefined();
    expect(result.__v).toBeUndefined();
    expect(result.title).toBe('Test Document');
  });

  it('should have version default value', () => {
    const schema = Document.schema;

    expect(schema.definition.version.default).toBe(1);
    expect(schema.definition.version.required).toBe(true);
  });
});

describe('Chunk Model', () => {
  it('should have correct schema definition', () => {
    const schema = Chunk.schema;

    expect(schema.definition.documentId.type).toBe('ObjectId');
    expect(schema.definition.documentId.ref).toBe('Document');
    expect(schema.definition.text.required).toEqual([true, 'Chunk text content is required']);
    expect(schema.definition.pageStart.required).toEqual([true, 'Start page number is required']);
    expect(schema.definition.pageEnd.required).toEqual([true, 'End page number is required']);
    expect(schema.definition.chunkNumber.required).toEqual([true, 'Chunk number is required']);
  });

  it('should have department with default value', () => {
    const schema = Chunk.schema;

    expect(schema.definition.department.type).toBe(String);
    expect(schema.definition.department.default).toBe('General');
  });

  it('should have allowedRoles with default value', () => {
    const schema = Chunk.schema;

    expect(schema.definition.allowedRoles.default).toEqual(['admin', 'hr', 'manager', 'employee']);
  });

  it('should have embedding validation for 1536 dimensions', () => {
    const schema = Chunk.schema;
    const validator = schema.definition.embedding.validate.validator;

    // Valid cases
    expect(validator(null)).toBe(true);
    expect(validator(undefined)).toBe(true);
    expect(validator([])).toBe(true);
    expect(validator(new Array(1536).fill(0.5))).toBe(true);

    // Invalid cases
    expect(validator(new Array(100).fill(0.5))).toBe(false);
    expect(validator(new Array(2000).fill(0.5))).toBe(false);
  });

  it('should have timestamps with createdAt only', () => {
    const schema = Chunk.schema;

    expect(schema.options.timestamps.createdAt).toBe(true);
    expect(schema.options.timestamps.updatedAt).toBe(false);
  });

  it('should transform toJSON correctly', () => {
    const schema = Chunk.schema;
    const transform = schema._transformers.toJSON.transform;

    const doc = {};
    const ret = {
      _id: 'chunk123',
      __v: 0,
      text: 'Test chunk content',
      pageStart: 1,
    };

    const result = transform(doc, ret, {});

    expect(result.id).toBe('chunk123');
    expect(result._id).toBeUndefined();
    expect(result.__v).toBeUndefined();
    expect(result.text).toBe('Test chunk content');
  });

  it('should have embedding default as undefined', () => {
    const schema = Chunk.schema;

    expect(schema.definition.embedding.default).toBeUndefined();
  });
});

describe('Conversation Model', () => {
  it('should have correct schema definition', () => {
    const schema = Conversation.schema;

    expect(schema.definition.userId.type).toBe('ObjectId');
    expect(schema.definition.userId.ref).toBe('User');
    expect(schema.definition.userId.required).toBe(true);
    expect(schema.definition.userId.index).toBe(true);
  });

  it('should have title with default value', () => {
    const schema = Conversation.schema;

    expect(schema.definition.title.type).toBe(String);
    expect(schema.definition.title.default).toBe('New Chat');
    expect(schema.definition.title.required).toBe(true);
    expect(schema.definition.title.trim).toBe(true);
  });

  it('should have messages array', () => {
    const schema = Conversation.schema;

    expect(Array.isArray(schema.definition.messages)).toBe(true);
  });

  it('should have timestamps enabled', () => {
    const schema = Conversation.schema;

    expect(schema.options.timestamps).toBe(true);
  });

  it('should transform toJSON correctly', () => {
    const schema = Conversation.schema;
    const transform = schema._transformers.toJSON.transform;

    const doc = {};
    const ret = {
      _id: 'conv123',
      __v: 0,
      title: 'Test Conversation',
      messages: [],
    };

    const result = transform(doc, ret, {});

    expect(result.id).toBe('conv123');
    expect(result._id).toBeUndefined();
    expect(result.__v).toBeUndefined();
    expect(result.title).toBe('Test Conversation');
  });
});
