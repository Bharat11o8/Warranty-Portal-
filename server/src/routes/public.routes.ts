import { Router } from 'express';
import { PublicController } from '../controllers/public.controller.js';
import { ProductController } from '../controllers/product.controller.js'; // Added ProductController import

import { DiagnosticController } from '../controllers/diagnostic.controller.js';

const router = Router();

router.get('/stores', PublicController.getStores);
router.get('/stores/:vendorDetailsId/manpower', PublicController.getStoreManpower);
router.get('/products', ProductController.getAllProducts); // Added route for fetching all products
router.get('/migrate', DiagnosticController.runMigration);
router.get('/check-vendor-schema', PublicController.checkVendorSchema);
router.get('/verify-warranty', PublicController.verifyVendorWarranty);
router.get('/reject-warranty', PublicController.rejectVendorWarranty);

export default router;
