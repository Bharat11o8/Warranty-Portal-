import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import GrievanceController from '../controllers/grievance.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Cloudinary storage for grievance attachments
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'grievances',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto', // Allows PDFs to upload properly
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
        files: 3 // Max 3 attachments
    }
});

// Error handling wrapper for multer
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    upload.array('attachments', 3)(req, res, (err: any) => {
        if (err) {
            console.error('Multer/Cloudinary upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'File upload failed'
            });
        }
        next();
    });
};

// Customer routes
router.post('/', authenticateToken, handleUpload, GrievanceController.submitGrievance);
router.get('/', authenticateToken, GrievanceController.getMyGrievances);
router.put('/:id/rating', authenticateToken, GrievanceController.addRating);

// Vendor routes
router.get('/vendor', authenticateToken, GrievanceController.getVendorGrievances);

// Franchise grievance routes (for vendors to submit their own grievances)
router.post('/franchise', authenticateToken, handleUpload, GrievanceController.submitFranchiseGrievance);
router.get('/franchise/submitted', authenticateToken, GrievanceController.getFranchiseSubmittedGrievances);

// Admin routes
router.get('/admin', authenticateToken, GrievanceController.getAllGrievances);

// Shared routes (Vendor/Admin)
router.get('/:id', authenticateToken, GrievanceController.getGrievanceById);
router.put('/:id/status', authenticateToken, GrievanceController.updateStatus);
router.put('/:id/assign', authenticateToken, GrievanceController.assignGrievance);
router.put('/:id/admin-update', authenticateToken, GrievanceController.adminUpdateGrievance); // New route
router.put('/:id/remarks', authenticateToken, GrievanceController.addRemarks);
router.post('/:id/send-assignment-email', authenticateToken, GrievanceController.sendAssignmentEmail);
router.get('/:id/remarks', authenticateToken, GrievanceController.getRemarks);
router.get('/:id/assignments', authenticateToken, GrievanceController.getAssignmentHistory);

export default router;
