import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  embedDocument,
} from '../controllers/documentController.js';

const router = express.Router();

// ---------------------------------------------------------------
// Multer configuration — memory storage (no disk writes needed)
// ---------------------------------------------------------------
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const fileFilter = (req, file, cb) => {
  // Validate MIME type
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only PDF files are allowed'), { code: 'INVALID_FILE_TYPE' }),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

// Custom Multer error handler wrapper
const multerUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'PDF file must be smaller than 10 MB',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
};

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------

// POST /api/documents/upload — admin or hr only
router.post(
  '/upload',
  protect,
  authorize('admin', 'hr'),
  multerUpload,
  uploadDocument
);

// GET /api/documents — all authenticated users
router.get('/', protect, getDocuments);

// GET /api/documents/:id — all authenticated users
router.get('/:id', protect, getDocumentById);

// DELETE /api/documents/:id — admin or hr only
router.delete('/:id', protect, authorize('admin', 'hr'), deleteDocument);

// POST /api/documents/:id/embed — admin or hr only
router.post('/:id/embed', protect, authorize('admin', 'hr'), embedDocument);

export default router;
