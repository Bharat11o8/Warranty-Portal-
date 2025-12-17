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
// Manpower management routes
router.get('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.getManpower);
router.post('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.addManpower);
router.put('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.updateManpower);
router.delete('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.removeManpower);
export default router;
