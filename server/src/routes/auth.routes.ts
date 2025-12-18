import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { otpResendLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
    registerSchema,
    loginSchema,
    verifyOTPSchema,
    resendOTPSchema,
    updateProfileSchema
} from '../utils/schemas.js';

const router = Router();

// Apply validation middleware before controllers
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/verify-otp', validate(verifyOTPSchema), AuthController.verifyOTP);
router.post('/resend-otp', otpResendLimiter, validate(resendOTPSchema), AuthController.resendOTP);
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.put('/profile', authenticateToken, validate(updateProfileSchema), AuthController.updateProfile);

export default router;