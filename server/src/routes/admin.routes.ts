import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';

const router = Router();

const adminAuth = [authenticateToken, requireRole('admin')];

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats', ...adminAuth, requirePermission('overview', 'read'), AdminController.getDashboardStats);

// ── Vendors (Franchises) ─────────────────────────────────────────────────────
router.get('/vendors',                    ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getAllVendors);
router.get('/vendors/:id',                ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getVendorDetails);
router.put('/vendors/:id/verification',   ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorVerification);
router.put('/vendors/:id/activation',     ...adminAuth, requirePermission('vendors', 'write'), AdminController.toggleVendorActivation);
router.put('/vendors/:id/profile',        ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorProfile);
router.put('/vendors/:id/coordinates',    ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorCoordinates);
router.put('/vendors/:id/store-code',     ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateStoreCode);
router.delete('/vendors/:id',             ...adminAuth, requirePermission('vendors', 'write'), AdminController.deleteVendor);

// ── Warranties ───────────────────────────────────────────────────────────────
router.get('/warranties',                 ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getAllWarranties);
router.get('/warranties/resubmissions',   ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getResubmissions);
router.post('/warranties/resubmissions/:id/approve', ...adminAuth, requirePermission('warranties', 'write'), AdminController.approveResubmission);
router.post('/warranties/resubmissions/:id/reject', ...adminAuth, requirePermission('warranties', 'write'), AdminController.rejectResubmission);
router.get('/warranties/:id',             ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getWarrantyById);
router.put('/warranties/:uid/status',     ...adminAuth, requirePermission('warranties', 'write'), AdminController.updateWarrantyStatus);

// ── Customers ────────────────────────────────────────────────────────────────
router.get('/customers',                  ...adminAuth, requirePermission('customers', 'read'),  AdminController.getCustomers);
router.get('/customers/:email',           ...adminAuth, requirePermission('customers', 'read'),  AdminController.getCustomerDetails);
router.delete('/customers/:email',        ...adminAuth, requirePermission('customers', 'write'), AdminController.deleteCustomer);

// ── Product Management ───────────────────────────────────────────────────────
router.post('/products',                  ...adminAuth, requirePermission('products', 'write'), ProductController.addProduct);
router.put('/products/:id',               ...adminAuth, requirePermission('products', 'write'), ProductController.updateProduct);
router.delete('/products/:id',            ...adminAuth, requirePermission('products', 'write'), ProductController.deleteProduct);

// ── Admin Management (Super Admin only) ─────────────────────────────────────
router.get('/admins',                     ...adminAuth, requirePermission('admins', 'read'),  AdminController.getAllAdmins);
router.post('/admins',                    ...adminAuth, requirePermission('admins', 'write'), AdminController.createAdmin);
router.patch('/admins/:id/permissions',   ...adminAuth, requirePermission('admins', 'write'), AdminController.updateAdminPermissions);
router.delete('/admins/:id',              ...adminAuth, requirePermission('admins', 'write'), AdminController.deleteAdmin);

// ── Activity Logs ────────────────────────────────────────────────────────────
router.get('/activity-logs',              ...adminAuth, requirePermission('activity_logs', 'read'), AdminController.getActivityLogs);

// ── Diagnostic ───────────────────────────────────────────────────────────────
router.get('/diagnostic/vendors',         ...adminAuth, AdminController.getDashboardStats);

export default router;