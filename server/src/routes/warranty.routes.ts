import { Router } from 'express';
import { WarrantyController } from '../controllers/warranty.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/submit', authenticateToken, WarrantyController.submitWarranty);
router.get('/', authenticateToken, WarrantyController.getWarranties);
router.get('/:id', authenticateToken, WarrantyController.getWarrantyById);

export default router;