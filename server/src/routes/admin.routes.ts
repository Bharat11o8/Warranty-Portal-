import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { ProductController } from '../controllers/product.controller.js';
import { ImageRepairController } from '../controllers/imageRepair.controller.js';
import { authenticateToken, requireRole, requirePermission, requireAnyPermission } from '../middleware/auth.js';

const router = Router();
const adminAuth = [authenticateToken, requireRole('admin')];

// Dashboard
router.get('/stats', ...adminAuth, requirePermission('overview', 'read'), AdminController.getDashboardStats);

// Vendors (Franchises)
router.get('/vendors', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getAllVendors);
router.get('/vendors/:id', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getVendorDetails);
router.put('/vendors/:id/verification', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorVerification);
router.put('/vendors/:id/activation', ...adminAuth, requirePermission('vendors', 'write'), AdminController.toggleVendorActivation);
router.put('/vendors/:id/profile', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorProfile);
router.put('/vendors/:id/coordinates', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorCoordinates);
router.put('/vendors/:id/store-code', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateStoreCode);
router.put('/vendors/:id/allowed-brands', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorAllowedBrands);
router.put('/vendors/:id/distributor-status', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateVendorDistributorStatus);
router.delete('/vendors/:id', ...adminAuth, requirePermission('vendors', 'write'), AdminController.deleteVendor);

// Manpower
router.get('/manpower', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getAllManpower);
router.put('/manpower/:id/approval', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateManpowerApproval);
router.put('/manpower/:id/removal-review', ...adminAuth, requirePermission('vendors', 'write'), AdminController.reviewManpowerRemoval);

// WhatsApp notification toggles
router.get('/notification-settings', ...adminAuth, requirePermission('announcements', 'read'), AdminController.getNotificationSettings);
router.put('/notification-settings', ...adminAuth, requirePermission('announcements', 'write'), AdminController.updateNotificationSettings);

// Distributors
router.get('/distributors', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getAllDistributors);
router.post('/distributors', ...adminAuth, requirePermission('distributors', 'write'), AdminController.createDistributor);
router.get('/distributors/:id/franchises', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getDistributorFranchises);
router.post('/distributors/:id/franchise-assignments', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.mapFranchiseToDistributor);
router.delete('/distributors/:id/franchise-assignments/:vendorId', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.unmapFranchiseFromDistributor);
router.get('/distributors/:id/categories', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getDistributorAllowedCategories);
router.put('/distributors/:id/categories', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.setDistributorAllowedCategories);

// Franchise sourcing
router.get('/franchises/distributor-map', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getFranchiseDistributorMap);
router.get('/franchises/eligible', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getEligibleFranchises);
router.get('/franchises/:vendorId/orders', ...adminAuth, requireAnyPermission(['vendors', 'order_management'], 'read'), AdminController.getFranchiseOrders);
router.get('/franchises/:vendorId/distributors', ...adminAuth, requirePermission('distributors', 'read'), AdminController.getFranchiseDistributors);
router.get('/franchises/:vendorId/distributors/:distributorId/categories', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'read'), AdminController.getFranchiseDistributorCategories);
router.put('/franchises/:vendorId/distributors/:distributorId/categories', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.setFranchiseDistributorCategories);
router.post('/distributors/:id/franchises', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.assignDistributorToFranchise);
router.delete('/distributors/:id/franchises/:vendorId', ...adminAuth, requireAnyPermission(['distributors', 'order_management'], 'write'), AdminController.unassignDistributorFromFranchise);

// Store audits (WhatsApp Flow responses)
router.get('/audits', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getStoreAudits);
router.post('/audits/call', ...adminAuth, requirePermission('vendors', 'write'), AdminController.createCallAudit);
router.put('/audits/:id/review', ...adminAuth, requirePermission('vendors', 'write'), AdminController.updateStoreAuditReview);
router.put('/audits/:id/assign', ...adminAuth, requirePermission('vendors', 'write'), AdminController.assignStoreAudit);
// Audit rounds — audits repeat, so submissions are grouped and non-responders tracked.
router.get('/audit-rounds', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getAuditRounds);
router.post('/audit-rounds/:id/seed', ...adminAuth, requirePermission('vendors', 'write'), AdminController.seedAuditRoundTargets);
router.put('/audit-rounds/:id/close', ...adminAuth, requirePermission('vendors', 'write'), AdminController.closeAuditRound);
router.get('/audit-rounds/:id/targets', ...adminAuth, requirePermission('vendors', 'read'), AdminController.getAuditRoundTargets);

// Warranties
router.get('/warranties', ...adminAuth, requirePermission('warranties', 'read'), AdminController.getAllWarranties);
router.get('/warranties/resubmissions', ...adminAuth, requirePermission('warranties', 'read'), AdminController.getResubmissions);
router.post('/warranties/resubmissions/:id/approve', ...adminAuth, requirePermission('warranties', 'write'), AdminController.approveResubmission);
router.post('/warranties/resubmissions/:id/reject', ...adminAuth, requirePermission('warranties', 'write'), AdminController.rejectResubmission);
router.get('/warranties/:id', ...adminAuth, requirePermission('warranties', 'read'), AdminController.getWarrantyById);
router.put('/warranties/:uid/status', ...adminAuth, requirePermission('warranties', 'write'), AdminController.updateWarrantyStatus);
router.put('/warranties/:uid/details', ...adminAuth, requirePermission('warranties', 'write'), AdminController.updateWarrantyDetails);

// Customers
router.get('/customers', ...adminAuth, requirePermission('customers', 'read'), AdminController.getCustomers);
router.get('/customers/mobile-limits/:phone', ...adminAuth, requirePermission('customers', 'read'), AdminController.getCustomerMobileLimit);
router.put('/customers/mobile-limits/:phone', ...adminAuth, requirePermission('customers', 'write'), AdminController.updateCustomerMobileLimit);
router.get('/customers/:email', ...adminAuth, requirePermission('customers', 'read'), AdminController.getCustomerDetails);
router.delete('/customers/:email', ...adminAuth, requirePermission('customers', 'write'), AdminController.deleteCustomer);

// Product management
router.post('/products', ...adminAuth, requirePermission('products', 'write'), ProductController.addProduct);
router.put('/products/:id', ...adminAuth, requirePermission('products', 'write'), ProductController.updateProduct);
router.delete('/products/:id', ...adminAuth, requirePermission('products', 'write'), ProductController.deleteProduct);

// Admin management
router.get('/admins', ...adminAuth, requirePermission('admins', 'read'), AdminController.getAllAdmins);
router.post('/admins', ...adminAuth, requirePermission('admins', 'write'), AdminController.createAdmin);
router.patch('/admins/:id/permissions', ...adminAuth, requirePermission('admins', 'write'), AdminController.updateAdminPermissions);
router.delete('/admins/:id', ...adminAuth, requirePermission('admins', 'write'), AdminController.deleteAdmin);

router.get('/activity-logs', ...adminAuth, requirePermission('activity_logs', 'read'), AdminController.getActivityLogs);
router.get('/diagnostic/vendors', ...adminAuth, AdminController.getDashboardStats);
router.post('/repair-image', ...adminAuth, requirePermission('warranties', 'write'), ImageRepairController.repairOne);

export default router;
