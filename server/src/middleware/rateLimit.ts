import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '../config/redis.js';

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

/**
 * The identity these limits are counted against.
 *
 * This used to read `x-forwarded-for` and take the leftmost entry. nginx sets
 * that header with `proxy_add_x_forwarded_for`, which *appends* the real peer
 * to whatever the client sent — so the leftmost value is supplied by the
 * caller. Sending a different one per request gave every request a fresh
 * bucket and disabled auth, OTP-resend and general rate limiting completely.
 *
 * `req.ip` honours Express's `trust proxy` setting (set to 1 in index.ts), so
 * it skips exactly one trusted hop from the right and ignores anything the
 * client prepended.
 *
 * NOTE: `trust proxy` must equal the real number of proxies in front of the
 * app. It is 1 today (nginx only). If a CDN/WAF is ever put in front, raise it
 * to match, or req.ip will read the CDN's hop instead of the client.
 */
const getClientIP = (req: Request): string => {
    return req.ip || req.socket?.remoteAddress || 'unknown';
};

const shouldSkipAuthLimiter = (req: Request): boolean => {
    const path = req.path.toLowerCase();

    // /auth/me is called frequently by session bootstrap and should not consume OTP/login quota.
    if (path === '/me' || path === '/logout') return true;

    // verify-otp and resend-otp each have a better, narrower control of their
    // own, and must not share the 10-per-15-minutes login budget.
    //
    // They used to. A user who mistyped their code a few times drained the
    // shared pot, and then *both* the retry and the "Resend OTP" button
    // returned 429 for the rest of the window — including the resend that the
    // lockout message tells them to use. One person registering and then
    // fumbling a login was enough to hit it.
    //
    // What guards them instead:
    //   verify-otp → the per-user 5-strike counter in OTPService, which burns
    //                the code outright. Stronger than an IP count, and it
    //                cannot be sidestepped by changing IP.
    //   resend-otp → otpResendLimiter (2/min), applied on the route itself.
    //                This is the real choke point: only one code is ever live
    //                per user, so guesses are capped at 5 per code issued, and
    //                every code issued sends the owner a WhatsApp.
    //
    // /login and /register still take the shared budget — those mint codes and
    // send messages, so they are the ones worth limiting by IP.
    if (path === '/verify-otp' || path === '/resend-otp') return true;

    return false;
};

// Helper to create Redis middleware
const createRedisLimiter = (limiter: Ratelimit | null, errorCode: string, errorMessage: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip in test environment
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        if (errorCode === 'RATE_LIMIT_EXCEEDED' && shouldSkipAuthLimiter(req)) {
            return next();
        }

        // If Redis is not configured, skip rate limiting (fallback handled below)
        if (!limiter) {
            return next();
        }

        try {
            const ip = getClientIP(req);
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
        skip: (req: Request) => process.env.NODE_ENV === 'test' || shouldSkipAuthLimiter(req)
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
        legacyHeaders: false
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
        skip: (req: Request) => process.env.NODE_ENV === 'test'
    });
