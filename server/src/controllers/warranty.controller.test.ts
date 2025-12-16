import { WarrantyController } from './warranty.controller';
import { Response } from 'express';
import db from '../config/database';

// Mock EmailService which is imported in warranty.controller
jest.mock('../services/email.service', () => ({
    EmailService: {
        sendWarrantyConfirmation: jest.fn().mockResolvedValue(undefined),
    }
}));

// Mock database
jest.mock('../config/database', () => ({
    execute: jest.fn(),
}));

describe('WarrantyController', () => {
    let mockReq: any;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const mockDbExecute = db.execute as jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            user: { id: 'user-1', role: 'customer', email: 'test@example.com' },
            body: {},
            query: {},
            files: [],
        };
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        jest.clearAllMocks();
    });

    describe('submitWarranty', () => {
        it('should return 400 if required fields are missing', async () => {
            mockReq.body = { productType: 'seat-cover' }; // Missing details
            await WarrantyController.submitWarranty(mockReq, mockRes as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should create warranty successfully for seat-cover', async () => {
            mockReq.body = {
                productType: 'seat-cover',
                productDetails: { uid: 'UID-123' },
                customerName: 'John Doe',
                customerPhone: '9876543210',
                customerAddress: '123 St',
                customerEmail: 'test@example.com',
                carMake: 'Maruti',
                carModel: 'Swift',
                carYear: '2023',
                purchaseDate: '2023-01-01',
                warrantyType: '1 Year'
            };

            mockDbExecute.mockResolvedValueOnce([[]]); // UID check - not found (good)
            mockDbExecute.mockResolvedValueOnce([{ insertId: 1 }]); // Insert warranty

            await WarrantyController.submitWarranty(mockReq, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getWarranties', () => {
        it('should return paginated warranties for customer', async () => {
            mockReq.query = { page: '1', limit: '10' };
            const mockWarranties = [{ id: 'w-1', status: 'pending', product_details: '{}' }];

            mockDbExecute.mockResolvedValueOnce([[{ total: 1 }]]); // Count
            mockDbExecute.mockResolvedValueOnce([mockWarranties]); // Data

            await WarrantyController.getWarranties(mockReq, mockRes as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
            }));
        });
    });
});
