import { AdminController } from './admin.controller';
import { Request, Response } from 'express';
import db from '../config/database';

// Mock dependencies
jest.mock('../config/database', () => ({
    execute: jest.fn(),
}));

jest.mock('../services/email.service', () => ({
    EmailService: {
        sendVendorApprovalConfirmation: jest.fn().mockResolvedValue(undefined),
        sendVendorRejectionNotification: jest.fn().mockResolvedValue(undefined),
    }
}));

jest.mock('../services/activity-log.service', () => ({
    ActivityLogService: {
        log: jest.fn().mockResolvedValue(undefined),
    }
}));

describe('AdminController', () => {
    let mockReq: any;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const mockDbExecute = db.execute as jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            user: { id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'admin' },
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

    describe('getDashboardStats', () => {
        it('should return dashboard statistics', async () => {
            // Mock all 6 COUNT queries
            mockDbExecute
                .mockResolvedValueOnce([[{ count: 100 }]]) // total warranties
                .mockResolvedValueOnce([[{ count: 10 }]])  // total vendors
                .mockResolvedValueOnce([[{ count: 50 }]])  // total customers
                .mockResolvedValueOnce([[{ count: 5 }]])   // pending
                .mockResolvedValueOnce([[{ count: 80 }]])  // validated
                .mockResolvedValueOnce([[{ count: 15 }]]); // rejected

            await AdminController.getDashboardStats(mockReq, mockRes as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                stats: {
                    totalWarranties: 100,
                    totalVendors: 10,
                    totalCustomers: 50,
                    pendingApprovals: 5,
                    validatedWarranties: 80,
                    rejectedWarranties: 15
                }
            });
        });
    });

    describe('getVendorDetails', () => {
        it('should return 404 if vendor not found', async () => {
            mockReq.params = { id: 'nonexistent-id' };
            mockDbExecute.mockResolvedValueOnce([[]]); // Empty result

            await AdminController.getVendorDetails(mockReq, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Vendor not found' });
        });
    });
});
