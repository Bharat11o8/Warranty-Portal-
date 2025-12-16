import { AuthController } from './auth.controller';
import { Request, Response } from 'express';
import db from '../config/database';

// Mock all dependencies
jest.mock('../config/database', () => ({
    execute: jest.fn(),
}));

jest.mock('../services/otp.service', () => ({
    OTPService: {
        createOTP: jest.fn().mockResolvedValue('123456'),
        generateOTP: jest.fn().mockReturnValue('123456'),
        verifyOTP: jest.fn().mockResolvedValue(true),
    }
}));

jest.mock('../services/email.service', () => ({
    EmailService: {
        sendOTP: jest.fn().mockResolvedValue(undefined),
    }
}));

describe('AuthController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const mockDbExecute = db.execute as jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {};
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should return 400 if email or role is missing', async () => {
            mockReq.body = { email: 'test@example.com' }; // Missing role
            await AuthController.login(mockReq as Request, mockRes as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 401 if user not found', async () => {
            mockReq.body = { email: 'unknown@example.com', role: 'customer' };
            mockDbExecute.mockResolvedValueOnce([[]]); // User not found

            await AuthController.login(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });
    });
});
