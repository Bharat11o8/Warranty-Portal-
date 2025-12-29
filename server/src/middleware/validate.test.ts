import { validate } from './validate.js';
import { z } from 'zod'; // Import z directly
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {};
        next = jest.fn();
    });

    it('should call next() if validation passes', () => {
        const schema = z.object({
            name: z.string()
        });

        mockReq.body = { name: 'test' };

        const middleware = validate(schema);
        middleware(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it('should call next(AppError) if validation fails', () => {
        const schema = z.object({
            name: z.string()
        });

        mockReq.body = { name: 123 }; // Invalid type

        const middleware = validate(schema);
        middleware(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('VAL_001'); // Validation Error Code
    });

    it('should transform data during validation', () => {
        const schema = z.object({
            count: z.string().transform(val => parseInt(val, 10))
        });

        mockReq.body = { count: '10' };

        const middleware = validate(schema);
        middleware(mockReq as Request, mockRes as Response, next);

        expect(mockReq.body.count).toBe(10);
        expect(next).toHaveBeenCalledTimes(1);
    });
});
