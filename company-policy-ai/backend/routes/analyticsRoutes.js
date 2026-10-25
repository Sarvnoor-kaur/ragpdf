import express from 'express';
import {
  getOverviewMetrics,
  getQueryTrends,
  getDocumentsByDepartment,
  getMostAccessedDocuments,
  getActivityHeatmap,
  getUsersByDepartment,
  getDocumentStatusDistribution,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Overview Metrics
router.get('/overview', getOverviewMetrics);

// Query Trends
router.get('/query-trends', getQueryTrends);

// Documents Analytics
router.get('/documents/by-department', getDocumentsByDepartment);
router.get('/documents/most-accessed', getMostAccessedDocuments);
router.get('/documents/status-distribution', getDocumentStatusDistribution);

// Activity Analytics
router.get('/activity/heatmap', getActivityHeatmap);

// User Analytics (admin/hr only)
router.get('/users/by-department', getUsersByDepartment);

export default router;
