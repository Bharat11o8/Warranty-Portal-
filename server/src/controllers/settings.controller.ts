import { Request, Response } from 'express';
import pool from '../config/database.js';
import { ActivityLogService } from '../services/activity-log.service.js';

export const getSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const [rows] = await pool.query(
            'SELECT setting_value FROM system_settings WHERE setting_key = ?',
            [key]
        );

        if ((rows as any[]).length === 0) {
            return res.status(404).json({ success: false, message: 'Setting not found' });
        }

        res.json({ success: true, value: (rows as any[])[0].setting_value });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        // @ts-ignore
        const user = req.user; // Assuming auth middleware attaches user

        const [result] = await pool.query(
            `INSERT INTO system_settings (setting_key, setting_value, updated_by) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?`,
            [key, value, user?.email || 'admin', value, user?.email || 'admin']
        );

        res.json({ success: true, message: 'Setting updated successfully' });

        // Log activity if user is admin
        if (user) {
            // Fetch admin details if not fully populated in req.user (middleware dependent)
            // But assuming req.user has id, name, email from auth middleware
            await ActivityLogService.log({
                adminId: user.id,
                adminName: user.name,
                adminEmail: user.email,
                actionType: 'SYSTEM_SETTING_UPDATED',
                targetType: 'SYSTEM_SETTING',
                targetId: key,
                targetName: key,
                details: { newValue: value },
                ipAddress: req.ip || req.socket?.remoteAddress
            });
        }
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
