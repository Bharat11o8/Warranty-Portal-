import { Router } from 'express';
import { AsmController } from '../controllers/asm.controller.js';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';

const router = Router();
const adminAuth = [authenticateToken, requireRole('admin')];

/**
 * POST /api/asm/route-enquiry
 *
 * Called by the Interakt workflow, not by a logged-in user, so there is no
 * session to check — it is guarded by a shared secret instead. Kept separate
 * from the admin routes below for that reason.
 */
router.post('/route-enquiry', (req, res, next) => {
    const expected = process.env.ASM_WEBHOOK_SECRET;
    // Unset in development so the endpoint can be exercised locally; in
    // production a missing secret means the route is effectively open, so it
    // is logged loudly rather than failing silently.
    if (!expected) {
        console.warn('[ASM] ASM_WEBHOOK_SECRET is not set — /route-enquiry is unauthenticated');
        return next();
    }
    const given = req.headers['x-asm-secret'] || req.query.secret;
    if (given !== expected) return res.status(401).json({ error: 'Unauthorized' });
    next();
}, AsmController.routeEnquiryWebhook);

/*
 * Literal paths are declared before '/:id', or Express would match
 * "known-areas" and "leads" as an ASM id and 404 on a lookup that never
 * should have run.
 */
router.get('/known-areas', ...adminAuth, requirePermission('leads', 'read'), AsmController.knownAreas);
router.get('/leads/list', ...adminAuth, requirePermission('leads', 'read'), AsmController.listLeads);
router.post('/areas', ...adminAuth, requirePermission('leads', 'write'), AsmController.addArea);
router.delete('/areas/:id', ...adminAuth, requirePermission('leads', 'write'), AsmController.removeArea);

// ── Admin: ASMs ─────────────────────────────────────────────────────────────
router.get('/', ...adminAuth, requirePermission('leads', 'read'), AsmController.listAsms);
router.post('/', ...adminAuth, requirePermission('leads', 'write'), AsmController.createAsm);
router.put('/:id', ...adminAuth, requirePermission('leads', 'write'), AsmController.updateAsm);
router.delete('/:id', ...adminAuth, requirePermission('leads', 'write'), AsmController.deleteAsm);

export default router;
