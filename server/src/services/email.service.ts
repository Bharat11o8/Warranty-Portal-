import { transporter } from '../config/email.js';
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
  private static escapeHtml(str: string): string {
    if (!str) return '';
    const htmlEscapes: Record<string, string> = {
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
  private static getAppUrl(): string {
    // Force production URL if running on Vercel or in production mode
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const appUrl = isProduction
      ? (process.env.BACKEND_URL || 'https://server-bharat-maheshwaris-projects.vercel.app')
      : (process.env.APP_URL || 'http://localhost:5173');

    // Remove trailing slash if present
    return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  }

  /**
   * Send email with retry and exponential backoff
   * @param emailFn - Async function that sends the email
   * @param context - Description of what email was being sent (for logging)
   * @param retries - Number of retry attempts (default 3)
   * @returns true if email sent successfully, false otherwise
   */
  private static async sendWithRetry(
    emailFn: () => Promise<void>,
    context: string,
    retries: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await emailFn();
        return true; // Success
      } catch (error: any) {
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
  private static async alertAdminOfFailure(context: string): Promise<void> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_FROM;

    if (!adminEmail) {
      console.error('[Email] No admin email configured for failure alerts');
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: adminEmail,
        subject: '⚠️ Email Delivery Failed - Warranty Portal',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #dc3545;">⚠️ Email Delivery Failure Alert</h2>
            <p>An email failed to send after multiple retry attempts:</p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
              <strong>Failed Email:</strong> ${this.escapeHtml(context)}<br>
              <strong>Time:</strong> ${new Date().toISOString()}<br>
              <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
            </div>
            <p style="color: #666;">Please check the server logs for more details and consider manual follow-up.</p>
          </div>
        `
      });
    } catch (alertError) {
      // Even the alert failed - just log it
      console.error('[Email] Failed to send admin alert:', alertError);
    }
  }

  /**
   * Helper to generate consistent HTML email templates
   * Eliminates the need to repeat CSS and layout boilerplate 10+ times
   */
  private static getHtmlTemplate({
    title,
    content,
    headerColorStart = '#FFB400',
    headerColorEnd = '#FF8C00',
    footerText = `© ${new Date().getFullYear()} Autoform India. All rights reserved.`
  }: {
    title: string;
    content: string;
    headerColorStart?: string;
    headerColorEnd?: string;
    footerText?: string;
  }): string {
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

  static async sendOTP(email: string, name: string, otp: string): Promise<void> {
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

    await this.sendWithRetry(
      async () => {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: '🔐 Your OTP for Warranty Portal Login',
          html: this.getHtmlTemplate({
            title: 'Warranty Portal Login',
            content: htmlContent,
            headerColorStart: '#FFB400',
            headerColorEnd: '#FF8C00'
          })
        });
      },
      `OTP to ${email}`
    );
  }

  static async sendVendorVerificationRequest(vendorEmail: string, vendorName: string, vendorPhone: string, userId: string, token: string): Promise<void> {
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
        <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
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
        title: '🏪 New Vendor Registration',
        content: htmlContent,
        headerColorStart: '#f093fb',
        headerColorEnd: '#f5576c'
      })
    });
  }

  static async sendVendorApprovalConfirmation(vendorEmail: string, vendorName: string): Promise<void> {
    // Assuming Frontend URL is same as App URL for login page, or explicitly defined
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
        <a href="${loginLink}" class="button" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">🔐 Login to Your Account</a>
      </div>

      <div class="warning-box">
        <strong>📝 Note:</strong> You'll need to enter your registered email and verify via OTP to access your account securely.
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

  static async sendVendorRejectionNotification(vendorEmail: string, vendorName: string, rejectionReason?: string): Promise<void> {
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
        title: '⚠️ Application Status Update',
        content: htmlContent,
        headerColorStart: '#ff416c',
        headerColorEnd: '#ff4b2b'
      })
    });
  }

  static async sendWarrantyConfirmation(
    customerEmail: string,
    customerName: string,
    uid: string,
    productType: string,
    productDetails?: any,
    carMake?: string,
    carModel?: string
  ): Promise<void> {
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
        <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
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
        title: '🛡️ Warranty Registration Confirmed',
        content: htmlContent,
        headerColorStart: '#667eea',
        headerColorEnd: '#764ba2'
      })
    });
  }

  static async sendWarrantyApprovalToCustomer(
    customerEmail: string,
    customerName: string,
    uid: string,
    productType: string,
    carMake: string,
    carModel: string,
    productDetails?: any,
    warrantyType?: string,
    storeName?: string,
    storeAddress?: string,
    storePhone?: string,
    applicatorName?: string
  ): Promise<void> {
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
        <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACTIVE</span></p>
      </div>
      
      ${storeName ? `
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">🏪 Store Details:</p>
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

  static async sendWarrantyRejectionToCustomer(
    customerEmail: string,
    customerName: string,
    uid: string,
    productType: string,
    carMake: string,
    carModel: string,
    rejectionReason: string,
    productDetails?: any,
    warrantyType?: string,
    storeName?: string,
    storeAddress?: string,
    storePhone?: string,
    applicatorName?: string
  ): Promise<void> {
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
        <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${storeName ? `
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">🏪 Store Details:</p>
        <p><strong>Store Name:</strong> ${storeName}</p>
        ${storeAddress ? `<p><strong>Address:</strong> ${storeAddress}</p>` : ''}
      </div>
      ` : ''}

      <div class="error-box" style="border-color: #ff6b6b;">
        <h4 style="margin: 0 0 10px 0; color: #d32f2f;">🔍 Reason for Decision:</h4>
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
        title: '⚠️ Application Update',
        content: htmlContent,
        headerColorStart: '#ff6b6b',
        headerColorEnd: '#ee5a6f'
      })
    });
  }

  static async sendWarrantyApprovalToVendor(
    vendorEmail: string,
    vendorName: string,
    customerName: string,
    customerPhone: string,
    productType: string,
    carMake: string,
    carModel: string,
    manpowerName: string,
    uid: string,
    productDetails?: any,
    warrantyType?: string,
    customerAddress?: string
  ): Promise<void> {
    const productNameMapping: Record<string, string> = {
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
        <p style="margin: 5px 0; color: #2e7d32;">✓ This approval has been credited to ${manpowerName}'s performance record</p>
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

  static async sendWarrantyRejectionToVendor(
    vendorEmail: string,
    vendorName: string,
    customerName: string,
    customerPhone: string,
    productType: string,
    carMake: string,
    carModel: string,
    manpowerName: string,
    uid: string,
    rejectionReason: string,
    productDetails?: any,
    warrantyType?: string,
    customerAddress?: string
  ): Promise<void> {
    const productNameMapping: Record<string, string> = {
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
        <h3 style="color: #856404; margin: 0 0 5px 0;">📋 Application Status Update</h3>
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
        <h4 style="margin: 0 0 10px 0; color: #d32f2f;">🔍 Reason for Decision:</h4>
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
      subject: '⚠️ Warranty Application Update - Customer Application',
      html: this.getHtmlTemplate({
        title: '⚠️ Warranty Update',
        content: htmlContent,
        headerColorStart: '#ff9800',
        headerColorEnd: '#ff5722'
      })
    });
  }

  static async sendVendorRegistrationConfirmation(vendorEmail: string, vendorName: string): Promise<void> {
    const htmlContent = `
      <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
      
      <p>Thank you for registering with the Warranty Portal. We have received your application and it is currently under review.</p>
      
      <div class="info-box" style="background: #e3f2fd; border-left-color: #2196f3;">
        <h3 style="color: #1565c0; margin: 0 0 5px 0; font-size: 18px;">⏳ Status: Pending Approval</h3>
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

  static async sendAdminInvitation(
    adminEmail: string,
    adminName: string,
    invitedByName: string
  ): Promise<void> {
    const loginUrl = process.env.FRONTEND_URL || 'https://warranty.autoformindia.com';

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
        <strong>🔒 Security Reminder:</strong> Never share your OTP. Our team will never ask for it. Always access the portal through the official URL.
      </div>
      
      <p>Best regards,<br><strong>Autoform India Team</strong></p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: '🎉 You\'ve Been Invited as an Administrator',
      html: this.getHtmlTemplate({
        title: '🛡️ Seal Guardian',
        content: htmlContent,
        headerColorStart: '#1e3a5f',
        headerColorEnd: '#2d5a87'
      })
    });
  }

  static async sendVendorConfirmationEmail(
    vendorEmail: string,
    vendorName: string,
    customerName: string,
    token: string,
    productType: string,
    productDetails?: any,
    carMake?: string,
    carModel?: string
  ): Promise<void> {
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
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button" style="background: linear-gradient(135deg, #FFB400 0%, #FF9000 100%); margin-right: 15px;">✓ Confirm Installation</a>
        
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
        title: '🛡️ Warranty Verification Required',
        content: htmlContent,
        headerColorStart: '#FFB400',
        headerColorEnd: '#FF9000'
      })
    });
  }

  /**
   * Send grievance assignment email to an external team member
   * Subject: "Customer Grievance - {Category} at {Store}"
   */
  static async sendGrievanceAssignmentEmail(
    assigneeEmail: string,
    assigneeName: string,
    grievance: {
      ticket_id: string;
      category: string;
      sub_category?: string | null;
      subject: string;
      description: string;
      customer_name: string;
      franchise_name?: string | null;
      franchise_address?: string | null;
      franchise_city?: string | null;
      attachments?: string | string[];
      created_at: string;
    },
    remarks?: string
  ): Promise<boolean> {
    // Category display mapping
    const categoryLabels: Record<string, string> = {
      product_issue: 'Product Issue',
      billing_issue: 'Billing Issue',
      store_issue: 'Store/Dealer Issue',
      manpower_issue: 'Manpower Issue',
      service_issue: 'Service Issue',
      warranty_issue: 'Warranty Issue',
      other: 'Other',
    };

    const categoryDisplay = categoryLabels[grievance.category] || grievance.category;
    const storeName = grievance.franchise_name || 'Unknown Store';
    const subject = `Customer Grievance - ${categoryDisplay} at ${storeName}`;

    // Parse attachments
    let attachmentUrls: string[] = [];
    if (grievance.attachments) {
      try {
        attachmentUrls = typeof grievance.attachments === 'string'
          ? JSON.parse(grievance.attachments)
          : grievance.attachments;
      } catch {
        if (typeof grievance.attachments === 'string' && grievance.attachments.startsWith('http')) {
          attachmentUrls = [grievance.attachments];
        }
      }
    }

    const attachmentsHtml = attachmentUrls.length > 0
      ? `
        <div style="margin-top: 20px;">
          <p style="font-weight: 600; margin-bottom: 10px;">📎 Attachments:</p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${attachmentUrls.map((url, i) => `
              <a href="${this.escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #f0f0f0; border-radius: 6px; text-decoration: none; color: #333; font-size: 14px;">
                📄 Attachment ${i + 1}
              </a>
            `).join('')}
          </div>
        </div>
      `
      : '';

    const htmlContent = `
      <p>Hi <strong>${this.escapeHtml(assigneeName)}</strong>,</p>
      <p>You have been assigned to handle the following customer grievance:</p>

      <div class="info-box" style="background: #f8f9fa; border-left: 4px solid #FFB400; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 140px; color: #666;">Ticket ID:</td>
            <td style="padding: 8px 0;"><code style="background: #e9ecef; padding: 2px 8px; border-radius: 4px;">${this.escapeHtml(grievance.ticket_id)}</code></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Category:</td>
            <td style="padding: 8px 0;">${this.escapeHtml(categoryDisplay)}${grievance.sub_category ? ` > ${this.escapeHtml(grievance.sub_category)}` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Customer:</td>
            <td style="padding: 8px 0;">${this.escapeHtml(grievance.customer_name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Store:</td>
            <td style="padding: 8px 0;">
              ${this.escapeHtml(storeName)}
              ${grievance.franchise_address ? `<br><span style="color: #888; font-size: 13px;">${this.escapeHtml(grievance.franchise_address)}</span>` : ''}
              ${grievance.franchise_city ? `<br><span style="color: #888; font-size: 13px;">${this.escapeHtml(grievance.franchise_city)}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Date Submitted:</td>
            <td style="padding: 8px 0;">${new Date(grievance.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 20px;">
        <p style="font-weight: 600; margin-bottom: 10px;">📋 Subject:</p>
        <p style="background: #fff3cd; padding: 12px 16px; border-radius: 6px; margin: 0;">${this.escapeHtml(grievance.subject)}</p>
      </div>

      <div style="margin-top: 20px;">
        <p style="font-weight: 600; margin-bottom: 10px;">📝 Description:</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${this.escapeHtml(grievance.description)}</div>
      </div>

      ${attachmentsHtml}

      ${remarks ? `
      <div style="margin-top: 20px;">
        <p style="font-weight: 600; margin-bottom: 10px;">💬 Remarks from Admin:</p>
        <div style="background: #e8f4fd; padding: 16px; border-radius: 6px; border-left: 4px solid #2196F3; font-size: 14px; line-height: 1.6;">${this.escapeHtml(remarks)}</div>
      </div>
      ` : ''}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">Please review this grievance and take appropriate action. You can contact Noida Office for more details.</p>
      </div>
    `;

    return await this.sendWithRetry(
      async () => {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: assigneeEmail,
          subject: subject,
          html: this.getHtmlTemplate({
            title: '📢 Customer Grievance',
            content: htmlContent,
            headerColorStart: '#FFB400',
            headerColorEnd: '#FF9000'
          })
        });
      },
      `Grievance assignment email to ${assigneeEmail} for ${grievance.ticket_id}`
    );
  }

  /**
   * Send confirmation email to customer when grievance is submitted
   */
  static async sendGrievanceConfirmationEmail(
    customerEmail: string,
    customerName: string,
    grievance: {
      ticket_id: string;
      category: string;
      subject: string;
      description: string;
      store_name?: string;
      created_at: string;
    }
  ): Promise<boolean> {
    const categoryLabels: Record<string, string> = {
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
        <h3>✅ Grievance Submitted Successfully</h3>
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
      
      <h3 style="color: #333; border-bottom: 2px solid #FFB400; padding-bottom: 10px; margin-top: 25px;">📋 Submission Details</h3>
      
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
        <h4 style="color: #2e7d32; margin: 0 0 10px 0;">📌 What happens next?</h4>
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

    return this.sendWithRetry(
      async () => {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: customerEmail,
          subject: `Grievance Registered - ${grievance.ticket_id} | Autoform India`,
          html: this.getHtmlTemplate({
            title: '🎫 Grievance Registered',
            content: htmlContent,
            headerColorStart: '#4CAF50',
            headerColorEnd: '#45a049'
          })
        });
      },
      `Grievance confirmation email to ${customerEmail} for ${grievance.ticket_id}`
    );
  }

  /**
   * Send confirmation email to franchise when they submit a grievance
   */
  static async sendFranchiseGrievanceConfirmationEmail(
    franchiseEmail: string,
    franchiseName: string,
    grievance: {
      ticket_id: string;
      category: string;
      subject: string;
      department: string;
      department_details?: string;
    }
  ): Promise<boolean> {
    const categoryDisplay = EmailService.getCategoryDisplay(grievance.category);
    const submissionDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const departmentDisplay = grievance.department.charAt(0).toUpperCase() + grievance.department.slice(1);
    const targetInfo = grievance.department_details
      ? `${departmentDisplay} - ${EmailService.escapeHtml(grievance.department_details)}`
      : departmentDisplay;

    const htmlContent = `
      <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${EmailService.escapeHtml(franchiseName)}</strong>,</p>
      
      <div class="success-box">
        <h3>✅ Grievance Submitted Successfully</h3>
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
      
      <h3 style="color: #333; border-bottom: 2px solid #9333ea; padding-bottom: 10px; margin-top: 25px;">📋 Submission Details</h3>
      
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
        <h4 style="color: #7c3aed; margin: 0 0 10px 0;">📌 What happens next?</h4>
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

    return EmailService.sendWithRetry(
      async () => {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: franchiseEmail,
          subject: `Franchise Grievance Registered - ${grievance.ticket_id} | Autoform India`,
          html: EmailService.getHtmlTemplate({
            title: '🏪 Franchise Grievance Registered',
            content: htmlContent,
            headerColorStart: '#9333ea',
            headerColorEnd: '#7c3aed'
          })
        });
      },
      `Franchise grievance confirmation email to ${franchiseEmail} for ${grievance.ticket_id}`
    );
  }

  /**
   * Helper to get display text for category
   */
  static getCategoryDisplay(category: string): string {
    const categories: Record<string, string> = {
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
