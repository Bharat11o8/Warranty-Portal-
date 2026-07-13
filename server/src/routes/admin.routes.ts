import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { ProductController } from '../controllers/product.controller.js';
import { ImageRepairController } from '../controllers/imageRepair.controller.js';
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
router.put('/vendors/:id/allowed-brands', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorAllowedBrands);
router.put('/vendors/:id/distributor-status', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorDistributorStatus);
router.delete('/vendors/:id',             ...adminAuth, requirePermission('vendors', 'write'), AdminController.deleteVendor);

// ── Distributors ─────────────────────────────────────────────────────────────
router.get('/distributors',                                     ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getAllDistributors);
router.post('/distributors',                                    ...adminAuth, requirePermission('vendors', 'write'), AdminController.createDistributor);
router.get('/distributors/:id/franchises',                      ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getDistributorFranchises);
router.post('/distributors/:id/franchise-assignments',          ...adminAuth, requirePermission('vendors', 'write'), AdminController.mapFranchiseToDistributor);
router.delete('/distributors/:id/franchise-assignments/:vendorId', ...adminAuth, requirePermission('vendors', 'write'), AdminController.unmapFranchiseFromDistributor);
router.get('/distributors/:id/categories',                      ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getDistributorAllowedCategories);
router.put('/distributors/:id/categories',                      ...adminAuth, requirePermission('vendors', 'write'), AdminController.setDistributorAllowedCategories);

// ── Franchises ───────────────────────────────────────────────────────────────
router.get('/franchises/eligible',                     ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getEligibleFranchises);
router.get('/franchises/:vendorId/orders',             ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getFranchiseOrders);
router.get('/franchises/:vendorId/distributors',       ...adminAuth, requirePermission('vendors', 'read'),  AdminController.getFranchiseDistributors);
router.post('/distributors/:id/franchises',             ...adminAuth, requirePermission('vendors', 'write'), AdminController.assignDistributorToFranchise);
router.delete('/distributors/:id/franchises/:vendorId', ...adminAuth, requirePermission('vendors', 'write'), AdminController.unassignDistributorFromFranchise);

// ── Warranties ───────────────────────────────────────────────────────────────
router.get('/warranties',                 ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getAllWarranties);
router.get('/warranties/resubmissions',   ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getResubmissions);
router.post('/warranties/resubmissions/:id/approve', ...adminAuth, requirePermission('warranties', 'write'), AdminController.approveResubmission);
router.post('/warranties/resubmissions/:id/reject', ...adminAuth, requirePermission('warranties', 'write'), AdminController.rejectResubmission);
router.get('/warranties/:id',             ...adminAuth, requirePermission('warranties', 'read'),  AdminController.getWarrantyById);
router.put('/warranties/:uid/status',     ...adminAuth, requirePermission('warranties', 'write'), AdminController.updateWarrantyStatus);
router.put('/warranties/:uid/details',    ...adminAuth, requirePermission('warranties', 'write'), AdminController.updateWarrantyDetails);

// ── Customers ────────────────────────────────────────────────────────────────
router.get('/customers',                  ...adminAuth, requirePermission('customers', 'read'),  AdminController.getCustomers);
router.get('/customers/mobile-limits/:phone',  ...adminAuth, requirePermission('customers', 'read'),  AdminController.getCustomerMobileLimit);
router.put('/customers/mobile-limits/:phone',  ...adminAuth, requirePermission('customers', 'write'), AdminController.updateCustomerMobileLimit);
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

// ── TEMP: HEIC-as-.jpg image repair (see imageRepair.controller.ts) ─────────
router.post('/repair-image',              ...adminAuth, requirePermission('warranties', 'write'), ImageRepairController.repairOne);

export default router;