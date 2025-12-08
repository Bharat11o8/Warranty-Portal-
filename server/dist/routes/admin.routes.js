import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { DiagnosticController } from '../controllers/diagnostic.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
const router = Router();
router.get('/stats', authenticateToken, requireRole('admin'), AdminController.getDashboardStats);
router.get('/vendors', authenticateToken, requireRole('admin'), AdminController.getAllVendors);
router.get('/vendors/:id', authenticateToken, requireRole('admin'), AdminController.getVendorDetails);
router.put('/vendors/:id/verification', authenticateToken, requireRole('admin'), AdminController.updateVendorVerification);
router.delete('/vendors/:id', authenticateToken, requireRole('admin'), AdminController.deleteVendor);
router.put('/warranties/:uid/status', authenticateToken, requireRole('admin'), AdminController.updateWarrantyStatus);
router.get('/warranties', authenticateToken, requireRole('admin'), AdminController.getAllWarranties);
router.get('/customers', authenticateToken, requireRole('admin'), AdminController.getCustomers);
router.get('/customers/:email', authenticateToken, requireRole('admin'), AdminController.getCustomerDetails);
router.delete('/customers/:email', authenticateToken, requireRole('admin'), AdminController.deleteCustomer);
// Admin Management
router.get('/admins', authenticateToken, requireRole('admin'), AdminController.getAllAdmins);
router.post('/admins', authenticateToken, requireRole('admin'), AdminController.createAdmin);
// Activity Logs
router.get('/activity-logs', authenticateToken, requireRole('admin'), AdminController.getActivityLogs);
// Diagnostic route
router.get('/diagnostic/vendors', authenticateToken, requireRole('admin'), DiagnosticController.checkVendorVerification);
export default router;
