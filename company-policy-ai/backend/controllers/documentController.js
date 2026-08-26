import { createRequire } from 'module';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { chunkText } from '../services/chunkService.js';
import { processDocumentEmbeddings } from '../services/embeddingService.js';
import mongoose from 'mongoose';

// pdf-parse is CJS-only — load via createRequire
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ============================================================
// POST /api/documents/upload
// Access: admin, hr
// ============================================================
export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No PDF file uploaded. Please attach a PDF file.',
    });
  }

  const { title, department, allowedRoles } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Document title is required.' });
  }
  if (!department) {
    return res.status(400).json({ success: false, message: 'Department is required.' });
  }

  const allowedDepartments = ['HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'Sales', 'General'];
  if (!allowedDepartments.includes(department)) {
    return res.status(400).json({ success: false, message: 'Invalid department value.' });
  }

  // Parse allowedRoles if provided
  let parsedAllowedRoles = ['admin', 'hr', 'manager', 'employee'];
  if (allowedRoles) {
    if (typeof allowedRoles === 'string') {
      try {
        parsedAllowedRoles = JSON.parse(allowedRoles);
      } catch {
        parsedAllowedRoles = allowedRoles.split(',').map((r) => r.trim());
      }
    } else if (Array.isArray(allowedRoles)) {
      parsedAllowedRoles = allowedRoles;
    }
  }

  // Extra mime check beyond Multer fileFilter
  if (
    req.file.mimetype !== 'application/pdf' &&
    !req.file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    return res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
  }

  // --- Parse PDF for full text and page count ---
  let pdfData;
  try {
    pdfData = await pdfParse(req.file.buffer);
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return res.status(422).json({
      success: false,
      message: 'Failed to parse the PDF. The file may be corrupt or password protected.',
    });
  }

  const rawText = (pdfData.text || '').trim();
  if (!rawText) {
    return res.status(422).json({
      success: false,
      message:
        'This PDF does not contain extractable text. It may be a scanned/image-only PDF. OCR support will be added later.',
    });
  }

  const totalPages = pdfData.numpages || 1;

  // --- Collect per-page text for the chunker ---
  // pdf-parse v1 supports a custom pagerender callback to get text per page
  let pagesText = [];
  try {
    await pdfParse(req.file.buffer, {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let pageText = '';
          for (const item of textContent.items) {
            pageText += item.str + ' ';
          }
          pagesText.push({ pageNumber: pagesText.length + 1, text: pageText });
          return pageText;
        });
      },
    });
  } catch {
    // Fallback: treat entire document as a single page
    pagesText = [{ pageNumber: 1, text: rawText }];
  }

  if (pagesText.length === 0) {
    pagesText = [{ pageNumber: 1, text: rawText }];
  }

  // --- Chunk the text ---
  const chunks = chunkText(pagesText);

  if (chunks.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'Text was extracted but could not be chunked. The PDF may have very little content.',
    });
  }

  // --- Persist to MongoDB ---
  let savedDocument;
  try {
    const newDocument = new Document({
      title: title.trim(),
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      department,
      allowedRoles: parsedAllowedRoles,
      uploadedBy: req.user._id,
      totalPages,
      totalChunks: chunks.length,
      version: 1,
      status: 'processing',
    });

    savedDocument = await newDocument.save();

    const chunkDocs = chunks.map((c) => ({
      documentId: savedDocument._id,
      text: c.text,
      pageStart: c.pageStart,
      pageEnd: c.pageEnd,
      chunkNumber: c.chunkNumber,
      department,
      allowedRoles: parsedAllowedRoles,
    }));

    await Chunk.insertMany(chunkDocs);
  } catch (err) {
    console.error('DB save error:', err);
    if (savedDocument && savedDocument._id) {
      await Document.findByIdAndDelete(savedDocument._id).catch(() => {});
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to save document to the database: ' + err.message,
    });
  }

  // Async call to process embeddings in background so UI doesn't block indefinitely
  processDocumentEmbeddings(savedDocument._id).catch(err => {
    console.error(`[Background Embedding] Failed for doc ${savedDocument._id}:`, err);
  });

  return res.status(201).json({
    success: true,
    message: `PDF "${req.file.originalname}" uploaded and processing started.`,
    document: {
      id: savedDocument._id,
      title: savedDocument.title,
      originalFileName: savedDocument.originalFileName,
      department: savedDocument.department,
      totalPages: savedDocument.totalPages,
      totalChunks: savedDocument.totalChunks,
      version: savedDocument.version,
      status: savedDocument.status,
      createdAt: savedDocument.createdAt,
    },
  });
};

// ============================================================
// POST /api/documents/:id/embed
// Access: admin, hr
// ============================================================
export const embedDocument = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid document ID.' });
  }

  try {
    const result = await processDocumentEmbeddings(id);
    return res.status(200).json({
      success: true,
      message: result.failedChunks === 0 ? 'Document embeddings generated successfully' : 'Generated embeddings with some failures',
      data: result,
    });
  } catch (err) {
    console.error('embedDocument error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate embeddings. Please try again.' });
  }
};

// ============================================================
// GET /api/documents
// Access: all authenticated
// ============================================================
export const getDocuments = async (req, res) => {
  try {
    let query = {};

    if (req.user && req.user.role !== 'admin') {
      if (req.user.role === 'hr') {
        query = {
          $or: [{ department: 'HR' }, { department: 'General' }, { department: req.user.department }],
          allowedRoles: 'hr',
        };
      } else {
        query = {
          $or: [{ department: 'General' }, { department: req.user.department }],
          allowedRoles: req.user.role,
        };
      }
    }

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .select('-__v')
      .populate('uploadedBy', 'name email role');

    return res.status(200).json({ success: true, documents });
  } catch (err) {
    console.error('getDocuments error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
};

// ============================================================
// GET /api/documents/:id
// Access: all authenticated
// ============================================================
export const getDocumentById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid document ID.' });
  }

  try {
    const document = await Document.findById(id)
      .select('-__v')
      .populate('uploadedBy', 'name email role');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Access check for non-admin users
    if (req.user.role !== 'admin') {
      const isDeptAllowed = document.department === 'General' || document.department === req.user.department;
      const isRoleAllowed = document.allowedRoles && document.allowedRoles.includes(req.user.role);

      if (!isDeptAllowed || !isRoleAllowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this document.',
        });
      }
    }

    const chunks = await Chunk.find({ documentId: id })
      .sort({ chunkNumber: 1 })
      .limit(10)
      .select('-__v');

    const totalChunks = await Chunk.countDocuments({ documentId: id });

    return res.status(200).json({
      success: true,
      document,
      chunks,
      totalChunks,
      previewLimit: 10,
    });
  } catch (err) {
    console.error('getDocumentById error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve document.' });
  }
};

// ============================================================
// DELETE /api/documents/:id
// Access: admin, hr
// ============================================================
export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid document ID.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const document = await Document.findById(id).session(session);

    if (!document) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const chunkDeleteResult = await Chunk.deleteMany({ documentId: id }, { session });
    await Document.findByIdAndDelete(id, { session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Document "${document.title}" and its ${chunkDeleteResult.deletedCount} chunks were deleted successfully.`,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('deleteDocument error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};
