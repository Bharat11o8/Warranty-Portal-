import { transporter } from '../config/email.js';
import dotenv from 'dotenv';
dotenv.config();
export class EmailService {
    static async sendOTP(email, name, otp) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Your OTP for Warranty Portal Login',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Warranty Portal</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You've requested to login to your Warranty Portal account. Please use the OTP below to complete your login:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666;">Your One-Time Password</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">Valid for 10 minutes</p>
              </div>
              
              <p><strong>Important:</strong> Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
              
              <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
              
              <p>Best regards,<br>Autoform India Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Autoform India. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendVendorVerificationRequest(vendorEmail, vendorName, vendorPhone, userId, token) {
        const verificationLink = `${process.env.APP_URL}/api/vendor/verify?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_FROM, // Send to marketing@autoformindia.com
            subject: 'New Vendor Registration - Verification Required',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏪 New Vendor Registration</h1>
            </div>
            <div class="content">
              <h2>Vendor Verification Required</h2>
              <p>A new vendor has registered on the Warranty Portal and requires verification:</p>
              
              <div class="info-box">
                <p><strong>Store Name:</strong> ${vendorName}</p>
                <p><strong>Store Email:</strong> ${vendorEmail}</p>
                <p><strong>Phone:</strong> ${vendorPhone}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Please review this vendor registration and click the button below to approve:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">✓ Verify & Approve Vendor</a>
              </div>
              
              <p style="color: #666; font-size: 14px; word-break: break-all;">Or copy this link: ${verificationLink}</p>
              
              <p style="margin-top: 20px;"><strong>Note:</strong> Once verified, the vendor will receive an email notification with login instructions.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendVendorApprovalConfirmation(vendorEmail, vendorName) {
        const loginLink = `${process.env.FRONTEND_URL}/login?role=vendor`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: '🎉 Your Vendor Account Has Been Approved!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .success-box { 
              background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
              border: 2px solid #28a745; 
              border-radius: 10px; 
              padding: 25px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .success-box h3 {
              color: #155724;
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            .info-list {
              background: white;
              border-left: 4px solid #38ef7d;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-list ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .note {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Account Approved!</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
              
              <div class="success-box">
                <div class="success-icon">🎉</div>
                <h3>Your vendor account has been verified and approved!</h3>
                <p style="color: #155724; margin: 5px 0 0 0;">Welcome to Autoform India</p>
              </div>
              
              <p>Congratulations! Your vendor registration has been reviewed and approved by our team. You now have full access to all vendor features on the Warranty Portal.</p>
              
              <div class="info-list">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #11998e;">📋 What You Can Do Now:</p>
                <ul>
                  <li>Login to your vendor dashboard</li>
                  <li>Manage warranty registrations</li>
                  <li>View and process customer warranties</li>
                  <li>Access analytics and reports</li>
                </ul>
              </div>

              <div class="button-container">
                <a href="${loginLink}" class="button">🔐 Login to Your Account</a>
              </div>

              <div class="note">
                <strong>📝 Note:</strong> You'll need to enter your registered email and verify via OTP to access your account securely.
              </div>
              
              <p style="margin-top: 30px;">If you have any questions or need assistance getting started, please don't hesitate to contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #667eea;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p style="margin-top: 20px;">We're excited to have you onboard!</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${vendorEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendVendorRejectionNotification(vendorEmail, vendorName, rejectionReason) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'Vendor Application Status Update',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .notice-box { 
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .notice-box h3 {
              color: #856404;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .reason-box {
              background: white;
              border-left: 4px solid #ff4b2b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-list {
              background: white;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            .info-list ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .support-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Application Status Update</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
              
              <div class="notice-box">
                <h3>📋 Vendor Application Status</h3>
                <p style="margin: 5px 0 0 0;">Thank you for your interest in becoming a vendor partner with Autoform India Warranty Portal.</p>
              </div>
              
              <p>After careful review of your application, we regret to inform you that we are unable to approve your vendor account at this time.</p>
              
              ${rejectionReason ? `
              <div class="reason-box">
                <p style="margin: 0 0 5px 0;"><strong>Reason for Decision:</strong></p>
                <p style="margin: 5px 0 0 0; color: #d32f2f;">${rejectionReason}</p>
              </div>
              ` : ''}
              
              <div class="info-list">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff4b2b;">📌 What This Means:</p>
                <ul>
                  <li>Your vendor account registration has not been approved</li>
                  <li>You will not be able to access vendor dashboard features</li>
                  <li>You may reapply after addressing the concerns mentioned above</li>
                </ul>
              </div>

              <div class="support-box">
                <p style="margin: 0 0 10px 0;"><strong>💡 Need Assistance?</strong></p>
                <p style="margin: 5px 0;">If you believe this decision was made in error or if you have questions about your application, please don't hesitate to contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #2196f3;">${process.env.EMAIL_FROM}</a>.</p>
                <p style="margin: 10px 0 0 0;">We're here to help and would be happy to discuss your application further.</p>
              </div>
              
              <p style="margin-top: 30px;">We appreciate your interest in partnering with us and wish you all the best in your business endeavors.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${vendorEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendWarrantyConfirmation(customerEmail, customerName, uid, productType, productDetails) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: 'Warranty Registration Confirmation',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Warranty Registration Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>Your warranty registration has been successfully completed!</p>
              
              <div class="info-box">
                ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
                ${productType === 'ev-products' && productDetails ? `
                  <p><strong>Lot Number:</strong> ${productDetails.lotNumber || 'N/A'}</p>
                  <p><strong>Roll Number:</strong> ${productDetails.rollNumber || 'N/A'}</p>
                  <p><strong>Vehicle Registration:</strong> ${productDetails.carRegistration || 'N/A'}</p>
                ` : ''}
                <p><strong>Product:</strong> ${productName.replace(/-/g, ' ').toUpperCase()}</p>
                <p><strong>Product Type:</strong> ${productType}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your warranty is now active. Please keep this email for your records.</p>
              
              <p><strong>Important:</strong> In case of warranty claims, please provide your ${productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'lot number, roll number, and vehicle registration' : 'warranty details'}.</p>
              
              <p>Thank you for choosing our products!</p>
              
              <p>Best regards,<br>Autoform India Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendWarrantyApprovalToCustomer(customerEmail, customerName, uid, productType, carMake, carModel, productDetails, warrantyType, storeName, storeAddress, storePhone, applicatorName) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: '✅ Your Warranty Has Been Approved!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .success-box { 
              background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
              border: 2px solid #28a745; 
              border-radius: 10px; 
              padding: 25px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .success-box h3 {
              color: #155724;
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-box { 
              background: white; 
              border-left: 4px solid #4facfe; 
              padding: 20px; 
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box p {
              margin: 8px 0;
            }
            .info-box strong {
              color: #4facfe;
            }
            .important-note {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Warranty Approved!</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
              
              <div class="success-box">
                <div class="success-icon">🎉</div>
                <h3>Your warranty has been approved!</h3>
                <p style="color: #155724; margin: 5px 0 0 0;">Your product is now covered under warranty</p>
              </div>
              
              <p>Great news! We're pleased to inform you that your warranty registration has been reviewed and approved by our team.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #4facfe;">📋 Warranty Details:</p>
                ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
                ${productType === 'ev-products' && productDetails ? `
                  <p><strong>Lot Number:</strong> ${productDetails.lotNumber || 'N/A'}</p>
                  <p><strong>Roll Number:</strong> ${productDetails.rollNumber || 'N/A'}</p>
                  <p><strong>Vehicle Registration:</strong> ${productDetails.carRegistration || 'N/A'}</p>
                ` : ''}
                <p><strong>Product:</strong> ${productName.replace(/-/g, ' ').toUpperCase()}</p>
                <p><strong>Product Type:</strong> ${productType}</p>
                <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
                <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
                <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACTIVE</span></p>
              </div>
              
              ${storeName ? `
              <div class="info-box" style="margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #4facfe;">🏪 Store Details:</p>
                <p><strong>Store Name:</strong> ${storeName}</p>
                ${storeAddress ? `<p><strong>Address:</strong> ${storeAddress}</p>` : ''}
                ${storePhone ? `<p><strong>Phone:</strong> ${storePhone}</p>` : ''}
                ${applicatorName ? `<p><strong>Applicator:</strong> ${applicatorName}</p>` : ''}
              </div>
              ` : ''}

              <div class="important-note">
                <p style="margin: 0 0 10px 0;"><strong>📌 Important Information:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Keep this email for your records</li>
                  <li>Your warranty is now active and valid</li>
                  <li>Use your ${productType === 'seat-cover' ? 'UID' : productType === 'ev-products' ? 'lot number, roll number, and vehicle registration' : 'warranty details'} for any warranty claims</li>
                  <li>Contact support if you have any questions</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions about your warranty coverage, please don't hesitate to contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #4facfe;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>Thank you for choosing Autoform India!</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${customerEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
        `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendWarrantyRejectionToCustomer(customerEmail, customerName, uid, productType, carMake, carModel, rejectionReason, productDetails, warrantyType, storeName, storeAddress, storePhone, applicatorName) {
        const productName = productDetails?.product || productDetails?.productName || productType;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: 'Warranty Application Update - Action Required',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .notice-box { 
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .notice-box h3 {
              color: #856404;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .info-box { 
              background: white; 
              border-left: 4px solid #ff6b6b; 
              padding: 20px; 
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box p {
              margin: 8px 0;
            }
            .reason-box {
              background: #ffe6e6;
              border: 2px solid #ff6b6b;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .reason-box h4 {
              color: #d32f2f;
              margin: 0 0 10px 0;
            }
            .reason-box p {
              color: #c62828;
              margin: 0;
              font-size: 15px;
              line-height: 1.6;
            }
            .action-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .action-box h4 {
              color: #1976d2;
              margin: 0 0 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Warranty Application Update</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
              
              <div class="notice-box">
                <h3>📋 Application Status Update</h3>
                <p style="margin: 5px 0 0 0;">We've reviewed your warranty application and need to inform you of an important update.</p>
              </div>
              
              <p>After careful review of your warranty registration, we regret to inform you that we are unable to approve your warranty application at this time.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff6b6b;">Application Details:</p>
                <p><strong>Product:</strong> ${productName.replace(/-/g, ' ').toUpperCase()}</p>
                ${productType === 'seat-cover' ? `<p><strong>UID:</strong> ${uid}</p>` : ''}
                ${productType === 'ev-products' && productDetails ? `
                  <p><strong>Lot Number:</strong> ${productDetails.lotNumber || 'N/A'}</p>
                  <p><strong>Roll Number:</strong> ${productDetails.rollNumber || 'N/A'}</p>
                  <p><strong>Vehicle Registration:</strong> ${productDetails.carRegistration || 'N/A'}</p>
                ` : ''}
                <p><strong>Product Type:</strong> ${productType}</p>
                <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
                <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
                <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              ${storeName ? `
              <div class="info-box" style="margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff6b6b;">🏪 Store Details:</p>
                <p><strong>Store Name:</strong> ${storeName}</p>
                ${storeAddress ? `<p><strong>Address:</strong> ${storeAddress}</p>` : ''}
                ${storePhone ? `<p><strong>Phone:</strong> ${storePhone}</p>` : ''}
                ${applicatorName ? `<p><strong>Applicator:</strong> ${applicatorName}</p>` : ''}
              </div>
              ` : ''}

              <div class="reason-box">
                <h4>🔍 Reason for Decision:</h4>
                <p>${rejectionReason}</p>
              </div>

              <div class="action-box">
                <h4>📌 What You Can Do:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Review the reason provided above</li>
                  <li>Address the mentioned concerns</li>
                  <li>Resubmit your warranty application with corrected information</li>
                  <li>Contact our support team if you need clarification</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">If you believe this decision was made in error or if you have questions about the rejection reason, please don't hesitate to contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #2196f3;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>We're here to help you get your warranty approved and would be happy to assist you with the resubmission process.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${customerEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendWarrantyApprovalToVendor(vendorEmail, vendorName, customerName, customerPhone, productType, carMake, carModel, manpowerName, uid, productDetails, warrantyType, customerAddress) {
        // Get product name from productDetails
        const productNameMapping = {
            'paint-protection': 'Paint Protection Films',
            'sun-protection': 'Sun Protection Films',
            'seat-cover': 'Seat Cover',
            'ev-products': 'EV Products'
        };
        const rawProductName = productDetails?.product || productDetails?.productName || productType;
        const productName = productNameMapping[rawProductName] || rawProductName;
        // Determine the label for UID based on product type
        const idLabel = productType === 'seat-cover' ? 'UID' : 'Registration Number';
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: '🎉 Warranty Approved - Customer Application',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
              border: 2px solid #28a745;
              border-radius: 10px;
              padding: 25px;
              margin: 20px 0;
              text-align: center;
            }
            .success-box h3 {
              color: #155724;
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-box {
              background: white;
              border-left: 4px solid #38ef7d;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box p {
              margin: 8px 0;
            }
            .info-box strong {
              color: #11998e;
            }
            .highlight-box {
              background: #e8f5e9;
              border: 2px solid #4caf50;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .highlight-box h4 {
              color: #2e7d32;
              margin: 0 0 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Warranty Approved!</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
              
              <div class="success-box">
                <div class="success-icon">✅</div>
                <h3>Great News!</h3>
                <p style="color: #155724; margin: 5px 0 0 0;">A warranty application has been approved for your customer</p>
              </div>
              
              <p>We're pleased to inform you that a warranty registration submitted through your store has been reviewed and approved by our team.</p>
              
              <div class="info-box">
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
              
              <div class="highlight-box">
                <h4>👷 Manpower Credit:</h4>
                <p style="margin: 5px 0;"><strong>Installer:</strong> ${manpowerName}</p>
                <p style="margin: 5px 0; color: #2e7d32;">✓ This approval has been credited to ${manpowerName}'s performance record</p>
              </div>
              
              <p style="margin-top: 30px;">This successful warranty approval reflects the quality of service provided by your team. Keep up the excellent work!</p>
              
              <p>If you have any questions, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #11998e;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${vendorEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendWarrantyRejectionToVendor(vendorEmail, vendorName, customerName, customerPhone, productType, carMake, carModel, manpowerName, uid, rejectionReason, productDetails, warrantyType, customerAddress) {
        // Get product name from productDetails
        const productNameMapping = {
            'paint-protection': 'Paint Protection Films',
            'sun-protection': 'Sun Protection Films',
            'seat-cover': 'Seat Cover',
            'ev-products': 'EV Products'
        };
        const rawProductName = productDetails?.product || productDetails?.productName || productType;
        const productName = productNameMapping[rawProductName] || rawProductName;
        // Determine the label for UID based on product type
        const idLabel = productType === 'seat-cover' ? 'UID' : 'Registration Number';
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: '⚠️ Warranty Application Update - Customer Application',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .notice-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .notice-box h3 {
              color: #856404;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .info-box {
              background: white;
              border-left: 4px solid #ff9800;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box p {
              margin: 8px 0;
            }
            .reason-box {
              background: #ffebee;
              border: 2px solid #f44336;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .reason-box h4 {
              color: #c62828;
              margin: 0 0 10px 0;
            }
            .reason-box p {
              color: #d32f2f;
              margin: 0;
              font-size: 15px;
              line-height: 1.6;
            }
            .action-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .action-box h4 {
              color: #1976d2;
              margin: 0 0 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Warranty Application Update</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
              
              <div class="notice-box">
                <h3>📋 Application Status Update</h3>
                <p style="margin: 5px 0 0 0;">A warranty application submitted through your store has been reviewed.</p>
              </div>
              
              <p>We need to inform you that a warranty registration submitted through your store has been reviewed and unfortunately could not be approved at this time.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #ff9800;">Customer Details:</p>
                <p><strong>Customer Name:</strong> ${customerName}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                ${customerAddress ? `<p><strong>Address:</strong> ${customerAddress}</p>` : ''}
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Product Type:</strong> ${productType}</p>
                <p><strong>Warranty Type:</strong> ${warrantyType || '1 Year'}</p>
                <p><strong>Vehicle:</strong> ${carMake} ${carModel}</p>
                <p><strong>${idLabel}:</strong> ${uid}</p>
                <p><strong>Installer:</strong> ${manpowerName}</p>
              </div>
              
              <div class="reason-box">
                <h4>🔍 Reason for Decision:</h4>
                <p>${rejectionReason}</p>
              </div>
              
              <div class="action-box">
                <h4>📌 Recommended Actions:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Review the rejection reason with your team</li>
                  <li>Contact the customer to explain the situation</li>
                  <li>Address the mentioned concerns</li>
                  <li>Assist the customer in resubmitting with corrected information</li>
                  <li>Ensure future submissions meet all requirements</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">This feedback is provided to help improve the quality of warranty submissions from your store. If you have questions about the rejection reason or need clarification, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #2196f3;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>We appreciate your cooperation and look forward to successful warranty registrations in the future.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${vendorEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendVendorRegistrationConfirmation(vendorEmail, vendorName) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: vendorEmail,
            subject: 'Registration Received - Pending Approval',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .status-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .status-box h3 {
              color: #1565c0;
              margin: 0 0 5px 0;
              font-size: 18px;
            }
            .steps-box {
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .step {
              display: flex;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            .step-icon {
              background: #667eea;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              text-align: center;
              line-height: 24px;
              margin-right: 15px;
              flex-shrink: 0;
              font-size: 14px;
            }
            .step-content h4 {
              margin: 0 0 5px 0;
              color: #333;
            }
            .step-content p {
              margin: 0;
              color: #666;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Received</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorName},</h2>
              
              <p>Thank you for registering with the Warranty Portal. We have received your application and it is currently under review.</p>
              
              <div class="status-box">
                <h3>⏳ Status: Pending Approval</h3>
                <p style="margin: 0;">Your account is currently waiting for administrator verification. You will not be able to access the vendor dashboard until your account is approved.</p>
              </div>
              
              <div class="steps-box">
                <h3 style="margin-top: 0; color: #444;">What happens next?</h3>
                
                <div class="step">
                  <div class="step-icon">1</div>
                  <div class="step-content">
                    <h4>Admin Review</h4>
                    <p>Our team will review your store details and business information.</p>
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-icon">2</div>
                  <div class="step-content">
                    <h4>Verification Decision</h4>
                    <p>You will receive an email notification once your account is approved or if we need more information.</p>
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-icon">3</div>
                  <div class="step-content">
                    <h4>Access Dashboard</h4>
                    <p>Upon approval, you can login to access the full vendor dashboard features.</p>
                  </div>
                </div>
              </div>
              
              <p>If you have any urgent questions about your application, please contact our support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #667eea;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${vendorEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
    static async sendAdminInvitation(adminEmail, adminName, invitedByName) {
        const loginUrl = process.env.APP_URL || 'https://warranty.autoformindia.com';
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: adminEmail,
            subject: '🎉 You\'ve Been Invited as an Administrator - Autoform India Warranty Portal',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .welcome-box {
              background: linear-gradient(135deg, #e8f4fd 0%, #d4e9f7 100%);
              border: 2px solid #2d5a87;
              border-radius: 10px;
              padding: 25px;
              margin: 20px 0;
              text-align: center;
            }
            .welcome-box h3 {
              color: #1e3a5f;
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .welcome-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-box {
              background: white;
              border-left: 4px solid #2d5a87;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box p {
              margin: 8px 0;
            }
            .steps-box {
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .step {
              display: flex;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            .step-number {
              background: #2d5a87;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              text-align: center;
              line-height: 28px;
              margin-right: 15px;
              flex-shrink: 0;
              font-weight: bold;
            }
            .step-content h4 {
              margin: 0 0 5px 0;
              color: #1e3a5f;
            }
            .step-content p {
              margin: 0;
              color: #666;
              font-size: 14px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #2d5a87 0%, #1e3a5f 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .security-box {
              background: #fff8e6;
              border-left: 4px solid #ffc107;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .security-box h4 {
              color: #856404;
              margin: 0 0 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Seal Guardian</h1>
              <p>Warranty Portal Administration</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Hello ${adminName},</h2>
              
              <div class="welcome-box">
                <div class="welcome-icon">🎉</div>
                <h3>Welcome to the Admin Team!</h3>
                <p style="color: #1e3a5f; margin: 5px 0 0 0;">You have been invited as an Administrator by ${invitedByName}</p>
              </div>
              
              <p>Congratulations! You've been granted administrative access to the Autoform India Warranty Portal. As an administrator, you'll have full control over warranty management, vendor verification, and customer oversight.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #2d5a87;">📧 Your Login Credentials:</p>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Authentication:</strong> OTP-based (One-Time Password)</p>
              </div>
              
              <div class="steps-box">
                <h3 style="margin-top: 0; color: #1e3a5f;">🚀 Getting Started</h3>
                
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>Visit the Portal</h4>
                    <p>Go to <a href="${loginUrl}" style="color: #2d5a87;">${loginUrl}</a></p>
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>Enter Your Email</h4>
                    <p>Use the email address: ${adminEmail}</p>
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>Verify with OTP</h4>
                    <p>You'll receive a one-time password on this email. Enter it to access your admin dashboard.</p>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">Access Admin Dashboard</a>
              </div>
              
              <div class="security-box">
                <h4>🔒 Security Reminder</h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li>Never share your OTP with anyone</li>
                  <li>Our team will never ask for your OTP</li>
                  <li>Always access the portal through the official URL</li>
                  <li>Log out after each session on shared devices</li>
                </ul>
              </div>
              
              <p>If you have any questions or need assistance, please contact the support team at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #2d5a87;">${process.env.EMAIL_FROM}</a>.</p>
              
              <p>Best regards,<br><strong>Autoform India Team</strong></p>
              
              <div class="footer">
                <p>© 2025 Autoform India. All rights reserved.</p>
                <p style="margin-top: 10px; color: #999;">
                  This email was sent to ${adminEmail}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
}
