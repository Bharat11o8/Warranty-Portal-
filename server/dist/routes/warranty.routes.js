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
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    },
});
const upload = multer({ storage: storage });
// Use upload.any() to handle multiple files with different field names
router.post('/submit', authenticateToken, upload.any(), WarrantyController.submitWarranty);
router.get('/', authenticateToken, WarrantyController.getWarranties);
router.get('/:uid', authenticateToken, WarrantyController.getWarrantyById);
router.put('/:uid', authenticateToken, upload.any(), WarrantyController.updateWarranty);
export default router;
