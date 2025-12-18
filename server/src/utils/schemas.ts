import { z } from 'zod';

/**
 * Validation Schemas using Zod
 * Provides type-safe request validation with detailed error messages
 */

// Regex patterns (reused from auth.controller.ts)
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PINCODE_REGEX = /^\d{6}$/;

// Common field schemas
export const emailSchema = z.string()
    .min(1, 'Email is required')
    .regex(EMAIL_REGEX, 'Please enter a valid email address');

export const phoneSchema = z.string()
    .min(1, 'Phone number is required')
    .transform(val => val.replace(/[\s\-+]/g, '').replace(/^91/, '').replace(/^0/, ''))
    .refine(val => INDIAN_MOBILE_REGEX.test(val), {
        message: 'Please enter a valid 10-digit Indian mobile number (must start with 6-9)'
    });

export const pincodeSchema = z.string()
    .regex(PINCODE_REGEX, 'Pincode must be 6 digits');

// Manpower schema for vendor registration
export const manpowerSchema = z.object({
    name: z.string().min(1, 'Manpower name is required'),
    phoneNumber: z.string().min(10, 'Manpower phone is required'),
    manpowerId: z.string().min(1, 'Manpower ID is required'),
    applicatorType: z.string().min(1, 'Applicator type is required'),
});

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    phoneNumber: z.string().min(10, 'Phone number is required'),
    role: z.enum(['customer', 'vendor', 'admin']),
    // Vendor-specific fields (optional, but required if role is vendor)
    storeName: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    manpower: z.array(manpowerSchema).optional(),
}).refine(
    data => {
        if (data.role === 'vendor') {
            return data.storeName && data.address && data.state && data.city && data.pincode;
        }
        return true;
    },
    { message: 'All vendor details are required for vendor registration', path: ['storeName'] }
);

export const loginSchema = z.object({
    email: emailSchema,
    role: z.enum(['customer', 'vendor', 'admin']),
});

export const verifyOTPSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOTPSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    phoneNumber: z.string().min(10, 'Phone number is required'),
});

// ===========================================
// WARRANTY SCHEMAS
// ===========================================

export const warrantySubmitSchema = z.object({
    productType: z.enum(['seat-cover', 'ev-products']),
    customerName: z.string().min(2, 'Customer name is required'),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerPhone: z.string().min(10, 'Customer phone is required'),
    customerAddress: z.string().min(5, 'Customer address is required'),
    carMake: z.string().min(1, 'Car make is required'),
    carModel: z.string().min(1, 'Car model is required'),
    carYear: z.string().length(4, 'Car year must be 4 digits'),
    purchaseDate: z.string().min(1, 'Purchase date is required'),
    warrantyType: z.string().min(1, 'Warranty type is required'),
    installerName: z.string().optional(),
    installerContact: z.string().optional(),
    productDetails: z.any(), // Flexible for different product types
    manpowerId: z.string().optional(),
});

// ===========================================
// ADMIN SCHEMAS
// ===========================================

export const updateWarrantyStatusSchema = z.object({
    status: z.enum(['validated', 'rejected']),
    rejectionReason: z.string().optional(),
}).refine(
    data => {
        if (data.status === 'rejected') {
            return data.rejectionReason && data.rejectionReason.length > 0;
        }
        return true;
    },
    { message: 'Rejection reason is required when rejecting a warranty', path: ['rejectionReason'] }
);

export const vendorVerificationSchema = z.object({
    is_verified: z.boolean(),
    rejection_reason: z.string().optional(),
});

export const createAdminSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: emailSchema,
    phone: z.string().min(10, 'Phone number is required'),
});

// Export schema types for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type WarrantySubmitInput = z.infer<typeof warrantySubmitSchema>;
