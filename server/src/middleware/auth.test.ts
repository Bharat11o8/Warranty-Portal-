import { authenticateToken, requireRole, AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('authenticateToken', () => {
        it('should return 401 if no token is provided', () => {
            authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Access token required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if token is invalid', () => {
            mockReq.headers = { authorization: 'Bearer invalid-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        });

        it('should call next() and attach user if token is valid', () => {
            const mockUser = { id: 'user-1', email: 'test@test.com', role: 'customer' };
            mockReq.headers = { authorization: 'Bearer valid-token' };
            (jwt.verify as jest.Mock).mockReturnValue(mockUser);

            authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toEqual(mockUser);
        });
    });

    describe('requireRole', () => {
        it('should return 403 if user lacks required role', () => {
            mockReq.user = { id: 'user-1', email: 'test@test.com', role: 'customer' };
            const middleware = requireRole('admin');

            middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        });

        it('should call next() if user has required role', () => {
            mockReq.user = { id: 'user-1', email: 'test@test.com', role: 'admin' };
            const middleware = requireRole('admin');

            middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
