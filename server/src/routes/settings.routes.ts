import express from 'express';
import { getSetting, updateSetting } from '../controllers/settings.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public route to get settings (like terms)
router.get('/public/:key', getSetting);

// Admin route to update settings
router.put('/admin/:key', authenticateToken, requireRole('admin'), updateSetting);

export default router;
