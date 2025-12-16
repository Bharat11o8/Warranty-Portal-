import { OTPService } from './otp.service';
import db from '../config/database';
import nodemailer from 'nodemailer';

// Mock database
jest.mock('../config/database', () => ({
    execute: jest.fn(),
}));

// Mock nodemailer - define mock inside factory to avoid hoisting issues
jest.mock('nodemailer', () => {
    const mockSendMail = jest.fn().mockResolvedValue({});
    return {
        createTransport: jest.fn().mockReturnValue({
            sendMail: mockSendMail,
        }),
        __mockSendMail: mockSendMail, // Expose for assertions
    };
});

describe('OTPService', () => {
    const mockDbExecute = db.execute as jest.Mock;
    // Access the exposed mock
    const mockSendMail = (nodemailer as any).__mockSendMail;

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateOTP', () => {
        it('should generate a 6-digit OTP', () => {
            const otp = OTPService.generateOTP();
            expect(otp).toMatch(/^\d{6}$/);
        });
    });

    describe('createOTP', () => {
        it('should generate OTP and save to database', async () => {
            const userId = 'user-123';
            const otp = await OTPService.createOTP(userId);

            expect(otp).toMatch(/^\d{6}$/);
            expect(mockDbExecute).toHaveBeenCalledTimes(1);
            expect(mockDbExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO otp_codes'),
                expect.arrayContaining([expect.any(String), userId, otp, expect.any(Date)])
            );
        });
    });

    describe('verifyOTP', () => {
        it('should return true for valid, unused, and non-expired OTP', async () => {
            mockDbExecute.mockResolvedValueOnce([[{ id: 'otp-id', user_id: 'user-123' }]]);
            mockDbExecute.mockResolvedValueOnce([]);

            const result = await OTPService.verifyOTP('user-123', '123456');

            expect(result).toBe(true);
            expect(mockDbExecute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM otp_codes'),
                ['user-123', '123456']
            );
            expect(mockDbExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE otp_codes'),
                ['otp-id']
            );
        });

        it('should return false if OTP not found or invalid', async () => {
            mockDbExecute.mockResolvedValueOnce([[]]);

            const result = await OTPService.verifyOTP('user-123', 'wrong-otp');

            expect(result).toBe(false);
            expect(mockDbExecute).toHaveBeenCalledTimes(1);
        });
    });

});
