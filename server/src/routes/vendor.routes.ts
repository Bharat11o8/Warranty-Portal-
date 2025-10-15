import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';

const router = Router();

router.get('/verify', VendorController.verifyVendor);

export default router;