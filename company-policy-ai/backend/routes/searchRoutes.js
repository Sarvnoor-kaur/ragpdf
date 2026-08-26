import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { searchDocuments } from '../controllers/searchController.js';

const router = express.Router();

// GET /api/search — accessible to all authenticated users (admin, hr, employee)
router.get('/', protect, authorize('admin', 'hr', 'employee'), searchDocuments);

export default router;
