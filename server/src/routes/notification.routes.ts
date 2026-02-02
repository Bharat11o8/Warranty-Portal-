import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/:id/restore', NotificationController.restoreById);
router.patch('/read-all', NotificationController.markAllRead);
router.delete('/', NotificationController.clearAll);
router.delete('/:id', NotificationController.clearById);

// Admin-only broadcast
router.post('/broadcast', requireRole('admin'), NotificationController.broadcast);

export default router;
