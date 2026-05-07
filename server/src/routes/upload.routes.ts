import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastUpload, attachPublicUrls } from '../config/localUpload.js';

const router = Router();



// Single file upload endpoint
router.post('/', authenticateToken, broadcastUpload.single('file'), attachPublicUrls, (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileData = req.file as any;
        const fileUrl = fileData.secure_url || fileData.url || fileData.path;

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
