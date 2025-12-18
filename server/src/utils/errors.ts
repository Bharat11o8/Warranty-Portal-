/**
 * Standardized Error Classes
 * Provides structured error handling with codes for frontend consumption
 */

export enum ErrorCode {
    // Authentication Errors (1xxx)
    UNAUTHORIZED = 'AUTH_001',
    INVALID_TOKEN = 'AUTH_002',
    TOKEN_EXPIRED = 'AUTH_003',
    INVALID_OTP = 'AUTH_004',
    OTP_EXPIRED = 'AUTH_005',
    INSUFFICIENT_PERMISSIONS = 'AUTH_006',

    // Validation Errors (2xxx)
    VALIDATION_ERROR = 'VAL_001',
    MISSING_REQUIRED_FIELD = 'VAL_002',
    INVALID_FORMAT = 'VAL_003',
    DUPLICATE_ENTRY = 'VAL_004',

    // Resource Errors (3xxx)
    NOT_FOUND = 'RES_001',
    ALREADY_EXISTS = 'RES_002',
    CONFLICT = 'RES_003',

    // Rate Limiting (4xxx)
    RATE_LIMIT_EXCEEDED = 'RATE_001',
    OTP_RESEND_LIMIT = 'RATE_002',

    // Server Errors (5xxx)
    INTERNAL_ERROR = 'SRV_001',
    DATABASE_ERROR = 'SRV_002',
    EMAIL_ERROR = 'SRV_003',
    EXTERNAL_SERVICE_ERROR = 'SRV_004',
}

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: Record<string, any>;
    public readonly isOperational: boolean;

    constructor(
        code: ErrorCode,
        message: string,
        statusCode: number = 500,
        details?: Record<string, any>
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Used to distinguish operational errors from programming errors

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            ...(this.details && { details: this.details }),
        };
    }
}

// Convenience factory functions for common errors
export const Errors = {
    unauthorized: (message = 'Authentication required') =>
        new AppError(ErrorCode.UNAUTHORIZED, message, 401),

    invalidToken: (message = 'Invalid or expired token') =>
        new AppError(ErrorCode.INVALID_TOKEN, message, 401),

    invalidOTP: (message = 'Invalid or expired OTP') =>
        new AppError(ErrorCode.INVALID_OTP, message, 401),

    forbidden: (message = 'Insufficient permissions') =>
        new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403),

    notFound: (resource = 'Resource') =>
        new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

    alreadyExists: (resource = 'Resource') =>
        new AppError(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409),

    validation: (message: string, details?: Record<string, any>) =>
        new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

    missingField: (fieldName: string) =>
        new AppError(ErrorCode.MISSING_REQUIRED_FIELD, `${fieldName} is required`, 400),

    invalidFormat: (fieldName: string, expected?: string) =>
        new AppError(
            ErrorCode.INVALID_FORMAT,
            expected ? `${fieldName} must be ${expected}` : `Invalid ${fieldName} format`,
            400
        ),

    duplicate: (fieldName: string) =>
        new AppError(ErrorCode.DUPLICATE_ENTRY, `${fieldName} already registered`, 409),

    rateLimited: (message = 'Too many requests. Please try again later.') =>
        new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

    internal: (message = 'Internal server error') =>
        new AppError(ErrorCode.INTERNAL_ERROR, message, 500),

    database: (operation: string) =>
        new AppError(ErrorCode.DATABASE_ERROR, `Database error during ${operation}`, 500),

    email: (message = 'Failed to send email') =>
        new AppError(ErrorCode.EMAIL_ERROR, message, 500),
};
