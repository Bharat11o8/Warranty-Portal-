import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import POSMController from '../controllers/posm.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Cloudinary storage for POSM attachments
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'posm_requests',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'xlsx', 'xls', 'mp4'],
        resource_type: 'auto',
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max per file for videos/excel
        files: 5
    }
});

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    upload.array('attachments', 5)(req, res, (err: any) => {
        if (err) {
            console.error('POSM upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'File upload failed'
            });
        }
        next();
    });
};

// Admin Routes
router.get('/admin/all', authenticateToken, POSMController.getAllRequests);
router.put('/:id/status', authenticateToken, POSMController.updateRequest);

// Shared/General Routes
router.post('/', authenticateToken, handleUpload, POSMController.submitRequest);
router.get('/', authenticateToken, POSMController.getFranchiseRequests);
router.get('/:id', authenticateToken, POSMController.getTicketDetails);
router.post('/:id/messages', authenticateToken, handleUpload, POSMController.sendMessage);

export default router;
