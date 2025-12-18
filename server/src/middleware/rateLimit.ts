import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register, OTP)
 * Limits to prevent brute force attacks and spam
 */
export const authRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'), // 5 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
        }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // keyGenerator removed to use default IP-based limiting with proper IPv6 support
    skip: (req) => {
        // Skip rate limiting in test environment
        return process.env.NODE_ENV === 'test';
    }
});

/**
 * Rate limiter for OTP resend endpoint
 * More restrictive to prevent OTP spam
 */
export const otpResendLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 2, // Only 2 resend requests per minute
    message: {
        success: false,
        error: {
            code: 'OTP_RESEND_LIMIT',
            message: 'Please wait before requesting another OTP.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    // keyGenerator removed to use default IP-based limiting
});

/**
 * General API rate limiter
 * More lenient for normal API usage
 */
export const generalApiLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        success: false,
        error: {
            code: 'API_RATE_LIMIT',
            message: 'Too many requests. Please slow down.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return process.env.NODE_ENV === 'test';
    }
});
