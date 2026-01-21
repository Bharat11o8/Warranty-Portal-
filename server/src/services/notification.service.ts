import db from '../config/database.js';
import { getIO } from '../socket.js';

export class NotificationService {
    /**
     * Create and send a notification to a specific user
     */
    static async notify(userId: string | number, data: {
        title: string;
        message: string;
        type?: 'product' | 'alert' | 'system' | 'posm' | 'order' | 'scheme' | 'warranty';
        link?: string;
        metadata?: any;
    }) {
        try {
            // 1. Save to Database
            const [result]: any = await db.execute(
                'INSERT INTO notifications (user_id, title, message, type, link, metadata) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, data.title, data.message, data.type || 'system', data.link || null, data.metadata ? JSON.stringify(data.metadata) : null]
            );

            const notificationId = result.insertId;

            // 2. Fetch the created notification to ensure we have timestamps etc.
            const [rows]: any = await db.execute('SELECT * FROM notifications WHERE id = ?', [notificationId]);
            const notification = rows[0];

            // Parse metadata before emitting
            if (notification.metadata && typeof notification.metadata === 'string') {
                try {
                    notification.metadata = JSON.parse(notification.metadata);
                } catch (e) {
                    console.error('Failed to parse metadata for socket emission:', e);
                }
            }

            // 3. Emit via Socket.io to the user's specific room
            const io = getIO();
            io.to(`user_${userId}`).emit('notification:new', notification);

            return notification;
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    }

    /**
     * Broadcast a notification to all users (e.g., from Admin)
     */
    static async broadcast(data: {
        title: string;
        message: string;
        type?: 'product' | 'alert' | 'system' | 'posm' | 'order' | 'scheme' | 'warranty';
        link?: string;
        metadata?: any;

        targetUsers?: string[]; // Array of user IDs
        targetRole?: 'admin' | 'vendor' | 'customer'; // New parameter
    }) {
        try {
            let vendors: any[] = [];

            // 1. Get recipients
            if (data.targetUsers && data.targetUsers.length > 0) {
                // If specific users are targeted
                vendors = data.targetUsers.map(id => ({ id }));
            } else if (data.targetRole === 'admin') {
                // Determine admin role name (e.g. 'admin')
                const [rows]: any = await db.execute(
                    'SELECT DISTINCT ur.user_id as id FROM user_roles ur WHERE ur.role = "admin"'
                );
                vendors = rows;
            } else {
                // Default: Helper for vendors
                const [rows]: any = await db.execute(
                    'SELECT DISTINCT ur.user_id as id FROM user_roles ur WHERE ur.role = "vendor"'
                );
                vendors = rows;
            }

            // 2. Create notifications for each in parralel for speed, but this could be optimized 
            // for massive user bases using a different approach. For this scale, it's fine.
            const notifications = await Promise.all(
                vendors.map((v: any) => this.notify(v.id, data))
            );

            return notifications;
        } catch (error) {
            console.error('Broadcast failed:', error);
            throw error;
        }
    }

    static async getUnreadCount(userId: string | number) {
        const [rows]: any = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND is_cleared = FALSE',
            [userId]
        );
        return rows[0].count;
    }

    static async markAsRead(notificationId: number, userId: string | number) {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    }

    static async markAllAsRead(userId: string | number) {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );
    }

    static async clearAll(userId: string | number) {
        await db.execute(
            'UPDATE notifications SET is_cleared = TRUE WHERE user_id = ?',
            [userId]
        );
    }
}
