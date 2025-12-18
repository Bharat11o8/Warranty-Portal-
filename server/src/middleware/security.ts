import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

/**
 * Security headers middleware using Helmet.js
 * Protects against common web vulnerabilities
 */
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing
});

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing and debugging
 */
export interface RequestWithId extends Request {
    requestId: string;
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    (req as RequestWithId).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};

/**
 * Enhanced request logger with request ID
 */
export const enhancedLogger = (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as RequestWithId).requestId || 'no-id';
    const timestamp = new Date().toISOString();

    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_REQUEST_LOGGING === 'true') {
        console.log(`[${timestamp}] [${requestId}] ${req.method} ${req.url}`);

        // Don't log headers in production to avoid leaking sensitive data
        if (process.env.NODE_ENV !== 'production') {
            console.log('Headers:', {
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent'],
                'x-request-id': requestId
            });
        }
    }

    next();
};
