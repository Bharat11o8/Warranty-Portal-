import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All analytics routes require admin authentication
const adminAuth = [authenticateToken, requireRole('admin')];

router.get('/summary', ...adminAuth, AnalyticsController.getSummaryStats);
router.get('/time-series', ...adminAuth, AnalyticsController.getTimeSeriesData);
router.get('/products', ...adminAuth, AnalyticsController.getProductDistribution);
router.get('/franchises', ...adminAuth, AnalyticsController.getFranchiseStats);

export default router;
