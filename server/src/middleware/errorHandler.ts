import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { RequestWithId } from './security.js';

/**
 * Global Error Handler Middleware
 * Converts all errors into standardized API responses
 */
export const globalErrorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = (req as RequestWithId).requestId || 'unknown';
    const isProduction = process.env.NODE_ENV === 'production';

    // Log error for debugging
    if (!isProduction) {
        console.error(`[${requestId}] Error:`, err);
    } else {
        // In production, log minimal info
        console.error(`[${requestId}] ${err.message}`);
    }

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details && { details: err.details }),
            },
            requestId,
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_002',
                message: 'Invalid token',
            },
            requestId,
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_003',
                message: 'Token expired',
            },
            requestId,
        });
    }

    // Handle MySQL errors
    if ((err as any).code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'VAL_004',
                message: 'Duplicate entry. This record already exists.',
            },
            requestId,
        });
    }

    if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VAL_001',
                message: 'Referenced record not found.',
            },
            requestId,
        });
    }

    // Handle syntax/parse errors
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VAL_001',
                message: 'Invalid JSON in request body',
            },
            requestId,
        });
    }

    // Default: Internal Server Error
    return res.status(500).json({
        success: false,
        error: {
            code: 'SRV_001',
            message: isProduction ? 'Internal server error' : err.message,
            ...(!isProduction && { stack: err.stack }),
        },
        requestId,
    });
};

/**
 * 404 Handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
    const requestId = (req as RequestWithId).requestId || 'unknown';

    res.status(404).json({
        success: false,
        error: {
            code: 'RES_001',
            message: `Route ${req.method} ${req.path} not found`,
        },
        requestId,
    });
};
