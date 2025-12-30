import { Router } from 'express';
import multer from 'multer';
import { WarrantyController } from '../controllers/warranty.controller.js';
import { authenticateToken } from '../middleware/auth.js';

import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = Router();

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'warranty-portal',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
        files: 6 // Max 6 files (invoice + 5 photos)
    }
});

// Use upload.any() to handle multiple files with different field names
router.post('/submit', authenticateToken, upload.any(), WarrantyController.submitWarranty);
router.get('/', authenticateToken, WarrantyController.getWarranties);
router.get('/:uid', authenticateToken, WarrantyController.getWarrantyById);
router.put('/:uid', authenticateToken, upload.any(), WarrantyController.updateWarranty);

export default router;