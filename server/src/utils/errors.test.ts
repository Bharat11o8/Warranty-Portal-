import { AppError, ErrorCode, Errors } from './errors';

describe('AppError', () => {
    it('should create an instance with correct properties', () => {
        const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', 400, { field: 'test' });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({ field: 'test' });
        expect(error.isOperational).toBe(true);
    });

    it('should have default status code 500', () => {
        const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Internal error');
        expect(error.statusCode).toBe(500);
    });

    it('should serialize to JSON correctly', () => {
        const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', 400, { field: 'test' });
        const json = error.toJSON();

        expect(json).toEqual({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Test error',
            details: { field: 'test' }
        });
    });
});

describe('Errors Factory', () => {
    it('should create unauthorized error', () => {
        const error = Errors.unauthorized();
        expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
        expect(error.statusCode).toBe(401);
    });

    it('should create notFound error', () => {
        const error = Errors.notFound('User');
        expect(error.code).toBe(ErrorCode.NOT_FOUND);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
    });

    it('should create validation error', () => {
        const error = Errors.validation('Invalid input', { foo: 'bar' });
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({ foo: 'bar' });
    });
});
