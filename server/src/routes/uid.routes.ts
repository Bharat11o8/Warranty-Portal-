import { Router, Request, Response, NextFunction } from 'express';
import { UIDController } from '../controllers/uid.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * API Key middleware for external services.
 * The external UID generator uses this key to authenticate.
 */
const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedKey = process.env.UID_SYNC_API_KEY;

    if (!expectedKey) {
        console.error('FATAL: UID_SYNC_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({ error: 'Invalid or missing API key' });
    }

    next();
};

// ===== External API (API Key auth) =====
// POST /api/uid/sync — Batch sync UIDs from the external generator
router.post('/sync', requireApiKey, UIDController.syncUIDs);

// ===== Frontend API (JWT auth) =====
// GET /api/uid/validate/:uid — Check if a UID is valid and available
router.get('/validate/:uid', authenticateToken, UIDController.validateUID);

// ===== Admin API (JWT + admin role) =====
// GET /api/uid/ — List all UIDs (paginated)
router.get('/', authenticateToken, requireRole('admin'), UIDController.getAllUIDs);
// GET /api/uid/export — Export filtered UIDs to CSV
router.get('/export', authenticateToken, requireRole('admin'), UIDController.exportUIDs);
// POST /api/uid/add — Manually add a UID
router.post('/add', authenticateToken, requireRole('admin'), UIDController.addUID);
// DELETE /api/uid/:uid — Delete an unused UID
router.delete('/:uid', authenticateToken, requireRole('admin'), UIDController.deleteUID);
// GET /api/uid/:uid/details — Get full UID details with warranty spec sheet
router.get('/:uid/details', authenticateToken, requireRole('admin'), UIDController.getUIDDetails);

export default router;
