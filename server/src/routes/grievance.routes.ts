import { Router, Request, Response, NextFunction } from 'express';
import GrievanceController from '../controllers/grievance.controller.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';
import { grievanceUpload, attachPublicUrls } from '../config/localUpload.js';

const router = Router();

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    grievanceUpload.array('attachments', 3)(req, res, (err: any) => {
        if (err) {
            console.error('Grievance upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'File upload failed'
            });
        }
        attachPublicUrls(req, res, next);
    });
};

// Customer routes
router.post('/', authenticateToken, requireRole('customer'), handleUpload, GrievanceController.submitGrievance);
router.get('/', authenticateToken, requireRole('customer'), GrievanceController.getMyGrievances);
router.put('/:id/rating', authenticateToken, requireRole('customer'), GrievanceController.addRating);

// Vendor routes
router.get('/vendor', authenticateToken, requireRole('vendor'), GrievanceController.getVendorGrievances);

// Franchise grievance routes (for vendors to submit their own grievances)
router.post('/franchise', authenticateToken, requireRole('vendor'), handleUpload, GrievanceController.submitFranchiseGrievance);
router.get('/franchise/submitted', authenticateToken, requireRole('vendor'), GrievanceController.getFranchiseSubmittedGrievances);

// Admin routes
router.get('/admin', authenticateToken, requireRole('admin'), requirePermission('grievances', 'read'), GrievanceController.getAllGrievances);

// Shared routes (Vendor/Admin)
router.get('/:id', authenticateToken, GrievanceController.getGrievanceById);
router.put('/:id/status', authenticateToken, requireRole(['vendor', 'admin']), requirePermission('grievances', 'write'), GrievanceController.updateStatus);
router.put('/:id/assign', authenticateToken, requireRole('admin'), requirePermission('grievances', 'write'), GrievanceController.assignGrievance);
router.put('/:id/admin-update', authenticateToken, requireRole('admin'), requirePermission('grievances', 'write'), GrievanceController.adminUpdateGrievance);
router.put('/:id/remarks', authenticateToken, requireRole(['vendor', 'admin']), requirePermission('grievances', 'write'), GrievanceController.addRemarks);
router.post('/:id/send-assignment-email', authenticateToken, requireRole('admin'), requirePermission('grievances', 'write'), GrievanceController.sendAssignmentEmail);
router.get('/:id/remarks', authenticateToken, GrievanceController.getRemarks);
router.get('/:id/assignments', authenticateToken, requireRole('admin'), requirePermission('grievances', 'read'), GrievanceController.getAssignmentHistory);

export default router;
