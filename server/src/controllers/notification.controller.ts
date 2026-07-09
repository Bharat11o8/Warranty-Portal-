import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import db from '../config/database.js';
import { NotificationService } from '../services/notification.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { v4 as uuidv4 } from 'uuid';

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

            let campaignId: string | null = null;

            // ----------------------------------------------------------------
            // WhatsApp broadcast (runs in the background)
            // ----------------------------------------------------------------
            if (whatsapp === true && process.env.ENABLE_WHATSAPP === 'true') {
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

                if (phones.length > 0) {
                    campaignId = uuidv4();
                    const imageUrl: string | undefined = images?.[0] || undefined;

                    // Start broadcast task in background
                    (async () => {
                        try {
                            const result = await WhatsAppService.sendAdminBroadcast(phones, title, message, imageUrl, campaignId!);
                            console.log(`[WhatsApp] Broadcast result — sent: ${result.sent}, failed: ${result.failed}, campaign: ${campaignId}`);
                        } catch (waErr) {
                            console.error('[WhatsApp] Broadcast async error:', waErr);
                        }
                    })();
                } else {
                    console.warn('[WhatsApp] Broadcast: no phones found for selected audience.');
                }
            }

            res.json({ success: true, message: 'Broadcast sent successfully', campaignId });

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
                        message,
                        type: type || 'system',
                        targetRole: req.body.targetRole || 'all',
                        targetCount: targetUsers?.length,
                        campaignId
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

    static async getCampaignStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Campaign ID is required' });
            }

            // Get progress from memory
            const progress = WhatsAppService.getCampaignProgress(id);

            // Get count breakdown from db
            const [dbStats]: any = await db.execute(
                `SELECT 
                    COUNT(CASE WHEN status = 'sent' THEN 1 END) as api_accepted,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
                    COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                    COUNT(*) as total
                 FROM message_logs 
                 WHERE campaign_id = ?`,
                [id]
            );

            // Fetch any failed messages with their error codes & details to show in logs
            const [failures]: any = await db.execute(
                `SELECT recipient_phone, error_code, error_message, updated_at 
                 FROM message_logs 
                 WHERE campaign_id = ? AND status = 'failed'
                 ORDER BY updated_at DESC`,
                [id]
            );

            res.json({
                campaignId: id,
                status: progress ? progress.status : 'completed',
                totalRecipients: progress ? progress.totalRecipients : (dbStats[0]?.total || 0),
                processed: progress ? progress.processed : (dbStats[0]?.total || 0),
                stats: {
                    apiAccepted: dbStats[0]?.api_accepted || 0,
                    delivered: dbStats[0]?.delivered || 0,
                    read: dbStats[0]?.read_count || 0,
                    failed: dbStats[0]?.failed || 0
                },
                failures: failures.map((f: any) => ({
                    phone: f.recipient_phone,
                    errorCode: f.error_code,
                    reason: f.error_message,
                    timestamp: f.updated_at
                }))
            });
        } catch (error) {
            console.error('Get campaign status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBroadcastHistory(req: AuthRequest, res: Response) {
        try {
            const [logs]: any = await db.execute(
                `SELECT id, admin_name, admin_email, details, created_at 
                 FROM admin_activity_log 
                 WHERE action_type = 'BROADCAST_SENT' 
                 ORDER BY created_at DESC 
                 LIMIT 50`
            );

            const broadcasts = [];

            for (const log of logs) {
                let details: any = {};
                try {
                    details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
                } catch (e) {
                    console.error('Failed to parse log details:', e);
                }

                let campaignStats = null;
                if (details.campaignId) {
                    const [stats]: any = await db.execute(
                        `SELECT 
                            COUNT(CASE WHEN status = 'sent' THEN 1 END) as api_accepted,
                            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
                            COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
                            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                            COUNT(*) as total
                         FROM message_logs 
                         WHERE campaign_id = ?`,
                        [details.campaignId]
                    );
                    
                    if (stats.length > 0) {
                        campaignStats = {
                            apiAccepted: stats[0].api_accepted || 0,
                            delivered: stats[0].delivered || 0,
                            read: stats[0].read_count || 0,
                            failed: stats[0].failed || 0,
                            total: stats[0].total || 0
                        };
                    }
                }

                let messageText = details.message || '';
                if (!messageText && details.title) {
                    const [notif]: any = await db.execute(
                        `SELECT message FROM notifications WHERE title = ? ORDER BY created_at DESC LIMIT 1`,
                        [details.title]
                    );
                    if (notif.length > 0) {
                        messageText = notif[0].message;
                    }
                }
                if (!messageText) {
                    messageText = 'No content message details saved.';
                }

                broadcasts.push({
                    id: log.id,
                    adminName: log.admin_name,
                    adminEmail: log.admin_email,
                    createdAt: log.created_at,
                    title: details.title || 'Untitled Broadcast',
                    message: messageText,
                    type: details.type || 'system',
                    targetRole: details.targetRole || 'all',
                    targetCount: details.targetCount || 0,
                    campaignId: details.campaignId || null,
                    stats: campaignStats
                });
            }

            res.json({ success: true, broadcasts });
        } catch (error) {
            console.error('Get broadcast history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
