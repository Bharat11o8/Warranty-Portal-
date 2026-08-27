import express from 'express';
import { getSetting, updateSetting } from '../controllers/settings.controller.js';
import { authenticateToken, requireAnyPermission, requirePermission, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public route to get settings (like terms)
router.get('/public/:key', getSetting);

const requireSettingPermission = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.params.key;

    if (key.startsWith('ecatalogue_')) {
        return requirePermission('ecatalogue', 'write')(req, res, next);
    }

    // Form Content owns form-specific terms/disclaimers. The legacy Terms page
    // may still update terms_conditions, so either assigned permission is valid.
    if (key === 'seat_cover_disclaimer' || key === 'ppf_disclaimer' || key === 'ppf_terms_conditions'
        || key.endsWith('_claim_process')) {
        return requirePermission('content_manager', 'write')(req, res, next);
    }

    // How far back a customer may date a purchase on the QR flow. It governs
    // what the warranty form accepts, so it sits with the form content.
    if (key === 'purchase_date_window_days') {
        return requireAnyPermission(['content_manager', 'warranties'], 'write')(req, res, next);
    }

    return requireAnyPermission(['terms', 'content_manager'], 'write')(req, res, next);
};

router.put('/admin/:key', authenticateToken, requireRole('admin'), requireSettingPermission, updateSetting);

export default router;
