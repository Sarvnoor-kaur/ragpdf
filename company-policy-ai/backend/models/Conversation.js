import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    documentName: {
      type: String,
      required: true,
    },
    page: {
      type: Number,
      required: true,
    },
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk',
    },
    score: {
      type: Number,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: [sourceSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      required: true,
      trim: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Map _id to id in JSON responses for API consistency
conversationSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
