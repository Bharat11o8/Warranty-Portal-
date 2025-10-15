import { Request, Response } from 'express';
import db from '../config/database';
import { EmailService } from '../services/email.service';

export class VendorController {
  static async verifyVendor(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invalid Token</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1>❌ Invalid Verification Token</h1>
            <p>The verification link is invalid or has expired.</p>
          </body>
          </html>
        `);
      }

      // Find vendor by token
      const [verifications]: any = await db.execute(
        'SELECT * FROM vendor_verification WHERE verification_token = ?',
        [token]
      );

      if (verifications.length === 0) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Token Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1>❌ Verification Token Not Found</h1>
            <p>This verification link is invalid or has already been used.</p>
          </body>
          </html>
        `);
      }

      const verification = verifications[0];

      // Check if already verified
      if (verification.is_verified) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Already Verified</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #ffc107; }
            </style>
          </head>
          <body>
            <h1>⚠️ Already Verified</h1>
            <p>This vendor account has already been verified.</p>
          </body>
          </html>
        `);
      }

      // Update verification status
      await db.execute(
        'UPDATE vendor_verification SET is_verified = TRUE, verified_at = NOW() WHERE verification_token = ?',
        [token]
      );

      // Get vendor details
      const [vendors]: any = await db.execute(
        'SELECT name, email FROM profiles WHERE id = ?',
        [verification.user_id]
      );

      if (vendors.length > 0) {
        // Send confirmation email to vendor
        await EmailService.sendVendorApprovalConfirmation(
          vendors[0].email,
          vendors[0].name
        );
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vendor Verified</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h1 { color: #28a745; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>Vendor Verified Successfully!</h1>
            <p>The vendor account has been approved and activated.</p>
            <p>A confirmation email has been sent to the vendor.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">You can close this window now.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Vendor verification error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>❌ Verification Error</h1>
          <p>An error occurred during verification. Please try again later.</p>
        </body>
        </html>
      `);
    }
  }
}