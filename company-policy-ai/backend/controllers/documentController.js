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
// HELPER FUNCTIONS FOR DOCUMENT UPLOAD
// ============================================================

/**
 * Validates the upload request body
 */
const validateUploadRequest = (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No PDF file uploaded. Please attach a PDF file.',
    });
    return false;
  }

  const { title, department } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ success: false, message: 'Document title is required.' });
    return false;
  }

  if (!department) {
    res.status(400).json({ success: false, message: 'Department is required.' });
    return false;
  }

  const allowedDepartments = ['HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'Sales', 'General'];
  if (!allowedDepartments.includes(department)) {
    res.status(400).json({ success: false, message: 'Invalid department value.' });
    return false;
  }

  // Extra mime check beyond Multer fileFilter
  if (
    req.file.mimetype !== 'application/pdf' &&
    !req.file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
    return false;
  }

  return true;
};

/**
 * Parses allowed roles from request body
 */
const parseAllowedRoles = (allowedRoles) => {
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
  
  return parsedAllowedRoles;
};

/**
 * Parses PDF and extracts text per page
 */
const parsePdfDocument = async (fileBuffer, res) => {
  let pdfData;
  try {
    pdfData = await pdfParse(fileBuffer);
  } catch (err) {
    console.error('PDF parse error:', err.message);
    res.status(422).json({
      success: false,
      message: 'Failed to parse the PDF. The file may be corrupt or password protected.',
    });
    return null;
  }

  const rawText = (pdfData.text || '').trim();
  if (!rawText) {
    res.status(422).json({
      success: false,
      message:
        'This PDF does not contain extractable text. It may be a scanned/image-only PDF. OCR support will be added later.',
    });
    return null;
  }

  const totalPages = pdfData.numpages || 1;
  return { pdfData, rawText, totalPages };
};

/**
 * Extracts per-page text from PDF
 */
const extractPagesText = async (fileBuffer, rawText) => {
  let pagesText = [];
  try {
    await pdfParse(fileBuffer, {
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

  return pagesText;
};

/**
 * Saves document and chunks to database
 */
const saveDocumentToDatabase = async (documentData, chunks, userId, res) => {
  let savedDocument;
  try {
    const newDocument = new Document({
      ...documentData,
      uploadedBy: userId,
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
      department: documentData.department,
      allowedRoles: documentData.allowedRoles,
    }));

    await Chunk.insertMany(chunkDocs);
    return savedDocument;
  } catch (err) {
    console.error('DB save error:', err);
    if (savedDocument && savedDocument._id) {
      await Document.findByIdAndDelete(savedDocument._id).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: 'Failed to save document to the database: ' + err.message,
    });
    return null;
  }
};

// ============================================================
// POST /api/documents/upload
// Access: admin, hr
// ============================================================
export const uploadDocument = async (req, res) => {
  // Step 1: Validate request
  if (!validateUploadRequest(req, res)) {
    return;
  }

  const { title, department, allowedRoles } = req.body;

  // Step 2: Parse allowed roles
  const parsedAllowedRoles = parseAllowedRoles(allowedRoles);

  // Step 3: Parse PDF
  const parseResult = await parsePdfDocument(req.file.buffer, res);
  if (!parseResult) {
    return;
  }

  const { rawText, totalPages } = parseResult;

  // Step 4: Extract per-page text
  const pagesText = await extractPagesText(req.file.buffer, rawText);

  // Step 5: Chunk the text
  const chunks = chunkText(pagesText);

  if (chunks.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'Text was extracted but could not be chunked. The PDF may have very little content.',
    });
  }

  // Step 6: Save to database
  const documentData = {
    title: title.trim(),
    originalFileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    department,
    allowedRoles: parsedAllowedRoles,
    totalPages,
  };

  const savedDocument = await saveDocumentToDatabase(documentData, chunks, req.user._id, res);
  if (!savedDocument) {
    return;
  }

  // Step 7: Process embeddings in background
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
