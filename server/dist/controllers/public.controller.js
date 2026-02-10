import db from '../config/database.js';
import jwt from 'jsonwebtoken';
import { EmailService } from '../services/email.service.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
export class PublicController {
    static async getStores(req, res) {
        try {
            // Get only approved vendors with their store details
            const [stores] = await db.execute(`
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
        AND COALESCE(vv.is_active, TRUE) = TRUE
        ORDER BY vd.store_name ASC
      `);
            res.json({
                success: true,
                stores
            });
        }
        catch (error) {
            console.error('Get stores error:', error);
            res.status(500).json({ error: 'Failed to fetch stores' });
        }
    }
    /**
     * Get store details by store code (for QR registration)
     */
    static async getStoreByCode(req, res) {
        try {
            const { code } = req.params;
            if (!code) {
                return res.status(400).json({ error: 'Store code is required' });
            }
            // Fetch store by store_code
            const [stores] = await db.execute(`
                SELECT 
                    vd.id as vendor_details_id,
                    vd.store_name,
                    vd.store_code,
                    vd.address as address_line1,
                    vd.city,
                    vd.state,
                    vd.pincode,
                    vd.store_email,
                    p.phone_number as contact_number,
                    vd.user_id
                FROM vendor_details vd
                JOIN profiles p ON vd.user_id = p.id
                JOIN vendor_verification vv ON vd.user_id = vv.user_id
                WHERE vd.store_code = ? AND vv.is_verified = TRUE
                LIMIT 1
            `, [code]);
            if (stores.length === 0) {
                return res.status(404).json({ error: 'Store not found or not verified' });
            }
            // Also fetch installers/manpower for this store
            const [manpower] = await db.execute('SELECT id, name, manpower_id, applicator_type FROM manpower WHERE vendor_id = ? AND is_active = TRUE ORDER BY name ASC', [stores[0].vendor_details_id]);
            res.json({
                success: true,
                store: stores[0],
                installers: manpower
            });
        }
        catch (error) {
            console.error('Get store by code error:', error);
            res.status(500).json({ error: 'Failed to fetch store details' });
        }
    }
    static async getStoreManpower(req, res) {
        try {
            const { vendorDetailsId } = req.params;
            if (!vendorDetailsId) {
                return res.status(400).json({ error: 'Vendor details ID is required' });
            }
            const [manpower] = await db.execute('SELECT id, name, manpower_id, applicator_type FROM manpower WHERE vendor_id = ? AND is_active = TRUE ORDER BY name ASC', [vendorDetailsId]);
            res.json({
                success: true,
                manpower
            });
        }
        catch (error) {
            console.error('Get store manpower error:', error);
            res.status(500).json({ error: 'Failed to fetch manpower' });
        }
    }
    static async checkVendorSchema(req, res) {
        try {
            const [columns] = await db.execute('SHOW COLUMNS FROM vendor_details');
            res.json({
                success: true,
                columns: columns.map((col) => ({
                    field: col.Field,
                    type: col.Type
                }))
            });
        }
        catch (error) {
            console.error('Schema check error:', error);
            res.status(500).json({ error: 'Schema check failed', details: 'An internal error occurred' });
        }
    }
    static async verifyVendorWarranty(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).send('Invalid verification link');
            }
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.warrantyId) {
                return res.status(400).send('Invalid token payload');
            }
            // Update warranty status
            await db.execute("UPDATE warranty_registrations SET status = 'pending' WHERE uid = ? AND status = 'pending_vendor'", [decoded.warrantyId]);
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
        }
        catch (error) {
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
                        <p>An unexpected error occurred while processing your request.</p>
                    </div>
                </body>
                </html>
            `);
        }
    }
    static async rejectVendorWarranty(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).send('Invalid rejection link');
            }
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.warrantyId) {
                return res.status(400).send('Invalid token payload');
            }
            // Update warranty status to rejected
            // We'll use a specific rejection reason
            const rejectionReason = "Installation rejected by Vendor/Franchise via email verification.";
            await db.execute("UPDATE warranty_registrations SET status = 'rejected', rejection_reason = ? WHERE uid = ? AND status = 'pending_vendor'", [rejectionReason, decoded.warrantyId]);
            // Fetch warranty details to send rejection email to customer
            const [warranty] = await db.execute('SELECT * FROM warranty_registrations WHERE uid = ?', [decoded.warrantyId]);
            if (warranty.length > 0) {
                const w = warranty[0];
                const productDetails = JSON.parse(w.product_details || '{}');
                // Send rejection email to customer
                await EmailService.sendWarrantyRejectionToCustomer(w.customer_email, w.customer_name, w.uid, w.product_type, w.car_make, w.car_model, rejectionReason, productDetails, w.warranty_type, w.installer_name, w.installer_address, // These might be in w.installer_contact or need fetching from vendor_details if linked
                w.installer_contact);
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
        }
        catch (error) {
            console.error('Warranty rejection error:', error);
            res.status(400).send('Rejection failed or token invalid.');
        }
    }
    /**
     * Submit warranty from public QR flow
     * Auto-creates user if not exists, then creates warranty
     */
    static async submitPublicWarranty(req, res) {
        try {
            const warrantyData = req.body;
            // Parse productDetails if it's a string
            if (typeof warrantyData.productDetails === 'string') {
                try {
                    warrantyData.productDetails = JSON.parse(warrantyData.productDetails);
                }
                catch (e) {
                    console.error('Failed to parse productDetails string:', e);
                    return res.status(400).json({ error: 'Invalid productDetails format' });
                }
            }
            // Handle uploaded files (same logic as WarrantyController)
            const files = req.files;
            if (files && files.length > 0) {
                files.forEach(file => {
                    if (file.fieldname === 'invoiceFile') {
                        warrantyData.productDetails.invoiceFileName = file.path;
                    }
                    else if (['lhsPhoto', 'rhsPhoto', 'frontRegPhoto', 'backRegPhoto', 'warrantyPhoto'].includes(file.fieldname)) {
                        if (!warrantyData.productDetails.photos) {
                            warrantyData.productDetails.photos = {};
                        }
                        let key = file.fieldname.replace('Photo', '');
                        if (file.fieldname === 'frontRegPhoto')
                            key = 'frontReg';
                        if (file.fieldname === 'backRegPhoto')
                            key = 'backReg';
                        warrantyData.productDetails.photos[key] = file.path;
                    }
                });
            }
            // Validate required fields
            if (!warrantyData.productType || !warrantyData.customerName ||
                !warrantyData.customerPhone || !warrantyData.customerEmail ||
                !warrantyData.carMake || !warrantyData.carModel || !warrantyData.carYear ||
                !warrantyData.purchaseDate || !warrantyData.warrantyType) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // UID required for seat-cover
            if (warrantyData.productType === 'seat-cover' && !warrantyData.productDetails?.uid) {
                return res.status(400).json({ error: 'UID is required for seat-cover products' });
            }
            const customerEmail = warrantyData.customerEmail.toLowerCase().trim();
            const customerPhone = warrantyData.customerPhone.trim();
            const customerName = warrantyData.customerName.trim();
            // Step 1: Find or create customer user
            let userId;
            let isNewUser = false;
            const [existingUsers] = await db.execute('SELECT id FROM profiles WHERE email = ?', [customerEmail]);
            if (existingUsers.length > 0) {
                // Existing user
                userId = existingUsers[0].id;
            }
            else {
                // Create new customer user
                isNewUser = true;
                // Generate random password (user will use OTP login or reset)
                const tempPassword = uuidv4().substring(0, 12);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                const newUserId = uuidv4();
                const [result] = await db.execute(`INSERT INTO profiles (id, name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)`, [newUserId, customerName, customerEmail, customerPhone, hashedPassword]);
                userId = result.insertId || newUserId;
            }
            // Step 2: Check UID/Serial duplication
            const checkId = warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber;
            if (checkId) {
                const [existingWarranty] = await db.execute('SELECT uid FROM warranty_registrations WHERE uid = ?', [checkId]);
                if (existingWarranty.length > 0) {
                    return res.status(400).json({
                        error: `This ${warrantyData.productDetails.uid ? 'UID' : 'Serial Number'} is already registered.`
                    });
                }
            }
            // Step 3: Insert warranty
            // For public submissions, it goes to pending_vendor (Franchise needs to verify)
            const initialStatus = 'pending_vendor';
            const warrantyId = warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber || uuidv4();
            await db.execute(`INSERT INTO warranty_registrations 
                (uid, user_id, product_type, customer_name, customer_email, customer_phone, 
                 customer_address, car_make, car_model, car_year, 
                 purchase_date, installer_name, installer_contact, product_details, manpower_id, warranty_type, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                warrantyId,
                userId,
                warrantyData.productType,
                customerName,
                customerEmail,
                customerPhone,
                warrantyData.customerAddress || '',
                warrantyData.carMake,
                warrantyData.carModel,
                warrantyData.carYear,
                warrantyData.purchaseDate,
                warrantyData.installerName || null,
                warrantyData.installerContact || null,
                JSON.stringify(warrantyData.productDetails),
                warrantyData.manpowerId || null,
                warrantyData.warrantyType,
                initialStatus
            ]);
            // Step 4: Send vendor confirmation email
            if (warrantyData.installerContact) {
                const token = jwt.sign({ warrantyId: warrantyId, vendorEmail: warrantyData.installerContact }, process.env.JWT_SECRET, { expiresIn: '7d' });
                let vendorEmail = warrantyData.installerContact;
                if (vendorEmail.includes('|')) {
                    vendorEmail = vendorEmail.split('|')[0].trim();
                }
                await EmailService.sendVendorConfirmationEmail(vendorEmail, warrantyData.installerName || 'Partner', customerName, token, warrantyData.productType, warrantyData.productDetails, warrantyData.carMake, warrantyData.carModel);
            }
            // Step 5: Send welcome email for new users
            if (isNewUser) {
                await EmailService.sendPublicRegistrationWelcome(customerEmail, customerName, warrantyId);
            }
            res.json({
                success: true,
                warrantyId,
                message: 'Warranty submitted successfully. Awaiting store verification.',
                isNewUser
            });
        }
        catch (error) {
            console.error('Public warranty submission error:', error);
            res.status(500).json({ error: 'Failed to submit warranty', details: 'An internal error occurred while processing your request.' });
        }
    }
}
