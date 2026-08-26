import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { askQuestion } from '../controllers/ragController.js';

const router = express.Router();

// POST /api/rag/ask — accessible to all authenticated users
router.post('/ask', protect, authorize('admin', 'hr', 'employee'), askQuestion);

export default router;
