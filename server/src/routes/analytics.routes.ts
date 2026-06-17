import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All analytics routes require admin authentication and auto-synchronization
const adminAuth = [authenticateToken, requireRole('admin'), AnalyticsController.autoSyncMiddleware];

router.get('/summary', ...adminAuth, AnalyticsController.getSummaryStats);
router.get('/time-series', ...adminAuth, AnalyticsController.getTimeSeriesData);
router.get('/products', ...adminAuth, AnalyticsController.getProductDistribution);
router.get('/franchises', ...adminAuth, AnalyticsController.getFranchiseStats);
router.get('/fraud', ...adminAuth, AnalyticsController.getFraudAnalytics);
router.get('/fraud/franchise/:franchiseName', ...adminAuth, AnalyticsController.getFranchiseFraudDrilldown);
router.get('/geographic', ...adminAuth, AnalyticsController.getGeographicStats);
router.post('/sync', ...adminAuth, AnalyticsController.syncAnalytics);

export default router;
