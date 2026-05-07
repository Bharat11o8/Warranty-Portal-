import { Router } from 'express';
import { PublicController } from '../controllers/public.controller.js';
import { ProductController } from '../controllers/product.controller.js';
import { warrantyUpload, attachPublicUrls } from '../config/localUpload.js';

const router = Router();



router.get('/stores', PublicController.getStores);
router.get('/stores/code/:code', PublicController.getStoreByCode);  // QR store lookup
router.get('/stores/:vendorDetailsId/manpower', PublicController.getStoreManpower);
router.get('/products', ProductController.getAllProducts);
router.get('/warranty/check-uniqueness', PublicController.checkUniqueness);
router.get('/warranty/check-uid', PublicController.checkUID);
router.get('/verify-warranty', PublicController.verifyVendorWarranty);
router.get('/reject-warranty', PublicController.rejectVendorWarranty);

// Public warranty submission (QR flow)
router.post('/warranty/submit', warrantyUpload.any(), attachPublicUrls, PublicController.submitPublicWarranty);

export default router;
