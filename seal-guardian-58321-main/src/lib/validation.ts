/**
 * Validation utilities for form inputs
 * Using regex patterns for Indian mobile numbers and email addresses
 */

// Indian mobile number: 10 digits, starts with 6, 7, 8, or 9
// Examples: 9876543210, 7890123456
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Standard email regex pattern
// Matches: user@domain.com, user.name@domain.co.in, etc.
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Pincode regex: 6 digits
export const PINCODE_REGEX = /^\d{6}$/;

/**
 * Validate Indian mobile number
 * @param phone - Phone number string (with or without country code)
 * @returns true if valid, false otherwise
 */
export const validateIndianMobile = (phone: string): boolean => {
    // Remove any spaces, dashes, or country code prefix
    const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '').replace(/^0/, '');
    return INDIAN_MOBILE_REGEX.test(cleaned);
};

/**
 * Validate email address
 * @param email - Email string
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate Indian pincode
 * @param pincode - Pincode string
 * @returns true if valid, false otherwise
 */
export const validatePincode = (pincode: string): boolean => {
    return PINCODE_REGEX.test(pincode.trim());
};

/**
 * Format phone number for display (add spaces)
 * @param phone - Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

/**
 * Clean phone number (remove non-digits and country code)
 * @param phone - Phone number to clean
 * @returns Cleaned 10-digit phone number
 */
export const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '').replace(/^91/, '').replace(/^0/, '').slice(0, 10);
};

/**
 * Get validation error message for phone number
 * @param phone - Phone number to validate
 * @returns Error message or empty string if valid
 */
export const getPhoneError = (phone: string): string => {
    if (!phone) return '';
    const cleaned = cleanPhoneNumber(phone);
    if (cleaned.length < 10) return 'Phone number must be 10 digits';
    if (!INDIAN_MOBILE_REGEX.test(cleaned)) return 'Invalid Indian mobile number (must start with 6-9)';
    return '';
};

/**
 * Get validation error message for email
 * @param email - Email to validate
 * @returns Error message or empty string if valid
 */
export const getEmailError = (email: string): string => {
    if (!email) return '';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    return '';
};

/**
 * Get validation error message for pincode
 * @param pincode - Pincode to validate
 * @returns Error message or empty string if valid
 */
export const getPincodeError = (pincode: string): string => {
    if (!pincode) return '';
    if (!PINCODE_REGEX.test(pincode.trim())) return 'Pincode must be 6 digits';
    return '';
};

// Indian Vehicle Registration Number
// Format: XX-00-XX-0000 (with or without hyphens/spaces)
// Examples: DL-01-AB-1234, MH12CD5678, KA 05 MQ 9999
// State Code (2 letters) + RTO Code (2 digits) + Series (1-2 letters) + Number (exactly 4 digits)
export const INDIAN_VEHICLE_REG_REGEX = /^[A-Z]{2}[\s\-]?\d{2}[\s\-]?[A-Z]{1,2}[\s\-]?\d{4}$/i;

/**
 * Validate Indian vehicle registration number
 * @param regNumber - Registration number string
 * @returns true if valid, false otherwise
 */
export const validateVehicleReg = (regNumber: string): boolean => {
    if (!regNumber) return false;
    const cleaned = regNumber.trim().toUpperCase();
    return INDIAN_VEHICLE_REG_REGEX.test(cleaned);
};

/**
 * Format vehicle registration for display (add hyphens)
 * @param regNumber - Raw registration number
 * @returns Formatted registration number
 */
export const formatVehicleReg = (regNumber: string): string => {
    // Remove all spaces and hyphens, uppercase
    const cleaned = regNumber.replace(/[\s\-]/g, '').toUpperCase();
    if (cleaned.length < 4) return cleaned;

    // Format: XX-00-XX-0000
    const match = cleaned.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{1,4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
    }
    return cleaned;
};

/**
 * Get validation error message for vehicle registration
 * @param regNumber - Registration number to validate
 * @returns Error message or empty string if valid
 */
export const getVehicleRegError = (regNumber: string): string => {
    if (!regNumber) return '';
    if (!validateVehicleReg(regNumber)) {
        return 'Invalid format. Use: XX-00-XX-0000 (e.g., DL-01-AB-1234)';
    }
    return '';
};
