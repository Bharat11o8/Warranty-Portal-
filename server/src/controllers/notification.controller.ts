import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import db from '../config/database.js';
import { NotificationService } from '../services/notification.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';

export class NotificationController {
    static async getNotifications(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const includeCleared = req.query.includeCleared === 'true';
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            // Pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 30;
            const offset = (page - 1) * limit;

            // Base WHERE clause
            const whereClause = includeCleared
                ? 'WHERE user_id = ?'
                : 'WHERE user_id = ? AND is_cleared = FALSE';

            // Get total count
            const [countResult]: any = await db.execute(
                `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
                [userId]
            );
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            const query = `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            const [notifications]: any = await db.query(query, [userId, limit, offset]);

            // Parse metadata for each notification
            const parsedNotifications = notifications.map((n: any) => ({
                ...n,
                metadata: n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null
            }));

            res.json({
                success: true,
                notifications: parsedNotifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
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

            const notificationId = Number(id);
            if (isNaN(notificationId)) {
                return res.status(400).json({ error: 'Invalid notification ID' });
            }

            await NotificationService.markAsRead(notificationId, userId);
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

    static async clearAll(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            await NotificationService.clearAll(userId);
            res.json({ success: true, message: 'Notifications cleared from view' });
        } catch (error) {
            console.error('Clear notifications error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async clearById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const notificationId = Number(id);
            if (isNaN(notificationId)) {
                return res.status(400).json({ error: 'Invalid notification ID' });
            }

            await NotificationService.clearById(notificationId, userId);
            res.json({ success: true, message: 'Notification cleared from view' });
        } catch (error) {
            console.error('Clear notification error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async restoreById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const notificationId = Number(id);
            if (isNaN(notificationId)) {
                return res.status(400).json({ error: 'Invalid notification ID' });
            }

            await NotificationService.restoreById(notificationId, userId);
            res.json({ success: true, message: 'Notification restored to view' });
        } catch (error) {
            console.error('Restore notification error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async broadcast(req: AuthRequest, res: Response) {
        try {
            const { title, message, type, link, targetUsers, targetRole, images, videos, whatsapp } = req.body;

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
                targetUsers,
                targetRole
            });

            res.json({ success: true, message: 'Broadcast sent successfully' });

            // ----------------------------------------------------------------
            // WhatsApp broadcast (fire-and-forget — runs after HTTP response)
            // ----------------------------------------------------------------
            if (whatsapp === true && process.env.ENABLE_WHATSAPP === 'true') {
                (async () => {
                    try {
                        let phones: string[] = [];

                        if (targetUsers && targetUsers.length > 0) {
                            // Specific franchise users selected — fetch their registered phones
                            const placeholders = targetUsers.map(() => '?').join(',');
                            const [rows]: any = await db.execute(
                                `SELECT phone_number FROM profiles WHERE id IN (${placeholders}) AND phone_number IS NOT NULL AND phone_number != ''`,
                                targetUsers
                            );
                            phones = rows.map((r: any) => r.phone_number);
                        } else {
                            // All franchises (vendor role)
                            const [rows]: any = await db.execute(
                                `SELECT p.phone_number
                                 FROM profiles p
                                 JOIN user_roles ur ON ur.user_id = p.id
                                 WHERE ur.role = 'vendor'
                                   AND p.phone_number IS NOT NULL
                                   AND p.phone_number != ''`
                            );
                            phones = rows.map((r: any) => r.phone_number);
                        }

                        if (phones.length === 0) {
                            console.warn('[WhatsApp] Broadcast: no phones found for selected audience.');
                            return;
                        }

                        // Use first image from the broadcast as the WA image header (if any)
                        const imageUrl: string | undefined = images?.[0] || undefined;

                        const result = await WhatsAppService.sendAdminBroadcast(phones, title, message, imageUrl);
                        console.log(`[WhatsApp] Broadcast result — sent: ${result.sent}, failed: ${result.failed}`);
                    } catch (waErr) {
                        console.error('[WhatsApp] Broadcast async error:', waErr);
                    }
                })();
            }

            // Log activity
            const admin = req.user;
            if (admin) {
                await ActivityLogService.log({
                    adminId: admin.id,
                    adminName: admin.name,
                    adminEmail: admin.email,
                    actionType: 'BROADCAST_SENT',
                    targetType: 'BROADCAST',
                    details: {
                        title,
                        type: type || 'system',
                        targetRole: req.body.targetRole || 'all',
                        targetCount: targetUsers?.length
                    },
                    ipAddress: req.ip || req.socket?.remoteAddress
                });
            }
        } catch (error) {
            console.error('Broadcast error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async abortBroadcast(req: AuthRequest, res: Response) {
        try {
            WhatsAppService.abortBroadcast();
            res.json({ success: true, message: 'Abort signal sent. No further WhatsApp messages will be dispatched.' });
        } catch (error) {
            console.error('Abort broadcast error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
