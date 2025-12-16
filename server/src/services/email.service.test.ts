import { EmailService } from './email.service';
import { transporter } from '../config/email';

// Mock dependency
jest.mock('../config/email', () => ({
    transporter: {
        sendMail: jest.fn(),
    },
}));

describe('EmailService', () => {
    const mockSendMail = transporter.sendMail as jest.Mock;

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendOTP', () => {
        it('should send email with correct subject and OTP', async () => {
            const email = 'test@example.com';
            const name = 'Test User';
            const otp = '123456';

            await EmailService.sendOTP(email, name, otp);

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: 'Your OTP for Warranty Portal Login',
                    html: expect.stringContaining(otp),
                })
            );
        });
    });

    describe('sendVendorVerificationRequest', () => {
        it('should send verification email to admin', async () => {
            const vendorEmail = 'vendor@example.com';
            const token = 'verify-token-123';

            await EmailService.sendVendorVerificationRequest(vendorEmail, 'Vendor Store', '1234567890', 'user-id', token);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Verification Required'),
                    html: expect.stringContaining(token)
                })
            );
        });
    });

    describe('sendWarrantyConfirmation', () => {
        it('should send confirmation email with generic product details', async () => {
            const email = 'cust@example.com';

            await EmailService.sendWarrantyConfirmation(email, 'Customer', 'UID-123', 'generic-product');

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: 'Warranty Registration Confirmation',
                    html: expect.stringContaining('generic-product')
                })
            );
        });

        it('should include UID for seat-cover', async () => {
            const email = 'cust@example.com';

            await EmailService.sendWarrantyConfirmation(email, 'Customer', 'UID-123', 'seat-cover');

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('UID:</strong> UID-123')
                })
            );
        });
    });
});
