import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public route: External email-based confirmation for distributor
// Note: This endpoint does NOT require standard auth token because the email link contains a secure JWT confirmation token.
router.get('/confirm-external', OrderController.confirmExternal);

// Franchise/Vendor routes (authenticated, vendor role required)
router.post('/', authenticateToken, requireRole('vendor'), OrderController.createOrder);
router.get('/my-orders', authenticateToken, requireRole('vendor'), OrderController.getMyOrders);
router.get('/distributor-stock', authenticateToken, requireRole('vendor'), OrderController.getDistributorStock);
router.get('/catalogue', authenticateToken, requireRole('vendor'), OrderController.getFranchiseCatalogue);
router.get('/my-distributors', authenticateToken, requireRole('vendor'), OrderController.getMyDistributors);
router.get('/distributor', authenticateToken, requireRole('vendor'), OrderController.getDistributorDetails);
router.get('/distributor/franchises', authenticateToken, requireRole('vendor'), OrderController.getDistributorFranchises);
router.get('/distributor/inventory', authenticateToken, requireRole('vendor'), OrderController.getOwnInventory);
router.put('/distributor/inventory', authenticateToken, requireRole('vendor'), OrderController.updateOwnStock);
router.get('/distributor/incoming', authenticateToken, requireRole('vendor'), OrderController.getDistributorIncomingOrders);
router.post('/distributor/incoming/:id/confirm', authenticateToken, requireRole('vendor'), OrderController.confirmDistributorOrder);
router.post('/distributor/incoming/:id/hold', authenticateToken, requireRole('vendor'), OrderController.holdDistributorOrder);
router.post('/distributor/incoming/:id/note', authenticateToken, requireRole('vendor'), OrderController.addDistributorNote);
router.post('/distributor/incoming/:id/cancel', authenticateToken, requireRole('vendor'), OrderController.cancelDistributorOrder);
router.post('/:id/received', authenticateToken, requireRole('vendor'), OrderController.markOrderReceived);

// Decline outgoing orders (admin only)
router.post('/:id/cancel', authenticateToken, requireRole('admin'), OrderController.cancelOrder);

// Chat / Messages routes
router.get('/:id/messages', authenticateToken, OrderController.getOrderMessages);
router.post('/:id/messages', authenticateToken, OrderController.createOrderMessage);

// Order by ID (Authenticated: Vendor can view their own, Admin can view any)
router.get('/:id', authenticateToken, OrderController.getOrderById);
router.get('/:id/pdf', authenticateToken, OrderController.downloadOrderPDF);

// Admin routes
router.get('/', authenticateToken, requireRole('admin'), OrderController.getAllOrders);
router.put('/:id/status', authenticateToken, requireRole('admin'), OrderController.updateOrderStatus);

export default router;
