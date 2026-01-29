import db, { getISTTimestamp } from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notification.service.js';
export class VendorController {
    static async verifyVendor(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invalid Token</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                background: #f5f5f5;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Invalid Verification Token</h1>
              <p>The verification link is invalid or has expired.</p>
            </div>
          </body>
          </html>
        `);
            }
            // Find vendor by token
            const [verifications] = await db.execute('SELECT * FROM vendor_verification WHERE verification_token = ?', [token]);
            if (verifications.length === 0) {
                return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Token Not Found</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                background: #f5f5f5;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Verification Token Not Found</h1>
              <p>This verification link is invalid or has already been used.</p>
            </div>
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
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                background: #f5f5f5;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #ffc107; }
            </style>
          </head>
          <body>
            <div class="card">
              <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
              <h1>Already Verified</h1>
              <p>This vendor account has already been verified.</p>
            </div>
          </body>
          </html>
        `);
            }
            // Get vendor details BEFORE updating
            const [vendors] = await db.execute('SELECT name, email FROM profiles WHERE id = ?', [verification.user_id]);
            if (vendors.length === 0) {
                return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Vendor Not Found</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                background: #f5f5f5;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Vendor Not Found</h1>
              <p>Unable to find vendor details.</p>
            </div>
          </body>
          </html>
        `);
            }
            // Update verification status
            await db.execute('UPDATE vendor_verification SET is_verified = TRUE, verified_at = ? WHERE verification_token = ?', [getISTTimestamp(), token]);
            // Send confirmation email to vendor with login link
            await EmailService.sendVendorApprovalConfirmation(vendors[0].email, vendors[0].name);
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vendor Verified Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .card {
              background: white;
              padding: 50px 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
              width: 100%;
              text-align: center;
              animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .success-icon { 
              font-size: 80px; 
              margin-bottom: 20px;
              animation: bounce 1s ease infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            h1 { 
              color: #28a745; 
              margin-bottom: 15px;
              font-size: 28px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 25px;
              font-size: 16px;
              line-height: 1.5;
            }
            .vendor-info {
              background: #f8f9fa;
              border-left: 4px solid #28a745;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              text-align: left;
            }
            .vendor-info p {
              margin: 8px 0;
              color: #333;
            }
            .vendor-info strong {
              color: #28a745;
            }
            .info-box {
              background: #e7f5ff;
              border: 2px solid #1971c2;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-box p {
              margin: 5px 0;
              color: #1971c2;
              font-weight: 500;
            }
            .checkmark {
              color: #28a745;
              font-size: 20px;
              margin-right: 8px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #999;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✅</div>
            <h1>Vendor Verified Successfully!</h1>
            <p class="subtitle">The vendor account has been approved and activated</p>
            
            <div class="vendor-info">
              <p><strong>Vendor Name:</strong> ${vendors[0].name}</p>
              <p><strong>Email:</strong> ${vendors[0].email}</p>
              <p><strong>Verification Date:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div class="info-box">
              <p><span class="checkmark">✓</span> Account activated successfully</p>
              <p><span class="checkmark">✓</span> Confirmation email sent to vendor</p>
              <p><span class="checkmark">✓</span> Login credentials are now active</p>
            </div>
            
            <div class="footer">
              <p>The vendor has been notified via email with login instructions.</p>
              <p style="margin-top: 10px;">You can safely close this window.</p>
            </div>
          </div>
        </body>
        </html>
      `);
        }
        catch (error) {
            console.error('Vendor verification error:', error);
            res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
              background: #f5f5f5;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #dc3545; }
            .error-details {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 64px; color: #dc3545; margin-bottom: 20px;">❌</div>
            <h1>Verification Error</h1>
            <p>An error occurred during verification. Please try again later.</p>
            <div class="error-details">
              <strong>Error Details:</strong><br>
              ${error.message || 'Unknown error occurred'}
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              If this problem persists, please contact support.
            </p>
          </div>
        </body>
        </html>
      `);
        }
    }
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get vendor details
            const [vendorDetails] = await db.execute(`SELECT 
          vd.id,
          vd.store_name,
          vd.store_email,
          vd.address,
          vd.city,
          vd.state,
          vd.pincode as postal_code,
          p.phone_number as contact_number
        FROM vendor_details vd
        JOIN profiles p ON vd.user_id = p.id
        WHERE vd.user_id = ?`, [userId]);
            if (vendorDetails.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Vendor details not found'
                });
            }
            // Map to expected format for frontend
            const profile = vendorDetails[0];
            res.json({
                success: true,
                vendorDetails: {
                    id: profile.id,
                    store_name: profile.store_name,
                    store_email: profile.store_email,
                    contact_number: profile.contact_number,
                    address_line1: profile.address || "",
                    address_line2: "",
                    city: profile.city,
                    state: profile.state,
                    postal_code: profile.postal_code
                }
            });
        }
        catch (error) {
            console.error('Get vendor profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch vendor profile'
            });
        }
    }
    static async getManpower(req, res) {
        try {
            const userId = req.user?.id;
            const { active } = req.query; // 'true', 'false', or 'all'
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get vendor details id
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(404).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            // Build WHERE clause based on active filter
            let whereClause = 'm.vendor_id = ?';
            if (active === 'true') {
                whereClause += ' AND m.is_active = TRUE';
            }
            else if (active === 'false') {
                whereClause += ' AND m.is_active = FALSE';
            }
            // If active === 'all', show both active and inactive
            // Get manpower list with application count (optimized to avoid N+1 queries)
            const [manpower] = await db.execute(`
    SELECT
      m.*,
      COALESCE(SUM(CASE WHEN w.status = 'validated' THEN 1 ELSE 0 END), 0) AS validated_count,
      COALESCE(SUM(CASE WHEN w.status IN ('pending', 'pending_vendor') THEN 1 ELSE 0 END), 0) AS pending_count,
      COALESCE(SUM(CASE WHEN w.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_count,
      COUNT(w.id) AS total_count
    FROM manpower m
    LEFT JOIN warranty_registrations w ON w.manpower_id = m.id
    WHERE ${whereClause}
    GROUP BY m.id
    ORDER BY m.is_active DESC, m.name ASC
  `, [vendorId]);
            res.json({
                success: true,
                manpower
            });
        }
        catch (error) {
            console.error('Get manpower error:', error);
            res.status(500).json({ error: 'Failed to fetch manpower list' });
        }
    }
    static async addManpower(req, res) {
        try {
            const userId = req.user?.id;
            const { name, phoneNumber, manpowerId, applicatorType } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            if (!name || !phoneNumber || !applicatorType) {
                return res.status(400).json({ error: 'Name, phone number, and type are required' });
            }
            // Get vendor details id
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(404).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            const id = uuidv4();
            // Generate manpower_id if not provided
            let finalManpowerId = manpowerId;
            if (!finalManpowerId && name && phoneNumber) {
                const namePart = name.slice(0, 3).toUpperCase();
                const phonePart = phoneNumber.slice(-4);
                finalManpowerId = (namePart && phonePart) ? `${namePart}${phonePart} ` : `MP - ${Date.now()} `;
            }
            await db.execute(`INSERT INTO manpower
        (id, vendor_id, name, phone_number, manpower_id, applicator_type, is_active)
      VALUES(?, ?, ?, ?, ?, ?, TRUE)`, [id, vendorId, name, phoneNumber, finalManpowerId, applicatorType]);
            res.status(201).json({
                success: true,
                message: 'Manpower added successfully',
                manpower: {
                    id,
                    vendor_id: vendorId,
                    name,
                    phone_number: phoneNumber,
                    manpower_id: finalManpowerId,
                    applicator_type: applicatorType
                }
            });
            // Notify Admin about new manpower
            try {
                // Fetch Store Name for context
                const [store] = await db.execute('SELECT store_name FROM vendor_details WHERE id = ?', [vendorId]);
                const storeName = store[0]?.store_name || 'Vendor';
                await NotificationService.broadcast({
                    title: 'New Staff Onboarded',
                    message: `${storeName} has added a new ${applicatorType === 'seat_cover' ? 'Seat Cover Expert' : 'PPF Specialist'}: ${name} (${finalManpowerId})`,
                    type: 'warranty',
                    link: `/admin/users`, // Approximated link
                    targetRole: 'admin'
                });
            }
            catch (e) {
                console.error("Failed to notify admin of new manpower", e);
            }
        }
        catch (error) {
            console.error('Add manpower error:', error);
            res.status(500).json({ error: 'Failed to add manpower' });
        }
    }
    static async removeManpower(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { reason } = req.body; // Optional removal reason
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get vendor details id to ensure ownership
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(404).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            // Soft delete: Set is_active to FALSE and record removal timestamp
            const [result] = await db.execute(`UPDATE manpower 
         SET is_active = FALSE, removed_at = NOW(), removed_reason = ?
         WHERE id = ? AND vendor_id = ?`, [reason || null, id, vendorId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Manpower entry not found or unauthorized' });
            }
            res.json({
                success: true,
                message: 'Manpower archived successfully'
            });
            // Notify Admin about manpower removal
            try {
                // Fetch Store Name and Manpower Name for context
                // Note: we might need to fetch before update if we want the name, but let's try to fetch active=false record or just use generic message if strictly needed. 
                // Actually, let's just say "A staff member was removed". Or better, query the manpower details we just updated.
                const [mp] = await db.execute('SELECT name, manpower_id, vendor_id FROM manpower WHERE id = ?', [id]);
                if (mp.length > 0) {
                    const [store] = await db.execute('SELECT store_name FROM vendor_details WHERE id = ?', [mp[0].vendor_id]);
                    const storeName = store[0]?.store_name || 'Vendor';
                    await NotificationService.broadcast({
                        title: 'Staff Member Removed',
                        message: `${storeName} has removed staff member: ${mp[0].name} (${mp[0].manpower_id}). Reason: ${reason || 'None provided'}`,
                        type: 'warranty',
                        targetRole: 'admin'
                    });
                }
            }
            catch (e) {
                console.error("Failed to notify admin of manpower removal", e);
            }
        }
        catch (error) {
            console.error('Remove manpower error:', error);
            res.status(500).json({ error: 'Failed to remove manpower' });
        }
    }
    static async updateManpower(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { name, phoneNumber, applicatorType } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            if (!name || !phoneNumber || !applicatorType) {
                return res.status(400).json({ error: 'Name, phone number, and applicator type are required' });
            }
            // Get vendor details id to ensure ownership
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(404).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            // Generate manpower_id if name or phone changed
            const namePart = name.slice(0, 3).toUpperCase();
            const phonePart = phoneNumber.slice(-4);
            const manpowerId = (namePart && phonePart) ? `${namePart}${phonePart} ` : `MP - ${Date.now()} `;
            // Update manpower entry ensuring it belongs to this vendor
            const [result] = await db.execute(`UPDATE manpower 
         SET name = ?, phone_number = ?, manpower_id = ?, applicator_type = ?
        WHERE id = ? AND vendor_id = ? `, [name, phoneNumber, manpowerId, applicatorType, id, vendorId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Manpower entry not found or unauthorized' });
            }
            // Fetch updated manpower entry
            const [updated] = await db.execute('SELECT * FROM manpower WHERE id = ?', [id]);
            res.json({
                success: true,
                message: 'Manpower updated successfully',
                manpower: updated[0]
            });
        }
        catch (error) {
            console.error('Update manpower error:', error);
            res.status(500).json({ error: 'Failed to update manpower' });
        }
    }
    static async approveWarranty(req, res) {
        try {
            const { uid } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get vendor's vendor_details_id
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(403).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            // Update only if warranty's manpower belongs to this vendor
            const [result] = await db.execute(`UPDATE warranty_registrations wr
         INNER JOIN manpower m ON wr.manpower_id = m.id
         SET wr.status = 'pending'
         WHERE wr.uid = ? AND wr.status = 'pending_vendor' AND m.vendor_id = ?`, [uid, vendorId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Warranty not found or not authorized to approve' });
            }
            // Notify relevant parties
            try {
                // 1. Notify Admin
                await NotificationService.broadcast({
                    title: 'Warranty Approved by Vendor',
                    message: `Warranty ${uid} approved by Franchise. Pending Admin Review.`,
                    type: 'warranty',
                    link: `/admin/verifications?uid=${uid}`,
                    targetUsers: [],
                    targetRole: 'admin'
                });
                // 2. Notify Customer
                const [warrantyRows] = await db.execute('SELECT user_id FROM warranty_registrations WHERE uid = ?', [uid]);
                if (warrantyRows.length > 0 && warrantyRows[0].user_id) {
                    await NotificationService.notify(warrantyRows[0].user_id, {
                        title: 'Warranty Approved by Franchise',
                        message: `Your warranty ${uid} has been approved by the franchise and is now pending final admin review.`,
                        type: 'warranty',
                        link: `/dashboard/customer`
                    });
                }
            }
            catch (e) {
                console.error("Failed to send approval notifications", e);
            }
            res.json({ success: true, message: 'Warranty approved successfully' });
        }
        catch (error) {
            console.error('Approve warranty error:', error);
            res.status(500).json({ error: 'Failed to approve warranty' });
        }
    }
    static async rejectWarranty(req, res) {
        try {
            const { uid } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            if (!reason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }
            // Get vendor's vendor_details_id
            const [vendorDetails] = await db.execute('SELECT id FROM vendor_details WHERE user_id = ?', [userId]);
            if (vendorDetails.length === 0) {
                return res.status(403).json({ error: 'Vendor details not found' });
            }
            const vendorId = vendorDetails[0].id;
            // Update only if warranty's manpower belongs to this vendor
            const [result] = await db.execute(`UPDATE warranty_registrations wr
         INNER JOIN manpower m ON wr.manpower_id = m.id
         SET wr.status = 'rejected', wr.rejection_reason = ?
         WHERE wr.uid = ? AND wr.status = 'pending_vendor' AND m.vendor_id = ?`, [reason, uid, vendorId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Warranty not found or not authorized to reject' });
            }
            // Fetch details and send email to Customer
            const [warranty] = await db.execute('SELECT * FROM warranty_registrations WHERE uid = ?', [uid]);
            if (warranty.length > 0) {
                const w = warranty[0];
                const productDetails = JSON.parse(w.product_details || '{}');
                // 1. Email Notification
                await EmailService.sendWarrantyRejectionToCustomer(w.customer_email, w.customer_name, w.uid, w.product_type, w.car_make, w.car_model, reason, productDetails, w.warranty_type, w.installer_name, w.installer_address, w.installer_contact);
                // 2. Site Notification
                if (w.user_id) {
                    await NotificationService.notify(w.user_id, {
                        title: 'Warranty Rejected by Franchise',
                        message: `Your warranty ${uid} was rejected by the franchise. Reason: ${reason}`,
                        type: 'warranty',
                        link: `/dashboard/customer`
                    });
                }
            }
            res.json({ success: true, message: 'Warranty rejected successfully' });
        }
        catch (error) {
            console.error('Reject warranty error:', error);
            res.status(500).json({ error: 'Failed to reject warranty' });
        }
    }
}
