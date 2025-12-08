import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WarrantyController } from '../controllers/warranty.controller';
import { authenticateToken } from '../middleware/auth';
const router = Router();
// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename and prepend timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});
// Use upload.any() to handle multiple files with different field names
router.post('/submit', authenticateToken, upload.any(), WarrantyController.submitWarranty);
router.get('/', authenticateToken, WarrantyController.getWarranties);
router.get('/:uid', authenticateToken, WarrantyController.getWarrantyById);
router.put('/:uid', authenticateToken, upload.any(), WarrantyController.updateWarranty);
export default router;
