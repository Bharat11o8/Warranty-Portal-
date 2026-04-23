import { Router } from 'express';
import { PublicController } from '../controllers/public.controller.js';
import { ProductController } from '../controllers/product.controller.js'; // Added ProductController import
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Multer storage config for public uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'warranty-portal',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        public_id: (req: any, file: any) => {
            let uid = 'UNKNOWN';
            try {
                if (req.body && req.body.productDetails) {
                    const pd = JSON.parse(req.body.productDetails);
                    uid = pd.uid || pd.serialNumber || 'NO_UID';
                }
            } catch (e) {
                console.warn('Could not parse productDetails for Cloudinary naming');
            }
            const fieldName = file.fieldname || 'upload';
            const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            const timestamp = Date.now();
            return `${uid}_${fieldName}_${originalName}_${timestamp}`;
        }
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
        files: 6 // Max 6 files
    }
});

router.get('/stores', PublicController.getStores);
router.get('/stores/code/:code', PublicController.getStoreByCode);  // QR store lookup
router.get('/stores/:vendorDetailsId/manpower', PublicController.getStoreManpower);
router.get('/products', ProductController.getAllProducts);
router.get('/warranty/check-uniqueness', PublicController.checkUniqueness);
router.get('/warranty/check-uid', PublicController.checkUID);
router.get('/verify-warranty', PublicController.verifyVendorWarranty);
router.get('/reject-warranty', PublicController.rejectVendorWarranty);

// Public warranty submission (QR flow)
router.post('/warranty/submit', upload.any(), PublicController.submitPublicWarranty);

export default router;
