import { Router, Request, Response, NextFunction } from 'express';
import POSMController from '../controllers/posm.controller.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';
import { posmUpload, attachPublicUrls } from '../config/localUpload.js';

const router = Router();

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    posmUpload.array('attachments', 5)(req, res, (err: any) => {
        if (err) {
            console.error('POSM upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'File upload failed'
            });
        }
        attachPublicUrls(req, res, next);
    });
};

// Admin Routes
router.get('/admin/all', authenticateToken, requireRole('admin'), requirePermission('posm', 'read'), POSMController.getAllRequests);
router.put('/:id/status', authenticateToken, requireRole('admin'), requirePermission('posm', 'write'), POSMController.updateRequest);

// Shared/General Routes
router.post('/', authenticateToken, requireRole('vendor'), handleUpload, POSMController.submitRequest);
router.get('/', authenticateToken, requireRole('vendor'), POSMController.getFranchiseRequests);
router.get('/:id', authenticateToken, POSMController.getTicketDetails);
router.post('/:id/messages', authenticateToken, requireRole(['vendor', 'admin']), requirePermission('posm', 'write'), handleUpload, POSMController.sendMessage);

export default router;
