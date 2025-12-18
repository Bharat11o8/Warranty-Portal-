import { Response } from 'express';

/**
 * Standardized API Response Helper
 * Ensures consistent response structure across all endpoints
 */

export interface ApiResponseSuccess<T> {
    success: true;
    data?: T;
    message?: string;
    pagination?: PaginationInfo;
}

export interface ApiResponseError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    requestId?: string;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Send success response
 */
export function sendSuccess<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
): void {
    const response: ApiResponseSuccess<T> = {
        success: true,
        ...(data !== undefined && { data }),
        ...(message && { message })
    };
    res.status(statusCode).json(response);
}

/**
 * Send success response with pagination
 */
export function sendPaginatedSuccess<T>(
    res: Response,
    data: T,
    pagination: { page: number; limit: number; totalCount: number },
    message?: string
): void {
    const totalPages = Math.ceil(pagination.totalCount / pagination.limit);

    const response: ApiResponseSuccess<T> = {
        success: true,
        data,
        pagination: {
            currentPage: pagination.page,
            totalPages,
            totalCount: pagination.totalCount,
            limit: pagination.limit,
            hasNextPage: pagination.page < totalPages,
            hasPrevPage: pagination.page > 1
        },
        ...(message && { message })
    };

    res.status(200).json(response);
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(
    res: Response,
    data?: T,
    message?: string
): void {
    sendSuccess(res, data, message, 201);
}

/**
 * Send error response (for use when not using global error handler)
 */
export function sendError(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string
): void {
    const response: ApiResponseError = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details })
        },
        ...(requestId && { requestId })
    };
    res.status(statusCode).json(response);
}

/**
 * Send not found response
 */
export function sendNotFound(res: Response, resource: string = 'Resource'): void {
    sendError(res, 'RES_001', `${resource} not found`, 404);
}

/**
 * Send unauthorized response
 */
export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): void {
    sendError(res, 'AUTH_001', message, 401);
}

/**
 * Send forbidden response
 */
export function sendForbidden(res: Response, message: string = 'Forbidden'): void {
    sendError(res, 'AUTH_006', message, 403);
}

/**
 * Send validation error response
 */
export function sendValidationError(
    res: Response,
    message: string = 'Validation failed',
    details?: any
): void {
    sendError(res, 'VAL_001', message, 400, details);
}

/**
 * Calculate pagination from page and limit
 */
export function calculatePagination(page: any, limitParam: any): { page: number; limit: number; offset: number } {
    const parsedPage = parseInt(page as string) || 1;
    const limit = parseInt(limitParam as string) || 30;
    const offset = (parsedPage - 1) * limit;

    return { page: parsedPage, limit, offset };
}
