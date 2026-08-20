import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';

const router = Router();

// Analytics reads must stay read-only and fast. Historical event repair is
// available through the explicit POST /sync endpoint, not every page request.
const adminAuth = [authenticateToken, requireRole('admin')];

router.get('/summary', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getSummaryStats);
router.get('/time-series', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getTimeSeriesData);
router.get('/products', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getProductDistribution);
router.get('/franchises', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getFranchiseStats);
router.get('/fraud', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getFraudAnalytics);
router.get('/fraud/franchise/:franchiseName', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getFranchiseFraudDrilldown);
router.get('/geographic', ...adminAuth, requirePermission('analytics', 'read'), AnalyticsController.getGeographicStats);
router.post('/sync', ...adminAuth, requirePermission('analytics', 'write'), AnalyticsController.syncAnalytics);

export default router;
