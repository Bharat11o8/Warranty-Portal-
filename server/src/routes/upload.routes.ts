import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configure Cloudinary storage for broadcasts/announcements
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'broadcasts',
        allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'webm'],
        resource_type: 'auto', // Important for video support
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max (videos can be large)
    }
});

// Single file upload endpoint
router.post('/', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileData = req.file as any;
        const fileUrl = fileData.path || fileData.secure_url || fileData.url;

        res.json({
            success: true,
            url: fileUrl,
            format: fileData.format,
            resource_type: fileData.resource_type
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

export default router;
