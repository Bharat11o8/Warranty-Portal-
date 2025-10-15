import { transporter } from '../config/email';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
  static async sendOTP(email: string, name: string, otp: string): Promise<void> {
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
              
              <p>Best regards,<br>Warranty Portal Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Warranty Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendVendorVerificationRequest(vendorEmail: string, vendorName: string, vendorPhone: string, userId: string, token: string): Promise<void> {
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
                <p><strong>Name:</strong> ${vendorName}</p>
                <p><strong>Email:</strong> ${vendorEmail}</p>
                <p><strong>Phone:</strong> ${vendorPhone}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Please review this vendor registration and click the button below to approve:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Vendor Account</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy this link: ${verificationLink}</p>
              
              <p>Once verified, the vendor will be able to access the platform and manage warranty registrations.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendVendorApprovalConfirmation(vendorEmail: string, vendorName: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: vendorEmail,
      subject: 'Your Vendor Account Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d4edda; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Account Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${vendorName},</h2>
              
              <div class="success-box">
                <h3 style="color: #28a745; margin: 0;">Your vendor account has been verified and approved!</h3>
              </div>
              
              <p>Great news! Your vendor registration has been reviewed and approved by our team. You can now access all vendor features on the Warranty Portal.</p>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Login to your account using your credentials</li>
                <li>Complete your vendor profile</li>
                <li>Start managing warranty registrations</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>Warranty Portal Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendWarrantyConfirmation(customerEmail: string, customerName: string, registrationNumber: string, productType: string): Promise<void> {
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
                <p><strong>Registration Number:</strong> ${registrationNumber}</p>
                <p><strong>Product Type:</strong> ${productType}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your warranty is now active. Please keep this email for your records.</p>
              
              <p><strong>Important:</strong> In case of warranty claims, please provide your registration number.</p>
              
              <p>Thank you for choosing our products!</p>
              
              <p>Best regards,<br>Warranty Portal Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}