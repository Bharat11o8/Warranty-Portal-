import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

import { DiagnosticController } from '../controllers/diagnostic.controller';

const router = Router();

router.get('/stores', PublicController.getStores);
router.get('/stores/:vendorDetailsId/manpower', PublicController.getStoreManpower);
router.get('/migrate', DiagnosticController.runMigration);
router.get('/check-vendor-schema', PublicController.checkVendorSchema);

export default router;
