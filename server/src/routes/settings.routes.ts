import express from 'express';
import { getSetting, updateSetting } from '../controllers/settings.controller.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Public route to get settings (like terms)
router.get('/public/:key', getSetting);

// Admin route to update settings (terms)
router.put('/admin/:key', authenticateToken, requireRole('admin'), requirePermission('terms', 'write'), updateSetting);

export default router;
