import { transporter } from '../config/email.js';
import { formatDateIST, formatDateTimeIST } from '../utils/dateUtils.js';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Service for handling all email communications
 * Optimized to reduce duplication and ensure consistent styling
 */
export class EmailService {
    /**
     * HTML escape utility to prevent XSS in email templates
     */
    static escapeHtml(str) {
        if (!str)
            return '';
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
    }
    /**
     * Helper to get the correct application URL based on environment
     * Centralizes the logic for Production vs Localhost
     */
    static getAppUrl() {
        // Priority 1: Explicitly defined FRONTEND_URL
        if (process.env.FRONTEND_URL)
            return process.env.FRONTEND_URL.replace(/\/$/, '');
        // Priority 2: Use known production domain if in production mode
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        if (isProduction) {
            return 'https://warranty.emporiobyautoform.in';
        }
        // Default to APP_URL from env or localhost
        return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    }
    /**
     * Send email with retry and exponential backoff
     * @param emailFn - Async function that sends the email
     * @param context - Description of what email was being sent (for logging)
     * @param retries - Number of retry attempts (default 3)
     * @returns true if email sent successfully, false otherwise
     */
    static async sendWithRetry(emailFn, context, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await emailFn();
                return true; // Success
            }
            catch (error) {
                console.error(`[Email] Attempt ${attempt}/${retries} failed for "${context}":`, error.message);
                if (attempt < retries) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        // All retries failed - alert admin
        console.error(`[Email] All ${retries} attempts failed for "${context}". Alerting admin.`);
        await this.alertAdminOfFailure(context);
        return false;
    }
    /**
     * Alert admin when email delivery fails after all retries
     */
    static async alertAdminOfFailure(context) {
        const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_FROM;
        if (!adminEmail) {
            console.error('[Email] No admin email configured for failure alerts');
            return;
        }
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: adminEmail,
                subject: 'âš ï¸ Email Delivery Failed - Warranty Portal',
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #dc3545;">âš ï¸ Email Delivery Failure Alert</h2>
            <p>An email failed to send after multiple retry attempts:</p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
              <strong>Failed Email:</strong> ${this.escapeHtml(context)}<br>
              <strong>Time:</strong> ${formatDateTimeIST()}<br>
              <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
            </div>
            <p style="color: #666;">Please check the server logs for more details and consider manual follow-up.</p>
          </div>
        `
            });
        }
        catch (alertError) {
            // Even the alert failed - just log it
            console.error('[Email] Failed to send admin alert:', alertError);
        }
    }
    /**
     * Helper to generate consistent HTML email templates
     * Eliminates the need to repeat CSS and layout boilerplate 10+ times
     */
    static getHtmlTemplate({ title, content, headerColorStart = '#FFB400', headerColorEnd = '#FF8C00', footerText = `© ${new Date().getFullYear()} Autoform India. All rights reserved.` }) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${headerColorStart} 0%, ${headerColorEnd} 100%); color: #000000; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px; color: #000000; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
          
          /* Common Component Classes */
          .info-box { background: white; border-left: 4px solid ${headerColorStart}; padding: 15px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .info-box p { margin: 8px 0; }
          .info-box strong { color: ${headerColorStart}; }
          
          .success-box { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 2px solid #28a745; border-radius: 10px; padding: 25px; margin: 20px 0; text-align: center; }
          .success-box h3 { color: #155724; margin: 0 0 10px 0; font-size: 20px; }
          
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .error-box { background: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px; margin: 20px 0; }
          
          .button { display: inline-block; background: linear-gradient(135deg, ${headerColorStart} 0%, ${headerColorEnd} 100%); color: #000000 !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
          .button:hover { transform: translateY(-1px); box-shadow: 0 6px 8px rgba(0,0,0,0.15); opacity: 0.95; }
          .button-secondary { background: #6c757d; }
          .button-danger { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); }
          
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 13px; }
          
          /* Responsive adjustments */
          @media only screen and (max-width: 600px) {
            .container { padding: 10px; width: 100% !important; }
            .header { padding: 30px 20px; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dmwt4rg4m/image/upload/v1765531503/warranty-portal/autoform-logo.png" alt="Autoform India" style="max-width: 220px; height: auto; margin-bottom: 15px;" />
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>${footerText}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    static async sendOTP(email, name, otp) {
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
      <p>You've requested to login to your Warranty Portal account. Please use the OTP below to complete your login:</p>
      
      <div style="background: #f8f9fa; border: 2px dashed #FFB400; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
        <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your One-Time Password</p>
        <div style="font-size: 36px; font-weight: 800; color: #FFB400; letter-spacing: 8px; margin: 10px 0;">${otp}</div>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 13px;">Valid for 10 minutes</p>
      </div>
      
      <div class="info-box">
        <strong>Important:</strong> Do not share this OTP with anyone. Our team will never ask for your OTP.
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't request this OTP, please ignore this email or contact our support team.</p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await this.sendWithRetry(async () => {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: '🔑 Your OTP for Warranty Portal Login',
                html: this.getHtmlTemplate({
                    title: 'Warranty Portal Login',
                    content: htmlContent,
                    headerColorStart: '#FFB400',
                    headerColorEnd: '#FF8C00'
                })
            });
        }, `OTP to ${email}`);
    }
    static async sendVendorVerificationRequest(vendorEmail, vendorName, vendorPhone, userId, token) {
        const baseUrl = this.getAppUrl();
        // Using Backend API endpoints for verification logic
        const verificationLink = `${baseUrl}/api/vendor/verify?token=${token}`;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Vendor Verification Required</h2>
      <p>A new vendor has registered on the Warranty Portal and requires verification:</p>
      
      <div class="info-box" style="border-left-color: #f5576c;">
        <p><strong>Store Name:</strong> ${vendorName}</p>
        <p><strong>Store Email:</strong> ${vendorEmail}</p>
        <p><strong>Phone:</strong> ${vendorPhone}</p>
        <p><strong>Registration Date:</strong> ${formatDateIST()}</p>
      </div>
      
      <p>Please review this vendor registration and click the button below to approve:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">✓ Verify & Approve Vendor</a>
      </div>
      
      <p style="color: #999; font-size: 12px; margin-top: 20px; word-break: break-all;">Or copy this link: ${verificationLink}</p>
      
      <p style="margin-top: 20px; font-size: 14px;"><strong>Note:</strong> Once verified, the vendor will receive an email notification with login instructions.</p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_FROM, // Send to admin/marketing
            subject: 'New Vendor Registration - Verification Required',
            html: this.getHtmlTemplate({
                title: 'ðŸª New Vendor Registration',
                content: htmlContent,
                headerColorStart: '#f093fb',
                headerColorEnd: '#f5576c'
            })
        });
    }
    static async sendVendorApprovalConfirmation(vendorEmail, vendorName) {
        // Assuming Frontend URL is same as App URL for login page, or explicitly defined
        const baseUrl = EmailService.getAppUrl();
        const loginLink = `${baseUrl}/login?role=vendor`;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <div class="success-box">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h3>Your vendor account has been verified and approved!</h3>
        <p style="color: #155724; margin: 5px 0 0 0;">Welcome to Autoform India</p>
      </div>
      
      <p>Congratulations! Your vendor registration has been reviewed and approved by our team. You now have full access to all vendor features on the Warranty Portal.</p>
      
      <div class="info-box" style="border-left-color: #38ef7d;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #11998e;">📋 What You Can Do Now:</p>
        <ul style="padding-left: 20px; margin: 0;">
          <li>Login to your vendor dashboard</li>
          <li>Manage warranty registrations</li>
          <li>View and process customer warranties</li>
          <li>Access analytics and reports</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" class="button" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">ðŸ” Login to Your Account</a>
      </div>

      <div class="warning-box">
        <strong>ðŸ“ Note:</strong> You'll need to enter your registered email and verify via OTP to access your account securely.
      </div>
      
      <p style="margin-top: 30px;">If you have any questions, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #11998e;">${process.env.EMAIL_FROM}</a>.</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: '🎉 Your Vendor Account Has Been Approved!',
            html: this.getHtmlTemplate({
                title: '✅ Account Approved!',
                content: htmlContent,
                headerColorStart: '#11998e',
                headerColorEnd: '#38ef7d'
            })
        });
    }
    static async sendVendorRejectionNotification(vendorEmail, vendorName, rejectionReason) {
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <div class="warning-box">
        <h3 style="color: #856404; margin: 0 0 5px 0;">📋 Vendor Application Update</h3>
        <p style="margin: 0;">Thank you for your interest in becoming a vendor partner with Autoform India Warranty Portal.</p>
      </div>
      
      <p>After careful review of your application, we regret to inform you that we are unable to approve your vendor account at this time.</p>
      
      ${rejectionReason ? `
      <div class="error-box" style="border-color: #ff4b2b;">
        <p style="margin: 0 0 5px 0; color: #d32f2f;"><strong>Reason for Decision:</strong></p>
        <p style="margin: 0; color: #d32f2f;">${rejectionReason}</p>
      </div>
      ` : ''}
      
      <div class="info-box" style="border-left-color: #ff4b2b;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff4b2b;">📌 What This Means:</p>
        <ul style="padding-left: 20px; margin: 0;">
          <li>Your vendor account registration has not been approved</li>
          <li>You will not be able to access vendor dashboard features</li>
          <li>You may reapply after addressing the concerns mentioned above</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">If you believe this decision was made in error, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'Vendor Application Status Update',
            html: this.getHtmlTemplate({
                title: 'âš ï¸ Application Status Update',
                content: htmlContent,
                headerColorStart: '#ff416c',
                headerColorEnd: '#ff4b2b'
            })
        });
    }
    static async sendWarrantyConfirmation(customerEmail, customerName, uid, productType, productDetails, carMake, carModel) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
      <p>Your warranty registration has been successfully completed!</p>
      
      <div class="info-box">
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Make:</strong> ${carMake || 'N/A'}</p>
        <p><strong>Model:</strong> ${carModel || 'N/A'}</p>
        ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
        ${productType === 'ev-products' ? `
          <p><strong>Serial Number:</strong> ${productDetails?.serialNumber || 'N/A'}</p>
          <p><strong>Vehicle Registration:</strong> ${productDetails?.carRegistration || 'N/A'}</p>
        ` : ''}
        <p><strong>Product:</strong> ${String(productName).replace(/-/g, ' ').toUpperCase()}</p>
        <p><strong>Product Type:</strong> ${productType}</p>
        <p><strong>Registration Date:</strong> ${formatDateIST()}</p>
      </div>
      
      <p>Your warranty is now active. Please keep this email for your records.</p>
      
      <div class="warning-box">
        <strong>Important:</strong> In case of warranty claims, please provide your ${productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'serial number and vehicle registration' : 'warranty details'}.
      </div>
      
      <p>Thank you for choosing our products!</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: 'Warranty Registration Confirmation',
            html: this.getHtmlTemplate({
                title: 'ðŸ›¡ï¸ Warranty Registration Confirmed',
                content: htmlContent,
                headerColorStart: '#667eea',
                headerColorEnd: '#764ba2'
            })
        });
    }
    static async sendWarrantyApprovalToCustomer(customerEmail, customerName, uid, productType, carMake, carModel, productDetails, warrantyType, storeName, storeAddress, storePhone, applicatorName) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
      
      <div class="success-box">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h3>Your warranty has been approved!</h3>
        <p style="color: #155724; margin: 5px 0 0 0;">Your product is now covered under warranty</p>
      </div>
      
      <p>Great news! We're pleased to inform you that your warranty registration has been reviewed and approved by our team.</p>
      
      <div class="info-box" style="border-left-color: #00f2fe;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #0088cc;">📋 Warranty Details:</p>
        ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
        ${productType === 'ev-products' ? `
          <p><strong>Serial Number:</strong> ${productDetails?.serialNumber || 'N/A'}</p>
          <p><strong>Vehicle Registration:</strong> ${productDetails?.carRegistration || 'N/A'}</p>
        ` : ''}
        <p><strong>Product:</strong> ${String(productName).replace(/-/g, ' ').toUpperCase()}</p>
        <p><strong>Product Type:</strong> ${productType}</p>
        <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
        <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
        <p><strong>Approval Date:</strong> ${formatDateIST()}</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACTIVE</span></p>
      </div>
      
      ${storeName ? `
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">ðŸª Store Details:</p>
        <p><strong>Store Name:</strong> ${storeName}</p>
        ${storeAddress ? `<p><strong>Address:</strong> ${storeAddress}</p>` : ''}
        ${storePhone ? `<p><strong>Phone:</strong> ${storePhone}</p>` : ''}
        ${applicatorName ? `<p><strong>Applicator:</strong> ${applicatorName}</p>` : ''}
      </div>
      ` : ''}

      <div class="warning-box">
        <p style="margin: 0 0 5px 0;"><strong>📌 Important Information:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Keep this email for your records</li>
          <li>Your warranty is now active and valid</li>
          <li>Use your ${productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'serial number and vehicle registration' : 'warranty details'} for any warranty claims</li>
        </ul>
      </div>
      
      <p style="margin-top: 30px;">If you have any questions, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: '✅ Your Warranty Has Been Approved!',
            html: this.getHtmlTemplate({
                title: '✅ Warranty Approved!',
                content: htmlContent,
                headerColorStart: '#4facfe',
                headerColorEnd: '#00f2fe'
            })
        });
    }
    static async sendWarrantyRejectionToCustomer(customerEmail, customerName, uid, productType, carMake, carModel, rejectionReason, productDetails, warrantyType, storeName, storeAddress, storePhone, applicatorName) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
      
      <div class="warning-box">
        <h3 style="color: #856404; margin: 0 0 5px 0;">📋 Application Status Update</h3>
        <p style="margin: 0;">We've reviewed your warranty application and need to inform you of an important update.</p>
      </div>
      
      <p>After careful review of your warranty registration, we regret to inform you that we are unable to approve your warranty application at this time.</p>
      
      <div class="info-box" style="border-left-color: #ee5a6f;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #ee5a6f;">Application Details:</p>
        <p><strong>Product:</strong> ${String(productName).replace(/-/g, ' ').toUpperCase()}</p>
        ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
        ${productType === 'ev-products' ? `
          <p><strong>Serial Number:</strong> ${productDetails?.serialNumber || 'N/A'}</p>
          <p><strong>Vehicle Registration:</strong> ${productDetails?.carRegistration || 'N/A'}</p>
        ` : ''}
        <p><strong>Product Type:</strong> ${productType}</p>
        <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
        <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
        <p><strong>Review Date:</strong> ${formatDateIST()}</p>
      </div>
      
      ${storeName ? `
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">ðŸª Store Details:</p>
        <p><strong>Store Name:</strong> ${storeName}</p>
        ${storeAddress ? `<p><strong>Address:</strong> ${storeAddress}</p>` : ''}
      </div>
      ` : ''}

      <div class="error-box" style="border-color: #ff6b6b;">
        <h4 style="margin: 0 0 10px 0; color: #d32f2f;">🔍 Reason for Decision:</h4>
        <p style="margin: 0; color: #d32f2f;">${rejectionReason}</p>
      </div>

      <div class="info-box" style="background: #e3f2fd; border-left-color: #2196f3;">
        <h4 style="margin: 0 0 10px 0; color: #1976d2;">📌 What You Can Do:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Review the reason provided above</li>
          <li>Address the mentioned concerns</li>
          <li>Resubmit your warranty application with corrected information</li>
          <li>Contact our support team if you need clarification</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">If you believe this decision was made in error, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: 'Warranty Application Update - Action Required',
            html: this.getHtmlTemplate({
                title: 'âš ï¸ Application Update',
                content: htmlContent,
                headerColorStart: '#ff6b6b',
                headerColorEnd: '#ee5a6f'
            })
        });
    }
    static async sendWarrantyApprovalToVendor(vendorEmail, vendorName, customerName, customerPhone, productType, carMake, carModel, manpowerName, uid, productDetails, warrantyType, customerAddress) {
        const productNameMapping = {
            'paint-protection': 'Paint Protection Films',
            'sun-protection': 'Sun Protection Films',
            'seat-cover': 'Seat Cover',
            'ev-products': 'EV Products'
        };
        const rawProductName = productDetails?.product || productDetails?.productName || productType;
        const productName = productNameMapping[rawProductName] || rawProductName;
        const idLabel = productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'Serial Number' : 'Registration Number';
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <div class="success-box">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <h3>Great News!</h3>
        <p style="color: #155724; margin: 5px 0 0 0;">A warranty application has been approved for your customer</p>
      </div>
      
      <div class="info-box" style="border-left-color: #38ef7d;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #11998e;">📋 Customer Details:</p>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        ${customerAddress ? `<p><strong>Address:</strong> ${customerAddress}</p>` : ''}
        <p><strong>Product Name:</strong> ${productName}</p>
        <p><strong>Product Type:</strong> ${productType}</p>
        <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
        <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
        <p><strong>${idLabel}:</strong> ${uid}</p>
      </div>
      
      <div class="success-box" style="background: #e8f5e9; border: 2px solid #4caf50;">
        <h4 style="margin: 0 0 10px 0; color: #2e7d32;">👷 Manpower Credit:</h4>
        <p style="margin: 5px 0;"><strong>Installer:</strong> ${manpowerName}</p>
        <p style="margin: 5px 0; color: #2e7d32;">âœ“ This approval has been credited to ${manpowerName}'s performance record</p>
      </div>
      
      <p style="margin-top: 30px;">This successful warranty approval reflects the quality of service provided by your team. Keep up the excellent work!</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: '🎉 Warranty Approved - Customer Application',
            html: this.getHtmlTemplate({
                title: '🎉 Warranty Approved!',
                content: htmlContent,
                headerColorStart: '#11998e',
                headerColorEnd: '#38ef7d'
            })
        });
    }
    static async sendWarrantyRejectionToVendor(vendorEmail, vendorName, customerName, customerPhone, productType, carMake, carModel, manpowerName, uid, rejectionReason, productDetails, warrantyType, customerAddress) {
        const productNameMapping = {
            'paint-protection': 'Paint Protection Films',
            'sun-protection': 'Sun Protection Films',
            'seat-cover': 'Seat Cover',
            'ev-products': 'EV Products'
        };
        const rawProductName = productDetails?.product || productDetails?.productName || productType;
        const productName = productNameMapping[rawProductName] || rawProductName;
        const idLabel = productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'Serial Number' : 'Registration Number';
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <div class="warning-box">
        <h3 style="color: #856404; margin: 0 0 5px 0;">ðŸ“‹ Application Status Update</h3>
        <p style="margin: 0;">A warranty application submitted through your store could not be approved at this time.</p>
      </div>
      
      <div class="info-box" style="border-left-color: #ff9800;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff9800;">Customer Details:</p>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        ${customerAddress ? `<p><strong>Address:</strong> ${customerAddress}</p>` : ''}
        <p><strong>Product Name:</strong> ${productName}</p>
        <p><strong>Product Type:</strong> ${productType}</p>
        <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
        <p><strong>${idLabel}:</strong> ${uid}</p>
        <p><strong>Installer:</strong> ${manpowerName}</p>
      </div>
      
      <div class="error-box" style="border-color: #f44336;">
        <h4 style="margin: 0 0 10px 0; color: #d32f2f;">🔍 Reason for Decision:</h4>
        <p style="margin: 0; color: #d32f2f;">${rejectionReason}</p>
      </div>
      
      <div class="info-box" style="background: #e3f2fd; border-left-color: #2196f3;">
        <h4 style="margin: 0 0 10px 0; color: #1976d2;">📌 Recommended Actions:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Review the rejection reason with your team</li>
          <li>Contact the customer to explain the situation</li>
          <li>Assist the customer in resubmitting with corrected information</li>
        </ul>
      </div>
      
      <p style="margin-top: 30px;">This feedback is provided to help improve the quality of warranty submissions from your store. If you have questions, please contact our support team.</p>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'âš ï¸ Warranty Application Update - Customer Application',
            html: this.getHtmlTemplate({
                title: 'âš ï¸ Warranty Update',
                content: htmlContent,
                headerColorStart: '#ff9800',
                headerColorEnd: '#ff5722'
            })
        });
    }
    static async sendVendorRegistrationConfirmation(vendorEmail, vendorName) {
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <p>Thank you for registering with the Warranty Portal. We have received your application and it is currently under review.</p>
      
      <div class="info-box" style="background: #e3f2fd; border-left-color: #2196f3;">
        <h3 style="color: #1565c0; margin: 0 0 5px 0; font-size: 18px;">⌛ Status: Pending Approval</h3>
        <p style="margin: 0;">Your account is currently waiting for administrator verification. You will not be able to access the vendor dashboard until your account is approved.</p>
      </div>
      
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; background: white;">
        <h3 style="margin-top: 0; color: #444;">What happens next?</h3>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #667eea;">1. Admin Review</strong>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Our team will review your store details and business information.</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #667eea;">2. Verification Decision</strong>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">You will receive an email notification once your account is approved.</p>
        </div>
        
        <div>
          <strong style="color: #667eea;">3. Access Dashboard</strong>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Upon approval, you can login to access the full vendor dashboard features.</p>
        </div>
      </div>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'Registration Received - Pending Approval',
            html: this.getHtmlTemplate({
                title: 'Registration Received',
                content: htmlContent,
                headerColorStart: '#667eea',
                headerColorEnd: '#764ba2'
            })
        });
    }
    static async sendAdminInvitation(adminEmail, adminName, invitedByName) {
        const loginUrl = process.env.FRONTEND_URL || 'https://warranty.emporiobyautoform.in/login?role=admin';
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${adminName},</h2>
      
      <div class="success-box" style="background: linear-gradient(135deg, #e8f4fd 0%, #d4e9f7 100%); border-color: #2d5a87;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h3 style="color: #1e3a5f;">Welcome to the Admin Team!</h3>
        <p style="color: #1e3a5f; margin: 5px 0 0 0;">You have been invited as an Administrator by ${invitedByName}</p>
      </div>
      
      <p>Congratulations! You've been granted administrative access to the Autoform India Warranty Portal.</p>
      
      <div class="info-box" style="border-left-color: #2d5a87;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #2d5a87;">📧 Your Login Credentials:</p>
        <p><strong>Email:</strong> ${adminEmail}</p>
        <p><strong>Authentication:</strong> OTP-based (One-Time Password)</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" class="button" style="background: linear-gradient(135deg, #2d5a87 0%, #1e3a5f 100%);">Access Admin Dashboard</a>
      </div>
      
      <div class="warning-box">
        <strong>ðŸ”’ Security Reminder:</strong> Never share your OTP. Our team will never ask for it. Always access the portal through the official URL.
      </div>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: adminEmail,
            subject: 'ðŸŽ‰ You\'ve Been Invited as an Administrator',
            html: this.getHtmlTemplate({
                title: '🛡️ FMS Admin',
                content: htmlContent,
                headerColorStart: '#1e3a5f',
                headerColorEnd: '#2d5a87'
            })
        });
    }
    static async sendVendorConfirmationEmail(vendorEmail, vendorName, customerName, token, productType, productDetails, carMake, carModel) {
        const baseUrl = this.getAppUrl();
        // Links for actions - these go to backend API endpoints
        const verificationLink = `${baseUrl}/api/public/verify-warranty?token=${token}`;
        const rejectionLink = `${baseUrl}/api/public/reject-warranty?token=${token}`;
        const productName = productDetails?.product || productDetails?.productName || productType;
        const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      <p>A customer has registered a warranty for a product installed at your store. Please verify specific details to proceed.</p>
      
      <div class="info-box" style="border-left-color: #FFB400;">
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Make:</strong> ${carMake || 'N/A'}</p>
        <p><strong>Model:</strong> ${carModel || 'N/A'}</p>
        <p><strong>Product:</strong> ${String(productName).replace(/-/g, ' ').toUpperCase()}</p>
        ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${productDetails?.uid || 'N/A'}</p>` : ''}
        ${productType === 'ev-products' ? `
          <p><strong>Serial Number:</strong> ${productDetails?.serialNumber || 'N/A'}</p>
          <p><strong>Vehicle Reg:</strong> ${productDetails?.carRegistration || 'N/A'}</p>
        ` : ''}
        <p><strong>Date:</strong> ${formatDateIST()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button" style="background: linear-gradient(135deg, #FFB400 0%, #FF9000 100%); margin-right: 15px;">âœ“ Confirm Installation</a>
        
        <p style="margin-top: 20px; font-size: 14px;">
          Is there an issue with this registration?
          <a href="${rejectionLink}" style="color: #dc3545;">Reject Claim</a>
        </p>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center;">can't click the button? Copy this link: ${verificationLink}</p>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'Action Required: Confirm Customer Warranty Registration',
            html: this.getHtmlTemplate({
                title: 'ðŸ›¡ï¸ Warranty Verification Required',
                content: htmlContent,
                headerColorStart: '#FFB400',
                headerColorEnd: '#FF9000'
            })
        });
    }
    /**
     * Send grievance assignment email to external assignee
     */
    static async sendGrievanceAssignmentEmail(assigneeEmail, assigneeName, grievance, remarks, updateToken) {
        const categoryDisplay = EmailService.getCategoryDisplay(grievance.category);
        const submissionDate = new Date(grievance.created_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const baseUrl = EmailService.getAppUrl();
        const actionLink = updateToken
            ? `${baseUrl}/grievance/assignment/${updateToken}`
            : `${baseUrl}/login`;
        // Process attachments
        let attachmentsHtml = '';
        try {
            if (grievance.attachments) {
                const files = JSON.parse(grievance.attachments);
                if (Array.isArray(files) && files.length > 0) {
                    attachmentsHtml = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
              <p style="font-weight: 600; margin-bottom: 5px; color: #555;">ðŸ“Ž Attachments:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${files.map((url, idx) => `<li><a href="${url}" target="_blank" style="color: #2196F3;">View Attachment ${idx + 1}</a></li>`).join('')}
              </ul>
            </div>
          `;
                }
            }
        }
        catch (e) { /* ignore parse error */ }
        const htmlContent = `
      <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${EmailService.escapeHtml(assigneeName)}</strong>,</p>
      
      <div class="info-box" style="border-left-color: #2196F3; background: #e3f2fd;">
        <h3 style="color: #0d47a1; margin: 0 0 5px 0;">ðŸ“‹ New Task Assigned</h3>
        <p style="margin: 0;">You have been assigned a new grievance ticket for resolution.</p>
      </div>
      
      <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
           <span style="font-size: 18px; font-weight: bold; color: #333;">${EmailService.escapeHtml(grievance.ticket_id)}</span>
           <span style="background: #FFB400; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${EmailService.escapeHtml(categoryDisplay)}</span>
        </div>

        <p style="font-weight: bold; margin-bottom: 5px;">Subject:</p>
        <p style="margin-top: 0; color: #555;">${EmailService.escapeHtml(grievance.subject)}</p>
        
        <p style="font-weight: bold; margin-bottom: 5px; margin-top: 15px;">Description:</p>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; color: #555; white-space: pre-wrap;">${EmailService.escapeHtml(grievance.description)}</div>
        
        ${attachmentsHtml}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
         ${grievance.source_type === 'franchise' ? `
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #9333ea; padding-bottom: 5px;">🏪 Franchise (Source)</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Store:</strong> ${EmailService.escapeHtml(grievance.franchise_name || 'N/A')}</p>
            ${grievance.department ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Department:</strong> ${EmailService.escapeHtml(grievance.department.toUpperCase())}</p>` : ''}
            ${grievance.department_details ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Details:</strong> ${EmailService.escapeHtml(grievance.department_details)}</p>` : ''}
            ${grievance.franchise_city ? `<p style="margin: 5px 0; font-size: 14px;"><strong>City:</strong> ${EmailService.escapeHtml(grievance.franchise_city)}</p>` : ''}
         </div>
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #9333ea; padding-bottom: 5px;">ðŸ‘¤ Contact Person</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${EmailService.escapeHtml(grievance.customer_name || 'N/A')}</p>
            ${grievance.customer_email ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${EmailService.escapeHtml(grievance.customer_email)}</p>` : ''}
         </div>
         ` : `
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #FFB400; padding-bottom: 5px;">ðŸ‘¤ Customer (Source)</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${EmailService.escapeHtml(grievance.customer_name || 'N/A')}</p>
            ${grievance.customer_email ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${EmailService.escapeHtml(grievance.customer_email)}</p>` : ''}
         </div>
         ${grievance.franchise_name ? `
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p style="font-weight: bold; margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #FFB400; padding-bottom: 5px;">🏪 Target Franchise</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Store:</strong> ${EmailService.escapeHtml(grievance.franchise_name)}</p>
            ${grievance.franchise_city ? `<p style="margin: 5px 0; font-size: 14px;"><strong>City:</strong> ${EmailService.escapeHtml(grievance.franchise_city)}</p>` : ''}
         </div>
         ` : ''}
         `}
      </div>

      ${remarks ? `
      <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p style="font-weight: bold; margin: 0 0 5px 0; color: #856404;">ðŸ“ Admin Remarks / Instructions:</p>
        <p style="margin: 0; color: #856404;">${EmailService.escapeHtml(remarks)}</p>
      </div>
      ` : ''}

      ${grievance.estimated_completion_date ? `
      <p style="font-weight: bold; color: #d32f2f;">â° Target Date: ${grievance.estimated_completion_date}</p>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionLink}" class="button">View & Update Status</a>
        <p style="font-size: 12px; color: #888; margin-top: 10px;">Token-based secure link (No login required)</p>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        Please enable "Reply-All" if you need to coordinate with the admin team regarding this task.
      </p>
    `;
        return EmailService.sendWithRetry(async () => {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: assigneeEmail,
                subject: `Task Assigned: ${grievance.ticket_id} - ${grievance.subject}`,
                html: EmailService.getHtmlTemplate({
                    title: 'Task Assignment',
                    content: htmlContent,
                    headerColorStart: '#2196F3',
                    headerColorEnd: '#1976D2'
                })
            });
        }, `Grievance assignment email to ${assigneeEmail} for ${grievance.ticket_id}`);
    }
    /**
     * Send confirmation email to customer when grievance is submitted
     */
    static async sendGrievanceConfirmationEmail(customerEmail, customerName, grievance) {
        const categoryLabels = {
            product_issue: 'Product Issue',
            billing_issue: 'Billing Issue',
            store_issue: 'Store/Dealer Issue',
            manpower_issue: 'Manpower Issue',
            service_issue: 'Service Issue',
            warranty_issue: 'Warranty Issue',
            other: 'Other'
        };
        const categoryDisplay = categoryLabels[grievance.category] || grievance.category;
        const submissionDate = new Date(grievance.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const htmlContent = `
      <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${this.escapeHtml(customerName)}</strong>,</p>
      
      <div class="success-box">
        <h3>âœ… Grievance Submitted Successfully</h3>
        <p style="font-size: 14px; margin: 0;">Your concern has been registered with us.</p>
      </div>
      
      <div class="info-box" style="background: #f8f9fa;">
        <p style="font-size: 20px; text-align: center; margin: 0;">
          <strong>Ticket ID:</strong> 
          <span style="color: #FFB400; font-weight: bold; font-size: 22px;">${this.escapeHtml(grievance.ticket_id)}</span>
        </p>
        <p style="text-align: center; font-size: 12px; color: #666; margin-top: 5px;">
          Please save this ID for future reference
        </p>
      </div>
      
      <h3 style="color: #333; border-bottom: 2px solid #FFB400; padding-bottom: 10px; margin-top: 25px;">ðŸ“‹ Submission Details</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666; width: 40%;">Category</td>
          <td style="padding: 12px 0; font-weight: 500;">${this.escapeHtml(categoryDisplay)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Subject</td>
          <td style="padding: 12px 0; font-weight: 500;">${this.escapeHtml(grievance.subject)}</td>
        </tr>
        ${grievance.store_name ? `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Store/Dealer</td>
          <td style="padding: 12px 0; font-weight: 500;">${this.escapeHtml(grievance.store_name)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; color: #666;">Submitted On</td>
          <td style="padding: 12px 0; font-weight: 500;">${submissionDate}</td>
        </tr>
      </table>
      
      <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #2e7d32; margin: 0 0 10px 0;">ðŸ“Œ What happens next?</h4>
        <ul style="margin: 0; padding-left: 20px; color: #333;">
          <li>Our team will review your grievance within <strong>24-48 hours</strong></li>
          <li>You will receive updates via email as we work on your case</li>
          <li>You can track your grievance status in your dashboard</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        If you have any urgent queries, please contact us at <a href="mailto:marketing@autoformindia.com" style="color: #FFB400;">marketing@autoformindia.com</a>
      </p>
      
      <p style="margin-top: 25px; font-size: 14px;">
        Thank you for reaching out to us.<br/>
        <strong>Team Autoform India</strong>
      </p>
    `;
        return this.sendWithRetry(async () => {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: customerEmail,
                subject: `Grievance Registered - ${grievance.ticket_id} | Autoform India`,
                html: this.getHtmlTemplate({
                    title: 'ðŸŽ« Grievance Registered',
                    content: htmlContent,
                    headerColorStart: '#4CAF50',
                    headerColorEnd: '#45a049'
                })
            });
        }, `Grievance confirmation email to ${customerEmail} for ${grievance.ticket_id}`);
    }
    /**
     * Send confirmation email to franchise when they submit a grievance
     */
    static async sendFranchiseGrievanceConfirmationEmail(franchiseEmail, franchiseName, grievance) {
        const categoryDisplay = EmailService.getCategoryDisplay(grievance.category);
        const submissionDate = formatDateTimeIST();
        const departmentDisplay = grievance.department.charAt(0).toUpperCase() + grievance.department.slice(1);
        const targetInfo = grievance.department_details
            ? `${departmentDisplay} - ${EmailService.escapeHtml(grievance.department_details)}`
            : departmentDisplay;
        const htmlContent = `
      <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${EmailService.escapeHtml(franchiseName)}</strong>,</p>
      
      <div class="success-box">
        <h3>âœ… Grievance Submitted Successfully</h3>
        <p style="font-size: 14px; margin: 0;">Your concern has been registered with our team.</p>
      </div>
      
      <div class="info-box" style="background: #f8f9fa;">
        <p style="font-size: 20px; text-align: center; margin: 0;">
          <strong>Ticket ID:</strong> 
          <span style="color: #9333ea; font-weight: bold; font-size: 22px;">${EmailService.escapeHtml(grievance.ticket_id)}</span>
        </p>
        <p style="text-align: center; font-size: 12px; color: #666; margin-top: 5px;">
          Please save this ID for future reference
        </p>
      </div>
      
      <h3 style="color: #333; border-bottom: 2px solid #9333ea; padding-bottom: 10px; margin-top: 25px;">ðŸ“‹ Submission Details</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666; width: 40%;">Department</td>
          <td style="padding: 12px 0; font-weight: 500;">${targetInfo}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Category</td>
          <td style="padding: 12px 0; font-weight: 500;">${EmailService.escapeHtml(categoryDisplay)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Subject</td>
          <td style="padding: 12px 0; font-weight: 500;">${EmailService.escapeHtml(grievance.subject)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666;">Submitted On</td>
          <td style="padding: 12px 0; font-weight: 500;">${submissionDate}</td>
        </tr>
      </table>
      
      <div style="background: #f3e8ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #7c3aed; margin: 0 0 10px 0;">ðŸ“Œ What happens next?</h4>
        <ul style="margin: 0; padding-left: 20px; color: #333;">
          <li>Our team will review your grievance and take appropriate action</li>
          <li>You will receive updates via email as we work on your case</li>
          <li>You can track your grievance status in your Franchise Dashboard</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        If you have any urgent queries, please contact us at <a href="mailto:marketing@autoformindia.com" style="color: #9333ea;">marketing@autoformindia.com</a>
      </p>
      
      <p style="margin-top: 25px; font-size: 14px;">
        Thank you for reaching out to us.<br/>
        <strong>Team Autoform India</strong>
      </p>
    `;
        return EmailService.sendWithRetry(async () => {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: franchiseEmail,
                subject: `Franchise Grievance Registered - ${grievance.ticket_id} | Autoform India`,
                html: EmailService.getHtmlTemplate({
                    title: 'ðŸª Franchise Grievance Registered',
                    content: htmlContent,
                    headerColorStart: '#9333ea',
                    headerColorEnd: '#7c3aed'
                })
            });
        }, `Franchise grievance confirmation email to ${franchiseEmail} for ${grievance.ticket_id}`);
    }
    /**
     * Helper to get display text for category
     */
    static getCategoryDisplay(category) {
        const categories = {
            product_issue: 'Product Issue',
            warranty_issue: 'Warranty Issue',
            logistics_issue: 'Logistics Issue',
            stock_issue: 'Stock Issue',
            software_issue: 'Software/Portal Issue',
            billing_issue: 'Billing Issue',
            store_issue: 'Store/Dealer Issue',
            manpower_issue: 'Manpower Issue',
            service_issue: 'Service Issue',
            other: 'Other'
        };
        return categories[category] || category;
    }
}
