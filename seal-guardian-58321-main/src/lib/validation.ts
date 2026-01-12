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

// ============================================
// INDIAN VEHICLE REGISTRATION VALIDATION
// ============================================
// Supports: Standard (4W/2W), BH Series, Temporary, Diplomatic, Defense plates

/**
 * Vehicle registration patterns for all Indian formats
 */
export const VEHICLE_REG_PATTERNS = {
    // Standard format: XX-00-X(X)-0000 (State-RTO-Series-Number)
    // Covers: 4-wheelers (DL-01-AB-1234), 2-wheelers (MH-12-A-123)
    // Also covers old format with 1-digit RTO
    STANDARD: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/,

    // BH (Bharat) Series: National portability format
    // Example: BH-02-AA-1234
    BH_SERIES: /^BH[0-9]{2}[A-Z]{2}[0-9]{4}$/,

    // Temporary Registration: TR followed by numbers
    // Example: TR-0101-12345
    TEMPORARY: /^TR[0-9]{4}[0-9]{4,5}$/,

    // Diplomatic plates: CD (Corps Diplomatique), CC (Consular Corps), UN
    // Example: CD-123, UN-1234
    DIPLOMATIC: /^(CD|CC|UN)[0-9]{3,4}$/,

    // Defense vehicles: 2 digits + 1 letter + 5 digits
    // Example: 01A12345
    DEFENSE: /^[0-9]{2}[A-Z]{1}[0-9]{5}$/
};

/**
 * All regex patterns for validation
 */
const ALL_PATTERNS = Object.values(VEHICLE_REG_PATTERNS);

/**
 * Fancy/VIP number patterns (for detection, not validation)
 */
const FANCY_PATTERNS = [
    /0001$/, /0007$/, /0009$/, /0011$/,  // Single repeats
    /0786$/, /1111$/, /2222$/, /3333$/,  // Religious/repeating
    /4444$/, /5555$/, /6666$/, /7777$/,
    /8888$/, /9999$/, /1234$/, /4321$/,  // Sequential
    /0000$/                               // All zeros
];

/**
 * Normalize vehicle registration (remove spaces, hyphens, uppercase)
 * @param regNumber - Raw registration input
 * @returns Normalized uppercase string
 */
export const normalizeVehicleReg = (regNumber: string): string => {
    if (!regNumber) return '';
    return regNumber.replace(/[\s\-]/g, '').toUpperCase();
};

/**
 * Validate Indian vehicle registration number (all formats)
 * @param regNumber - Registration number string
 * @returns true if valid, false otherwise
 */
export const validateVehicleReg = (regNumber: string): boolean => {
    if (!regNumber) return false;
    const normalized = normalizeVehicleReg(regNumber);
    return ALL_PATTERNS.some(pattern => pattern.test(normalized));
};

/**
 * Get the type of vehicle registration
 * @param regNumber - Registration number string
 * @returns Type string or null if invalid
 */
export const getVehicleRegType = (regNumber: string): string | null => {
    const normalized = normalizeVehicleReg(regNumber);

    if (VEHICLE_REG_PATTERNS.BH_SERIES.test(normalized)) return 'BH_SERIES';
    if (VEHICLE_REG_PATTERNS.TEMPORARY.test(normalized)) return 'TEMPORARY';
    if (VEHICLE_REG_PATTERNS.DIPLOMATIC.test(normalized)) return 'DIPLOMATIC';
    if (VEHICLE_REG_PATTERNS.DEFENSE.test(normalized)) return 'DEFENSE';
    if (VEHICLE_REG_PATTERNS.STANDARD.test(normalized)) return 'STANDARD';

    return null;
};

/**
 * Check if the registration has a fancy/VIP number
 * @param regNumber - Registration number string
 * @returns true if fancy number detected
 */
export const isFancyNumber = (regNumber: string): boolean => {
    const normalized = normalizeVehicleReg(regNumber);
    return FANCY_PATTERNS.some(pattern => pattern.test(normalized));
};

/**
 * Auto-format vehicle registration while typing (adds hyphens)
 * @param input - Current input value
 * @returns Formatted string with hyphens
 */
export const formatVehicleRegLive = (input: string): string => {
    // Remove all non-alphanumeric, uppercase
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // BH series format: BH-00-XX-0000
    if (cleaned.startsWith('BH') && cleaned.length > 2) {
        let result = 'BH';
        const rest = cleaned.slice(2);
        if (rest.length > 0) result += '-' + rest.slice(0, 2);
        if (rest.length > 2) result += '-' + rest.slice(2, 4);
        if (rest.length > 4) result += '-' + rest.slice(4, 8);
        return result;
    }

    // Diplomatic format: CD-0000 / CC-0000 / UN-0000
    if (/^(CD|CC|UN)/.test(cleaned)) {
        const prefix = cleaned.slice(0, 2);
        const num = cleaned.slice(2, 6);
        return num ? `${prefix}-${num}` : prefix;
    }

    // Standard format: XX-00-XXX-0000
    if (cleaned.length <= 2) return cleaned;

    let result = cleaned.slice(0, 2); // State code
    let pos = 2;

    // RTO code (1-2 digits)
    const rtoMatch = cleaned.slice(pos).match(/^(\d{1,2})/);
    if (rtoMatch) {
        result += '-' + rtoMatch[1];
        pos += rtoMatch[1].length;
    }

    // Series letters (1-3 letters)
    const seriesMatch = cleaned.slice(pos).match(/^([A-Z]{1,3})/);
    if (seriesMatch) {
        result += '-' + seriesMatch[1];
        pos += seriesMatch[1].length;
    }

    // Registration number (1-4 digits)
    const numMatch = cleaned.slice(pos).match(/^(\d{1,4})/);
    if (numMatch) {
        result += '-' + numMatch[1];
    }

    return result;
};

/**
 * Format vehicle registration for display (final format with hyphens)
 * @param regNumber - Raw registration number
 * @returns Formatted registration number
 */
export const formatVehicleReg = (regNumber: string): string => {
    const normalized = normalizeVehicleReg(regNumber);
    if (!normalized) return '';

    // Already apply live formatting logic
    return formatVehicleRegLive(normalized);
};

/**
 * Get validation error message for vehicle registration
 * @param regNumber - Registration number to validate
 * @returns Error message or empty string if valid
 */
export const getVehicleRegError = (regNumber: string): string => {
    if (!regNumber) return '';

    if (!validateVehicleReg(regNumber)) {
        return 'Invalid format. Examples: DL-01-AB-1234, MH-12-A-123, BH-02-AA-1234';
    }
    return '';
};
