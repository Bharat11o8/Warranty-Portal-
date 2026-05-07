import { Router } from 'express';
import { WarrantyController } from '../controllers/warranty.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { warrantyUpload, attachPublicUrls } from '../config/localUpload.js';

const router = Router();



// Use upload.any() to handle multiple files with different field names
router.post('/submit', authenticateToken, warrantyUpload.any(), attachPublicUrls, WarrantyController.submitWarranty);
router.get('/', authenticateToken, WarrantyController.getWarranties);
router.get('/stats', authenticateToken, WarrantyController.getDashboardStats);
router.get('/:uid', authenticateToken, WarrantyController.getWarrantyById);
router.put('/:uid', authenticateToken, warrantyUpload.any(), attachPublicUrls, WarrantyController.updateWarranty);

export default router;