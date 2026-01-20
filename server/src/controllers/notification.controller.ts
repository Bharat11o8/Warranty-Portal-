import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import db from '../config/database.js';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
    static async getNotifications(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const [notifications]: any = await db.execute(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [userId]
            );

            res.json({ success: true, notifications });
        } catch (error) {
            console.error('Fetch notifications error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getUnreadCount(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const count = await NotificationService.getUnreadCount(userId);
            res.json({ success: true, count });
        } catch (error) {
            console.error('Unread count error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async markRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            await NotificationService.markAsRead(Number(id), userId);
            res.json({ success: true });
        } catch (error) {
            console.error('Mark read error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async markAllRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            await NotificationService.markAllAsRead(userId);
            res.json({ success: true });
        } catch (error) {
            console.error('Mark all read error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async broadcast(req: AuthRequest, res: Response) {
        try {
            const { title, message, type, link, targetUsers, images, videos } = req.body;

            if (!title || !message) {
                return res.status(400).json({ error: 'Title and message are required' });
            }

            const metadata = {
                images: images || [],
                videos: videos || []
            };

            await NotificationService.broadcast({
                title,
                message,
                type: type || 'system',
                link: link || null,
                metadata,
                targetUsers
            });

            res.json({ success: true, message: 'Broadcast sent successfully' });
        } catch (error) {
            console.error('Broadcast error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
