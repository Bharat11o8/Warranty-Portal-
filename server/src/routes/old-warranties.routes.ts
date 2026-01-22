import { Router } from 'express';
import { OldWarrantiesController } from '../controllers/old-warranties.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireRole('admin'));

// Get seat cover warranties with search and pagination
router.get('/seatcovers', OldWarrantiesController.getSeatCoverWarranties);

// Get filter options
router.get('/seatcovers/warranty-types', OldWarrantiesController.getWarrantyTypes);
router.get('/seatcovers/store-names', OldWarrantiesController.getStoreNames);

// Get dashboard stats
router.get('/seatcovers/stats', OldWarrantiesController.getStats);

// Export to CSV
router.get('/seatcovers/export', OldWarrantiesController.exportCSV);

export default router;
