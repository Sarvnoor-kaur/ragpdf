import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required'],
    },
    pageStart: {
      type: Number,
      required: [true, 'Start page number is required'],
    },
    pageEnd: {
      type: Number,
      required: [true, 'End page number is required'],
    },
    chunkNumber: {
      type: Number,
      required: [true, 'Chunk number is required'],
    },
    department: {
      type: String,
      default: 'General',
    },
    allowedRoles: {
      type: [String],
      default: ['admin', 'hr', 'manager', 'employee'],
    },
    embedding: {
      type: [Number],
      default: undefined,
      validate: {
        validator: function (v) {
          return !v || v.length === 0 || v.length === 1536;
        },
        message: 'Embedding must be a 1536-dimensional array',
      },
    },
    embeddingModel: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Map _id to id in JSON responses for API consistency
chunkSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Chunk = mongoose.model('Chunk', chunkSchema);

export default Chunk;
