import { VendorController } from './vendor.controller';
import { Response } from 'express';
import db from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
    execute: jest.fn(),
}));

jest.mock('../services/email.service', () => ({
    EmailService: {
        sendVendorApprovalConfirmation: jest.fn().mockResolvedValue(undefined),
    }
}));

describe('VendorController', () => {
    let mockReq: any;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const mockDbExecute = db.execute as jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            user: undefined, // Will be set per test
            params: {},
            query: {},
            body: {},
        };
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockReq.user = undefined;

            await VendorController.getProfile(mockReq, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
        });

        it('should return 404 if vendor details not found', async () => {
            mockReq.user = { id: 'vendor-1' };
            mockDbExecute.mockResolvedValueOnce([[]]); // No vendor details

            await VendorController.getProfile(mockReq, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });

    describe('getManpower', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockReq.user = undefined;

            await VendorController.getManpower(mockReq, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
        });
    });
});
