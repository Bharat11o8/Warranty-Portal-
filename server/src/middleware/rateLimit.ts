import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// REDIS-BACKED RATE LIMITERS (Serverless-safe)
// ============================================

// Initialize Redis client (only if credentials are available)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Auth rate limiter: 10 requests per 15 minutes per IP
const authLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '15 m'),
        prefix: 'ratelimit:auth',
    })
    : null;

// OTP resend limiter: 2 requests per minute per IP
const otpLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, '1 m'),
        prefix: 'ratelimit:otp',
    })
    : null;

// General API limiter: 100 requests per minute per IP
const apiLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        prefix: 'ratelimit:api',
    })
    : null;

// Helper to extract IP
const getClientIP = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
};

// Helper to create Redis middleware
const createRedisLimiter = (limiter: Ratelimit | null, errorCode: string, errorMessage: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip in test environment or for localhost
        const ip = getClientIP(req);
        if (process.env.NODE_ENV === 'test' || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
            return next();
        }

        // If Redis is not configured, skip rate limiting (fallback handled below)
        if (!limiter) {
            return next();
        }

        try {
            const { success, remaining, reset } = await limiter.limit(ip);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Remaining', remaining.toString());
            res.setHeader('X-RateLimit-Reset', reset.toString());

            if (!success) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage
                    }
                });
            }

            next();
        } catch (error) {
            // If Redis fails, allow the request (fail open)
            console.error('Rate limiter error:', error);
            next();
        }
    };
};

// ============================================
// EXPORTED MIDDLEWARE
// ============================================

/**
 * Rate limiter for authentication endpoints (login, register, OTP)
 * Uses Redis if available, otherwise falls back to in-memory
 */
export const authRateLimiter = redis
    ? createRedisLimiter(authLimiter, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.')
    : rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => {
            const ip = getClientIP(req);
            return process.env.NODE_ENV === 'test' || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
        }
    });

/**
 * Rate limiter for OTP resend endpoint
 * More restrictive to prevent OTP spam
 */
export const otpResendLimiter = redis
    ? createRedisLimiter(otpLimiter, 'OTP_RESEND_LIMIT', 'Please wait before requesting another OTP.')
    : rateLimit({
        windowMs: 60000,
        max: 2,
        message: {
            success: false,
            error: {
                code: 'OTP_RESEND_LIMIT',
                message: 'Please wait before requesting another OTP.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => {
            const ip = getClientIP(req);
            return process.env.NODE_ENV === 'test' || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
        }
    });

/**
 * General API rate limiter
 * More lenient for normal API usage
 */
export const generalApiLimiter = redis
    ? createRedisLimiter(apiLimiter, 'API_RATE_LIMIT', 'Too many requests. Please slow down.')
    : rateLimit({
        windowMs: 60000,
        max: 100,
        message: {
            success: false,
            error: {
                code: 'API_RATE_LIMIT',
                message: 'Too many requests. Please slow down.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => {
            const ip = getClientIP(req);
            return process.env.NODE_ENV === 'test' || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
        }
    });
