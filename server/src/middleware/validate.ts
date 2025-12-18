import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../utils/errors.js';

/**
 * Request Validation Middleware Factory
 * Creates a middleware that validates request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            // Format Zod errors into a readable structure
            const formattedErrors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            const appError = new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Validation failed',
                400,
                { errors: formattedErrors }
            );

            return next(appError);
        }

        // Replace body with parsed/transformed data
        req.body = result.data;
        next();
    };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const formattedErrors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            const appError = new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Query validation failed',
                400,
                { errors: formattedErrors }
            );

            return next(appError);
        }

        // Note: We don't reassign req.query as it may cause type issues
        next();
    };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            const formattedErrors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            const appError = new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Parameter validation failed',
                400,
                { errors: formattedErrors }
            );

            return next(appError);
        }

        next();
    };
};
