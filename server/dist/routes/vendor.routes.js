import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
const router = Router();
router.get('/verify', VendorController.verifyVendor);
// Vendor profile route
router.get('/profile', authenticateToken, requireRole(['vendor']), VendorController.getProfile);
// Manpower management routes
router.get('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.getManpower);
router.post('/manpower', authenticateToken, requireRole(['vendor', 'admin']), VendorController.addManpower);
router.put('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.updateManpower);
router.delete('/manpower/:id', authenticateToken, requireRole(['vendor', 'admin']), VendorController.removeManpower);
export default router;
