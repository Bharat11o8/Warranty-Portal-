import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markRead);
router.patch('/read-all', NotificationController.markAllRead);
router.delete('/:id', NotificationController.delete);
router.patch('/:id/restore', NotificationController.restore);
router.delete('/', NotificationController.clearAll);

// Admin-only broadcast
router.post('/broadcast', requireRole('admin'), NotificationController.broadcast);

export default router;
