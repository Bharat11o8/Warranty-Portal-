import { Request, Response } from 'express';
import db from '../config/database.js';
import jwt from 'jsonwebtoken';
import { EmailService } from '../services/email.service.js';

export class PublicController {
    static async getStores(req: Request, res: Response) {
        try {
            // Get only approved vendors with their store details
            const [stores]: any = await db.execute(`
        SELECT 
          vd.id as vendor_details_id,
          vd.store_name,
          vd.address,
          vd.city,
          vd.state,
          vd.pincode,
          vd.store_email,
          p.phone_number as phone
        FROM vendor_details vd
        JOIN profiles p ON vd.user_id = p.id
        JOIN vendor_verification vv ON vd.user_id = vv.user_id
        WHERE vv.is_verified = TRUE
        ORDER BY vd.store_name ASC
      `);

            res.json({
                success: true,
                stores
            });
        } catch (error: any) {
            console.error('Get stores error:', error);
            res.status(500).json({ error: 'Failed to fetch stores' });
        }
    }

    static async getStoreManpower(req: Request, res: Response) {
        try {
            const { vendorDetailsId } = req.params;

            if (!vendorDetailsId) {
                return res.status(400).json({ error: 'Vendor details ID is required' });
            }

            const [manpower]: any = await db.execute(
                'SELECT id, name, manpower_id, applicator_type FROM manpower WHERE vendor_id = ? AND is_active = TRUE ORDER BY name ASC',
                [vendorDetailsId]
            );

            res.json({
                success: true,
                manpower
            });
        } catch (error: any) {
            console.error('Get store manpower error:', error);
            res.status(500).json({ error: 'Failed to fetch manpower' });
        }
    }


    static async checkVendorSchema(req: Request, res: Response) {
        try {
            const [columns]: any = await db.execute('SHOW COLUMNS FROM vendor_details');
            res.json({
                success: true,
                columns: columns.map((col: any) => ({
                    field: col.Field,
                    type: col.Type
                }))
            });
        } catch (error: any) {
            console.error('Schema check error:', error);
            res.status(500).json({ error: 'Schema check failed', details: error.message });
        }
    }

    static async verifyVendorWarranty(req: Request, res: Response) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.status(400).send('Invalid verification link');
            }

            // Verify token
            const decoded: any = jwt.verify(token as string, process.env.JWT_SECRET || 'your-secret-key');

            if (!decoded.warrantyId) {
                return res.status(400).send('Invalid token payload');
            }

            // Update warranty status
            await db.execute(
                "UPDATE warranty_registrations SET status = 'pending' WHERE uid = ? AND status = 'pending_vendor'",
                [decoded.warrantyId]
            );

            // Optional: Send success email to Admin or Customer here if needed
            // For now, just show success page

            // Return simple success HTML
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Warranty Confirmed</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
                        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                        h1 { color: #2e7d32; margin-bottom: 10px; }
                        p { color: #555; }
                        .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>✅ Confirmed!</h1>
                        <p>The warranty registration has been successfully confirmed and submitted for admin approval.</p>
                        <p>You can close this window now.</p>
                    </div>
                </body>
                </html>
            `);

        } catch (error: any) {
            console.error('Warranty verification error:', error);
            res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Verification Failed</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #fff0f0; }
                        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                        h1 { color: #d32f2f; margin-bottom: 10px; }
                        p { color: #555; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Verification Failed</h1>
                        <p>The link is invalid or has expired.</p>
                        <p>Error: ${error.message}</p>
                    </div>
                </body>
                </html>
            `);
        }
    }

    static async rejectVendorWarranty(req: Request, res: Response) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.status(400).send('Invalid rejection link');
            }

            // Verify token
            const decoded: any = jwt.verify(token as string, process.env.JWT_SECRET || 'your-secret-key');

            if (!decoded.warrantyId) {
                return res.status(400).send('Invalid token payload');
            }

            // Update warranty status to rejected
            // We'll use a specific rejection reason
            const rejectionReason = "Installation rejected by Vendor/Franchise via email verification.";

            await db.execute(
                "UPDATE warranty_registrations SET status = 'rejected', rejection_reason = ? WHERE uid = ? AND status = 'pending_vendor'",
                [rejectionReason, decoded.warrantyId]
            );

            // Fetch warranty details to send rejection email to customer
            const [warranty]: any = await db.execute(
                'SELECT * FROM warranty_registrations WHERE uid = ?',
                [decoded.warrantyId]
            );

            if (warranty.length > 0) {
                const w = warranty[0];
                const productDetails = JSON.parse(w.product_details || '{}');

                // Send rejection email to customer
                await EmailService.sendWarrantyRejectionToCustomer(
                    w.customer_email,
                    w.customer_name,
                    w.uid,
                    w.product_type,
                    w.car_make,
                    w.car_model,
                    rejectionReason,
                    productDetails,
                    w.warranty_type,
                    w.installer_name,
                    w.installer_address, // These might be in w.installer_contact or need fetching from vendor_details if linked
                    w.installer_contact
                );
            }

            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Warranty Rejected</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
                        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                        h1 { color: #d32f2f; margin-bottom: 10px; }
                        p { color: #555; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>❌ Rejection Confirmed</h1>
                        <p>The warranty registration has been rejected.</p>
                        <p>The customer will be notified.</p>
                        <p>You can close this window now.</p>
                    </div>
                </body>
                </html>
            `);

        } catch (error: any) {
            console.error('Warranty rejection error:', error);
            res.status(400).send('Rejection failed or token invalid.');
        }
    }
}

