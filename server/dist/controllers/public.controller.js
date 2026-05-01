import db from '../config/database.js';
import jwt from 'jsonwebtoken';
import { EmailService } from '../services/email.service.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { geolocateIP, getClientIP } from '../utils/ipGeolocation.js';
import { calculateFraudScore } from '../utils/fraudScoring.js';
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
          p.phone_number as phone,
          p.name as owner_name
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
                    p.name as owner_name,
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
    static async checkUniqueness(req, res) {
        try {
            const { phone, reg, type } = req.query;
            if (!type) {
                return res.status(400).json({ error: 'Product type is required' });
            }
            // Normalize type (frontend might send underscores or hyphens)
            const normalizedType = type.replace('_', '-');
            let conditions = ['product_type = ?', 'status != "rejected"'];
            let params = [normalizedType];
            if (reg) {
                if (reg === 'APPLIED-FOR') {
                    return res.json({ success: true, unique: true });
                }
                conditions.push('registration_number = ?');
                params.push(reg);
            }
            else {
                return res.json({ success: true, unique: true });
            }
            const query = `SELECT uid, customer_name FROM warranty_registrations WHERE ${conditions.join(' AND ')} LIMIT 1`;
            const [existing] = await db.execute(query, params);
            if (existing.length > 0) {
                const typeLabel = normalizedType === 'seat-cover' ? 'Seat Cover' : 'Paint Protection Film (PPF)';
                return res.json({
                    success: true,
                    unique: false,
                    message: reg
                        ? `Vehicle ${reg} is already registered for ${typeLabel}.`
                        : `Phone number ${phone} is already registered for ${typeLabel}.`
                });
            }
            res.json({
                success: true,
                unique: true
            });
        }
        catch (error) {
            console.error('Uniqueness check error:', error);
            res.status(500).json({ error: 'Uniqueness check failed' });
        }
    }
    /**
     * Check if a UID exists in the pre_generated_uids table and is available
     */
    static async checkUID(req, res) {
        try {
            const { uid } = req.query;
            if (!uid || typeof uid !== 'string') {
                return res.status(400).json({ error: 'UID is required' });
            }
            // Check pre_generated_uids table
            const [uidRows] = await db.execute('SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?', [uid]);
            if (uidRows.length === 0) {
                return res.json({
                    success: true,
                    valid: false,
                    reason: 'Invalid UID. This UID does not exist in our system. Please check the UID on your product packaging.'
                });
            }
            if (uidRows[0].is_used) {
                return res.json({
                    success: true,
                    valid: false,
                    reason: 'This UID has already been used for another warranty registration.'
                });
            }
            // Also check if it's already in warranty_registrations (belt and suspenders)
            const { excludeId } = req.query;
            let query = 'SELECT uid FROM warranty_registrations WHERE uid = ?';
            const params = [uid];
            if (excludeId) {
                query += ' AND id != ? AND uid != ?';
                params.push(excludeId, excludeId);
            }
            const [existingWarranty] = await db.execute(query, params);
            if (existingWarranty.length > 0) {
                return res.json({
                    success: true,
                    valid: false,
                    reason: 'This UID is already registered for a warranty.'
                });
            }
            res.json({
                success: true,
                valid: true
            });
        }
        catch (error) {
            console.error('UID check error:', error);
            res.status(500).json({ error: 'UID check failed' });
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
            // Auto-create/assign customer role so they appear in Admin Panel and can login
            try {
                const [warranties] = await db.execute('SELECT user_id FROM warranty_registrations WHERE uid = ?', [decoded.warrantyId]);
                if (warranties.length > 0) {
                    const userId = warranties[0].user_id;
                    if (userId) {
                        // Check if they already have the role
                        const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ? AND role = "customer"', [userId]);
                        if (roles.length === 0) {
                            await db.execute('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "customer")', [uuidv4(), userId]);
                            console.log(`✓ Assigned 'customer' role to user ${userId} after vendor confirmation`);
                        }
                    }
                }
            }
            catch (roleError) {
                console.error('Error assigning customer role during verification:', roleError);
            }
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
                await EmailService.sendWarrantyRejectionToCustomer(w.customer_email, w.customer_name, w.uid, w.product_type, w.registration_number, rejectionReason, w.car_make, w.car_model, productDetails, w.warranty_type, w.installer_name, w.installer_address, // These might be in w.installer_contact or need fetching from vendor_details if linked
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
                    else if (['lhsPhoto', 'rhsPhoto', 'frontRegPhoto', 'backRegPhoto', 'warrantyPhoto', 'vehiclePhoto', 'seatCoverPhoto', 'carOuterPhoto'].includes(file.fieldname)) {
                        if (!warrantyData.productDetails.photos) {
                            warrantyData.productDetails.photos = {};
                        }
                        let key = file.fieldname.replace('Photo', '');
                        if (file.fieldname === 'frontRegPhoto')
                            key = 'frontReg';
                        if (file.fieldname === 'backRegPhoto')
                            key = 'backReg';
                        if (file.fieldname === 'seatCoverPhoto')
                            key = 'seatCover';
                        if (file.fieldname === 'carOuterPhoto')
                            key = 'carOuter';
                        warrantyData.productDetails.photos[key] = file.path;
                    }
                });
            }
            // --- FRAUD DETECTION: EXIF data from frontend ---
            let exifData = { lat: null, lng: null, timestamp: null, deviceMake: null, deviceModel: null, deviceFingerprint: null };
            if (warrantyData.productDetails.exifData) {
                const feExif = warrantyData.productDetails.exifData;
                exifData = {
                    lat: feExif.lat || null,
                    lng: feExif.lng || null,
                    timestamp: feExif.timestamp ? new Date(feExif.timestamp) : null,
                    deviceMake: feExif.deviceMake || null,
                    deviceModel: feExif.deviceModel || null,
                    deviceFingerprint: feExif.deviceFingerprint || null
                };
            }
            else if (warrantyData.productDetails.deviceFingerprint) {
                exifData.deviceFingerprint = warrantyData.productDetails.deviceFingerprint;
            }
            console.log('[FraudDetection] Received exifData from frontend:', warrantyData.productDetails.exifData || 'NONE', '-> parsed:', exifData);
            // --- FRAUD DETECTION: IP Geolocation ---
            const clientIP = getClientIP(req);
            let ipGeo = { city: null, region: null, country: null, lat: null, lng: null };
            try {
                const ipResult = await geolocateIP(clientIP);
                ipGeo = { city: ipResult.city, region: ipResult.region, country: ipResult.country, lat: ipResult.lat, lng: ipResult.lng };
                console.log('[FraudDetection] IP geolocation:', { ip: clientIP, city: ipGeo.city, region: ipGeo.region });
            }
            catch (err) {
                console.warn('[FraudDetection] IP geolocation failed:', err);
            }
            // Validate required fields
            if (!warrantyData.productType || !warrantyData.customerName ||
                !warrantyData.customerPhone || !warrantyData.customerEmail ||
                !warrantyData.registrationNumber || !warrantyData.carYear ||
                !warrantyData.purchaseDate || !warrantyData.warrantyType) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // UID required for seat-cover
            if (warrantyData.productType === 'seat-cover' && !warrantyData.productDetails?.uid) {
                return res.status(400).json({ error: 'UID is required for seat-cover products' });
            }
            // ===== UID Pre-Validation for Seat Covers (against pre_generated_uids table) =====
            const uid = warrantyData.productDetails?.uid || null;
            if (warrantyData.productType === 'seat-cover' && uid) {
                const [uidRows] = await db.execute('SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?', [uid]);
                if (uidRows.length === 0) {
                    return res.status(400).json({
                        error: 'Invalid UID. This UID does not exist in our system. Please check the UID on your product packaging.'
                    });
                }
                if (uidRows[0].is_used) {
                    return res.status(400).json({
                        error: 'This UID has already been used for another warranty registration.'
                    });
                }
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
                // Fetch all roles for this user
                const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
                const userRoles = roles.map((r) => r.role);
                // If the user is an admin or vendor, prevent using this email as a customer
                if (userRoles.includes('admin') || userRoles.includes('vendor')) {
                    return res.status(400).json({ error: "This email address is registered to a franchise or admin and cannot be used for customer registration." });
                }
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
            // Step 2: Check UID/Serial duplication AND conditional uniqueness (phone/reg)
            const checkId = warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber;
            if (checkId) {
                const [existingWarranty] = await db.execute('SELECT uid FROM warranty_registrations WHERE uid = ?', [checkId]);
                if (existingWarranty.length > 0) {
                    return res.status(400).json({
                        error: `This ${warrantyData.productDetails.uid ? 'UID' : 'Serial Number'} is already registered.`
                    });
                }
            }
            // Check if vehicle registration is already registered for this product type
            if (warrantyData.registrationNumber !== 'APPLIED-FOR') {
                const [existingReg] = await db.execute('SELECT uid FROM warranty_registrations WHERE registration_number = ? AND product_type = ? AND status != "rejected"', [warrantyData.registrationNumber, warrantyData.productType]);
                if (existingReg.length > 0) {
                    return res.status(400).json({
                        error: `The vehicle ${warrantyData.registrationNumber} is already registered for a ${warrantyData.productType === 'seat-cover' ? 'Seat Cover' : 'Paint Protection Film (PPF)'} warranty.`
                    });
                }
            }
            // Step 3: Insert warranty
            // For public submissions, it goes to pending_vendor (Franchise needs to verify)
            const initialStatus = 'pending_vendor';
            const warrantyId = warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber || uuidv4();
            // --- FRAUD DETECTION: Calculate fraud score ---
            let fraudScore = 0;
            let fraudFlags = {};
            // Lookup store location for comparison
            let storeLocation = { lat: null, lng: null, city: null, state: null };
            if (warrantyData.installerName) {
                try {
                    const [storeRows] = await db.execute('SELECT latitude, longitude, city, state FROM vendor_details WHERE store_name = ? LIMIT 1', [warrantyData.installerName]);
                    if (storeRows.length > 0) {
                        storeLocation = {
                            lat: storeRows[0].latitude ? parseFloat(storeRows[0].latitude) : null,
                            lng: storeRows[0].longitude ? parseFloat(storeRows[0].longitude) : null,
                            city: storeRows[0].city || null,
                            state: storeRows[0].state || null,
                        };
                    }
                }
                catch (err) {
                    console.warn('[FraudDetection] Store location lookup failed:', err);
                }
            }
            try {
                const result = calculateFraudScore({
                    source: 'customer',
                    exif_lat: exifData.lat,
                    exif_lng: exifData.lng,
                    exif_timestamp: exifData.timestamp,
                    ip_city: ipGeo.city,
                    ip_region: ipGeo.region,
                    ip_lat: ipGeo.lat,
                    ip_lng: ipGeo.lng,
                    submission_time: new Date(),
                    userAgent: req.headers['user-agent'] || '',
                    all_exif_data: warrantyData.productDetails.allExifData
                }, storeLocation);
                fraudScore = result.trust_percentage;
                fraudFlags = result.flags;
                console.log('[FraudDetection] Fraud trust score:', fraudScore, '% Flags:', fraudFlags);
            }
            catch (err) {
                console.warn('[FraudDetection] Fraud scoring failed:', err);
            }
            // Inject submission source for UI display
            warrantyData.productDetails.submissionSource = 'QR Scan';
            await db.execute(`INSERT INTO warranty_registrations 
                (uid, user_id, product_type, customer_name, customer_email, customer_phone, 
                 customer_address, registration_number, car_make, car_model, car_year, 
                 purchase_date, installer_name, installer_contact, product_details, manpower_id, warranty_type, status,
                 exif_lat, exif_lng, exif_timestamp, exif_device, device_fingerprint, submission_ip, ip_city, ip_region, ip_lat, ip_lng, fraud_score, fraud_flags,
                 seat_cover_photo_url, car_outer_photo_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                warrantyId,
                userId,
                warrantyData.productType,
                customerName,
                customerEmail,
                customerPhone,
                warrantyData.customerAddress || '',
                warrantyData.registrationNumber,
                warrantyData.carMake || null,
                warrantyData.carModel || null,
                warrantyData.carYear,
                warrantyData.purchaseDate,
                warrantyData.installerName || null,
                warrantyData.installerContact || null,
                JSON.stringify(warrantyData.productDetails),
                (warrantyData.manpowerId && warrantyData.manpowerId !== 'owner') ? warrantyData.manpowerId : null,
                warrantyData.warrantyType,
                initialStatus,
                exifData.lat,
                exifData.lng,
                exifData.timestamp,
                exifData.deviceMake ? `${exifData.deviceMake} ${exifData.deviceModel || ''}`.trim() : null,
                exifData.deviceFingerprint,
                clientIP,
                ipGeo.city,
                ipGeo.region,
                ipGeo.lat,
                ipGeo.lng,
                fraudScore,
                JSON.stringify(fraudFlags),
                warrantyData.productDetails?.photos?.seatCover || null,
                warrantyData.productDetails?.photos?.carOuter || null
            ]);
            // UID is checked but NOT marked as used until Admin approves it.
            // Step 4: Send vendor confirmation email
            if (warrantyData.installerContact) {
                const token = jwt.sign({ warrantyId: warrantyId, vendorEmail: warrantyData.installerContact }, process.env.JWT_SECRET, { expiresIn: '7d' });
                let vendorEmail = warrantyData.installerContact;
                if (vendorEmail.includes('|')) {
                    vendorEmail = vendorEmail.split('|')[0].trim();
                }
                await EmailService.sendVendorConfirmationEmail(vendorEmail, warrantyData.installerName || 'Partner', customerName, token, warrantyData.productType, warrantyData.productDetails, warrantyData.registrationNumber, warrantyData.carMake, warrantyData.carModel);
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
