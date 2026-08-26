import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'Mime type is required'],
      default: 'application/pdf',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: ['HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'General'],
        message: '{VALUE} is not a supported department',
      },
      default: 'General',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },
    totalPages: {
      type: Number,
      required: [true, 'Total pages count is required'],
    },
    totalChunks: {
      type: Number,
      required: [true, 'Total chunks count is required'],
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['processing', 'ready', 'failed', 'archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'processing',
      required: true,
    },
    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Map _id to id in JSON responses for API consistency
documentSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
