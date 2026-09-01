import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';

import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/verify', VendorController.verifyVendor);

// Warranty actions
router.post('/warranty/:uid/approve', authenticateToken, requireRole(['vendor']), VendorController.approveWarranty);
router.post('/warranty/:uid/reject', authenticateToken, requireRole(['vendor']), VendorController.rejectWarranty);

// Vendor profile route
router.get('/profile', authenticateToken, requireRole(['vendor']), VendorController.getProfile);

// The store's own audit submissions — what it answered, and whether one is
// currently being asked for. Vendor role only; scoped by session.
router.get('/audits', authenticateToken, requireRole(['vendor']), VendorController.getOwnAudits);

// Manpower management routes
router.get('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.getManpower);
router.get('/manpower/:manpowerId/warranties', authenticateToken, requireRole(['vendor', 'admin']), VendorController.getManpowerWarranties);
router.post('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.addManpower);
router.put('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.updateManpower);
router.delete('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.removeManpower);
router.put('/manpower/:id/restore', authenticateToken, requireRole(['vendor', 'admin']), VendorController.restoreManpower);

export default router;