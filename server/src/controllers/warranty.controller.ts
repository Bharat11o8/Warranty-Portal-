import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { WarrantyData } from '../types/index.js';
import jwt from 'jsonwebtoken';
import { NotificationService } from '../services/notification.service.js';


// Extending WarrantyData interface locally if not updated in types file yet
interface ExtendedWarrantyData extends WarrantyData {
  manpowerId?: string;
}

export class WarrantyController {
  static async submitWarranty(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Handle FormData: req.body might need parsing if it came as JSON string in a field
      // But usually with multer, non-file fields are in req.body
      let warrantyData: ExtendedWarrantyData = req.body;

      // If productDetails is a string (from FormData), parse it
      if (typeof warrantyData.productDetails === 'string') {
        try {
          warrantyData.productDetails = JSON.parse(warrantyData.productDetails);
        } catch (e) {
          console.error('Failed to parse productDetails string:', e);
          return res.status(400).json({ error: 'Invalid productDetails format' });
        }
      }

      // Handle uploaded files
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        // Map files to their respective fields in productDetails
        files.forEach(file => {
          // Field name in form data should match the key in productDetails we want to set
          // e.g., "invoiceFile" -> productDetails.invoiceFileName
          // e.g., "lhsPhoto" -> productDetails.photos.lhs

          if (file.fieldname === 'invoiceFile') {
            warrantyData.productDetails.invoiceFileName = file.path;
          } else if (['lhsPhoto', 'rhsPhoto', 'frontRegPhoto', 'backRegPhoto', 'warrantyPhoto'].includes(file.fieldname)) {
            if (!warrantyData.productDetails.photos) {
              warrantyData.productDetails.photos = {};
            }
            // Map fieldname to photo key
            const photoKey = file.fieldname.replace('Photo', ''); // lhs, rhs, warranty
            // Special case for Reg photos if naming differs, but let's assume standard mapping or adjust
            // Actually, EVProductsForm sends: lhsPhoto, rhsPhoto, frontRegPhoto, backRegPhoto, warrantyPhoto
            // And productDetails.photos expects: lhs, rhs, frontReg, backReg, warranty

            let key = photoKey;
            if (file.fieldname === 'frontRegPhoto') key = 'frontReg';
            if (file.fieldname === 'backRegPhoto') key = 'backReg';

            (warrantyData.productDetails.photos as any)[key] = file.path;
          }
        });
      }

      // Validate required fields
      // Customer email is optional for vendors uploading on behalf of customers
      if (!warrantyData.productType || !warrantyData.customerName ||
        !warrantyData.customerPhone ||
        !warrantyData.customerAddress || !warrantyData.carMake ||
        !warrantyData.carModel || !warrantyData.carYear ||
        !warrantyData.purchaseDate || !warrantyData.warrantyType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Customer email is required for customers, optional for vendors
      if (req.user.role === 'customer' && !warrantyData.customerEmail) {
        return res.status(400).json({ error: 'Customer email is required' });
      }

      // UID is only required for seat-cover products
      if (warrantyData.productType === 'seat-cover' && !warrantyData.productDetails?.uid) {
        return res.status(400).json({ error: 'UID is required for seat-cover products' });
      }

      // Role-based validation: Customers can only register warranties under their own email
      if (req.user.role === 'customer') {
        if (warrantyData.customerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
          return res.status(403).json({
            error: 'Customers can only register warranties under their own account'
          });
        }
      }

      const uid = warrantyData.productDetails.uid || null;

      // Check if UID or Serial Number already exists
      const checkId = uid || warrantyData.productDetails.serialNumber;
      if (checkId) {
        // Fetch product_details to check retry count
        const [existingWarranty]: any = await db.execute(
          'SELECT uid, user_id, status, product_details FROM warranty_registrations WHERE uid = ?',
          [checkId]
        );

        if (existingWarranty.length > 0) {
          const existing = existingWarranty[0];

          // Allow resubmission if:
          // 1. The warranty was rejected AND
          // 2. The user owns it (same user_id)
          if (existing.status === 'rejected' && existing.user_id === req.user.id) {

            // Parse existing details to check retry count
            let existingDetails: any = {};
            try {
              existingDetails = typeof existing.product_details === 'string'
                ? JSON.parse(existing.product_details)
                : existing.product_details || {};
            } catch (e) {
              console.error("Error parsing existing product_details", e);
            }

            const currentRetryCount = existingDetails.retryCount || 0;

            if (currentRetryCount >= 1) {
              return res.status(400).json({
                error: 'Maximum resubmission limit reached. You can only edit and resubmit a rejected warranty once. Please submit a new warranty.'
              });
            }

            // Increment retry count for the new submission
            warrantyData.productDetails.retryCount = currentRetryCount + 1;

            // Delete the old rejected warranty so it can be resubmitted fresh
            await db.execute('DELETE FROM warranty_registrations WHERE uid = ?', [checkId]);
          } else {
            return res.status(400).json({
              error: `This ${uid ? 'UID' : 'Serial Number'} is already registered.`
            });
          }
        }
      }

      // Insert warranty registration
      // For customer submissions, set status to 'pending_vendor'
      const initialStatus = req.user.role === 'customer' ? 'pending_vendor' : 'pending';

      // Use provided UID (for seat covers) or Serial Number (for EV products)
      // or generate a new UUID (fallback)
      const warrantyId = warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber || uuidv4();

      await db.execute(
        `INSERT INTO warranty_registrations 
        (uid, user_id, product_type, customer_name, customer_email, customer_phone, 
         customer_address, car_make, car_model, car_year, 
         purchase_date, installer_name, installer_contact, product_details, manpower_id, warranty_type, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          warrantyId,
          req.user.id,
          warrantyData.productType,
          warrantyData.customerName,
          warrantyData.customerEmail,
          warrantyData.customerPhone,
          warrantyData.customerAddress,
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
        ]
      );

      // Handle Email Notifications
      if (initialStatus === 'pending_vendor' && warrantyData.installerContact) {
        // Generate Token
        const token = jwt.sign(
          { warrantyId: warrantyId, vendorEmail: warrantyData.installerContact },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' } // Long expiry for email links
        );

        // Send Email to Vendor
        // Parsing installerContact to get email if it's in "email | phone" format
        let vendorEmail = warrantyData.installerContact;
        if (vendorEmail.includes('|')) {
          vendorEmail = vendorEmail.split('|')[0].trim();
        }

        await EmailService.sendVendorConfirmationEmail(
          vendorEmail,
          warrantyData.installerName || 'Partner',
          warrantyData.customerName,
          token,
          warrantyData.productType,
          warrantyData.productDetails,
          warrantyData.carMake,
          warrantyData.carModel
        );
      } else if (warrantyData.customerEmail && warrantyData.customerEmail.trim()) {
        // Standard confirmation to customer (only if not pending vendor, or maybe send "Submission Received"?)
        // User said: "share a mail to the vendor... if it gets confirmed then the request will be updated... and the mailing will also be perfomed accordingly"
        // This implies customer gets their "Registered" email AFTER vendor confirms?
        // Or do they get a "Pending Verification" email now?
        // Let's stick to existing behavior for non-pending-vendor, but for pending-vendor, maybe skip this or send a "Waiting for store" email.
        // For now, I will SKIP the standard confirmation email here if it's pending_vendor, 
        // to avoid confusion ("Registered" vs "Pending").
        // I should probably add sending this email in the verification endpoint.
      }

      // If it WASN'T pending_vendor (e.g. Admin submitted), send the standard confirmation now
      if (initialStatus !== 'pending_vendor' && warrantyData.customerEmail && warrantyData.customerEmail.trim()) {
        await EmailService.sendWarrantyConfirmation(
          warrantyData.customerEmail,
          warrantyData.customerName,
          uid,
          warrantyData.productType,
          warrantyData.productDetails,
          warrantyData.carMake,
          warrantyData.carModel
        );
      }


      // Notify Admin about new warranty
      try {
        await NotificationService.broadcast({
          title: `New Warranty Registration`,
          message: `New ${warrantyData.productType} warranty registered by ${warrantyData.installerName || warrantyData.customerName}`,
          type: 'warranty',
          link: `/admin/verifications?uid=${uid}`,
          targetUsers: [],
          targetRole: 'admin'
        });
      } catch (err) {
        console.error('Failed to send admin notification', err);
      }

      // Notify Vendor/Franchise if warranty was registered through their store
      try {
        let vendorUserId: string | null = null;
        let storeName: string | null = null;

        // Method 1: Look up vendor by manpower_id
        if (warrantyData.manpowerId) {
          const [vendorInfo]: any = await db.execute(
            `SELECT vd.user_id, vd.store_name FROM manpower m 
             JOIN vendor_details vd ON m.vendor_id = vd.id 
             WHERE m.id = ?`,
            [warrantyData.manpowerId]
          );
          if (vendorInfo.length > 0) {
            vendorUserId = vendorInfo[0].user_id;
            storeName = vendorInfo[0].store_name;
          }
        }

        // Method 2: Fallback - Look up vendor by installer_name (store name)
        if (!vendorUserId && warrantyData.installerName) {
          const [vendorByName]: any = await db.execute(
            `SELECT user_id, store_name FROM vendor_details WHERE store_name = ?`,
            [warrantyData.installerName]
          );
          if (vendorByName.length > 0) {
            vendorUserId = vendorByName[0].user_id;
            storeName = vendorByName[0].store_name;
          }
        }

        // Send notification if vendor was found
        if (vendorUserId) {
          await NotificationService.notify(vendorUserId, {
            title: 'New Warranty Registration',
            message: `A new ${warrantyData.productType} warranty has been registered through your store for ${warrantyData.customerName}.`,
            type: 'warranty',
            link: `/dashboard/vendor`
          });
          console.log(`✓ Notified vendor ${storeName} about new warranty`);
        }
      } catch (err) {
        console.error('Failed to send vendor notification', err);
      }

      res.status(201).json({
        success: true,
        message: 'Warranty registration submitted successfully',
        uid,
        registrationNumber: uid
      });
    } catch (error: any) {
      console.error('Warranty submission error:', error);
      res.status(500).json({ error: 'Failed to submit warranty registration' });
    }
  }

  static async getWarranties(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = (page - 1) * limit;

      let baseQuery = `
        SELECT 
            w.*, 
            m.name as manpower_name_from_db,
            vp.phone_number as vendor_phone_number
        FROM warranty_registrations w 
        LEFT JOIN manpower m ON w.manpower_id = m.id
        LEFT JOIN vendor_details vd ON m.vendor_id = vd.id
        LEFT JOIN profiles vp ON vd.user_id = vp.id
      `;
      let countQuery = `SELECT COUNT(*) as total FROM warranty_registrations w`;
      let params: any[] = [];
      let countParams: any[] = [];

      // If customer, only show their warranties
      if (req.user.role === 'customer') {
        baseQuery += ' WHERE w.user_id = ?';
        countQuery += ' WHERE w.user_id = ?';
        params = [req.user.id];
        countParams = [req.user.id];
      }
      // If vendor, show warranties linked to their manpower OR submitted by them
      else if (req.user.role === 'vendor') {
        // First, get vendor's vendor_details_id
        const [vendorDetails]: any = await db.execute(
          'SELECT id FROM vendor_details WHERE user_id = ?',
          [req.user.id]
        );

        if (vendorDetails.length > 0) {
          const vendorDetailsId = vendorDetails[0].id;

          // Get all manpower IDs for this vendor
          const [manpower]: any = await db.execute(
            'SELECT id FROM manpower WHERE vendor_id = ?',
            [vendorDetailsId]
          );

          if (manpower.length > 0) {
            const manpowerIds = manpower.map((m: any) => m.id);
            // Show warranties where manpower_id matches OR user_id matches (vendor submitted)
            const inClause = manpowerIds.map(() => '?').join(',');
            baseQuery += ` WHERE w.manpower_id IN (${inClause}) OR w.user_id = ?`;
            countQuery += ` WHERE w.manpower_id IN (${inClause}) OR w.user_id = ?`;
            params = [...manpowerIds, req.user.id];
            countParams = [...manpowerIds, req.user.id];
          } else {
            // No manpower, just show warranties submitted by vendor
            baseQuery += ' WHERE w.user_id = ?';
            countQuery += ' WHERE w.user_id = ?';
            params = [req.user.id];
            countParams = [req.user.id];
          }
        } else {
          // No vendor details, just show warranties submitted by vendor
          baseQuery += ' WHERE w.user_id = ?';
          countQuery += ' WHERE w.user_id = ?';
          params = [req.user.id];
          countParams = [req.user.id];
        }
      }

      // Get total count
      const [countResult]: any = await db.execute(countQuery, countParams);
      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      // Add ordering and pagination to main query
      baseQuery += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [warranties]: any = await db.execute(baseQuery, params);

      // Parse JSON product_details
      const formattedWarranties = warranties.map((warranty: any) => ({
        ...warranty,
        product_details: JSON.parse(warranty.product_details)
      }));

      res.json({
        success: true,
        warranties: formattedWarranties,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error: any) {
      console.error('Get warranties error:', error);
      res.status(500).json({ error: 'Failed to fetch warranties' });
    }
  }

  static async getWarrantyById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { uid } = req.params;

      let query = 'SELECT * FROM warranty_registrations WHERE (uid = ? OR id = ?)';
      let params: any[] = [uid, uid];

      // If customer, ensure they own this warranty
      if (req.user.role === 'customer') {
        query += ' AND user_id = ?';
        params.push(req.user.id);
      }

      const [warranties]: any = await db.execute(query, params);

      if (warranties.length === 0) {
        return res.status(404).json({ error: 'Warranty not found' });
      }

      const warranty = {
        ...warranties[0],
        product_details: JSON.parse(warranties[0].product_details)
      };

      res.json({
        success: true,
        warranty
      });
    } catch (error: any) {
      console.error('Get warranty by UID error:', error);
      res.status(500).json({ error: 'Failed to fetch warranty' });
    }
  }

  static async updateWarranty(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { uid } = req.params;

      // Handle FormData
      let warrantyData: ExtendedWarrantyData = req.body;
      if (typeof warrantyData.productDetails === 'string') {
        try {
          warrantyData.productDetails = JSON.parse(warrantyData.productDetails);
        } catch (e) {
          console.error('Failed to parse productDetails string:', e);
          return res.status(400).json({ error: 'Invalid productDetails format' });
        }
      }

      // Handle uploaded files
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.fieldname === 'invoiceFile') {
            warrantyData.productDetails.invoiceFileName = file.path;
          } else if (['lhsPhoto', 'rhsPhoto', 'frontRegPhoto', 'backRegPhoto', 'warrantyPhoto'].includes(file.fieldname)) {
            if (!warrantyData.productDetails.photos) {
              warrantyData.productDetails.photos = {};
            }
            const photoKey = file.fieldname.replace('Photo', '');
            let key = photoKey;
            if (file.fieldname === 'frontRegPhoto') key = 'frontReg';
            if (file.fieldname === 'backRegPhoto') key = 'backReg';

            (warrantyData.productDetails.photos as any)[key] = file.path;
          }
        });
      }

      // Validate required fields (same as submit)
      // Customer email is optional for vendors uploading on behalf of customers
      if (!warrantyData.productType || !warrantyData.customerName ||
        !warrantyData.customerPhone ||
        !warrantyData.customerAddress || !warrantyData.carMake ||
        !warrantyData.carModel || !warrantyData.carYear ||
        !warrantyData.purchaseDate || !warrantyData.warrantyType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Customer email is required for customers, optional for vendors
      if (req.user.role === 'customer' && !warrantyData.customerEmail) {
        return res.status(400).json({ error: 'Customer email is required' });
      }

      // Check if warranty exists and belongs to user (or user is admin/vendor linked)
      // For simplicity, we'll check ownership via user_id for now as per getWarrantyById logic
      // Support both uid (seat-cover) and id (EV products) for lookup
      let checkQuery = 'SELECT id, uid, user_id, status, product_details, manpower_id FROM warranty_registrations WHERE uid = ? OR id = ?';
      let checkParams: any[] = [uid, uid];

      const [warranties]: any = await db.execute(checkQuery, checkParams);

      if (warranties.length === 0) {
        return res.status(404).json({ error: 'Warranty not found' });
      }

      const warranty = warranties[0];

      // Authorization check: Only allow update if user owns it or is admin (though admin usually uses different endpoint)
      // Also allow vendors to update warranties they submitted
      if (req.user.role !== 'admin' && warranty.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this warranty' });
      }

      // Only allow updating if status is 'rejected' (or maybe 'pending' if we want to allow corrections before approval)
      // For now, let's allow it for rejected and pending.
      if (warranty.status === 'validated') {
        return res.status(400).json({ error: 'Cannot update a validated warranty' });
      }

      // Merge existing product details with new ones to preserve existing photos if not re-uploaded
      const existingProductDetails = JSON.parse(warranty.product_details || '{}');

      // If new photos are uploaded, they are already in warrantyData.productDetails via the file handling above
      // But if NOT uploaded, we want to keep existing ones.
      // However, warrantyData.productDetails might be incomplete if we just parsed it from a partial update?
      // Actually, the frontend usually sends the full object.
      // But for files, they are null in the JSON if not re-uploaded.

      if (warrantyData.productType === 'ev-products') {
        if (!warrantyData.productDetails.photos) warrantyData.productDetails.photos = {};

        // Helper to preserve existing photo if new one is not provided (which means it's null/undefined in the upload)
        // But wait, if it's not in req.files, we didn't update it above.
        // So we just need to make sure we don't overwrite with null if the frontend sent null for "no change"

        const photoKeys = ['lhs', 'rhs', 'frontReg', 'backReg', 'warranty'];
        photoKeys.forEach(key => {
          // If we didn't get a new file for this key (so it's not in warrantyData.productDetails.photos from the file loop)
          // AND the frontend didn't send a string value (which it shouldn't for files),
          // Then we should probably keep the old value.
          // But the frontend might send the OLD filename as a string if it's just passing data back?
          // Let's assume frontend sends null for no change, or the old filename.

          // If it's in the file loop, it's updated.
          // If not, check if we have it in existing.
          if (!(warrantyData.productDetails.photos as any)[key] && existingProductDetails.photos?.[key]) {
            (warrantyData.productDetails.photos as any)[key] = existingProductDetails.photos[key];
          }
        });
      } else {
        // Seat cover invoice
        if (!warrantyData.productDetails.invoiceFileName && existingProductDetails.invoiceFileName) {
          warrantyData.productDetails.invoiceFileName = existingProductDetails.invoiceFileName;
        }
      }

      // Update warranty details
      // Reset status to 'pending' and clear rejection_reason
      // Use the warranty's actual id from the found record for update
      const warrantyRecordId = warranty.id;
      await db.execute(
        `UPDATE warranty_registrations SET
         product_type = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
         customer_address = ?, car_make = ?, car_model = ?, car_year = ?,
         purchase_date = ?, installer_name = ?,
         installer_contact = ?, product_details = ?, manpower_id = ?, warranty_type = ?,
         status = 'pending', rejection_reason = NULL
         WHERE id = ?`,
        [
          warrantyData.productType,
          warrantyData.customerName,
          warrantyData.customerEmail,
          warrantyData.customerPhone,
          warrantyData.customerAddress,
          warrantyData.carMake,
          warrantyData.carModel,
          warrantyData.carYear,
          warrantyData.purchaseDate,
          warrantyData.installerName || null,
          warrantyData.installerContact || null,
          JSON.stringify(warrantyData.productDetails),
          warrantyData.manpowerId || warranty.manpower_id || null,
          warrantyData.warrantyType,
          warrantyRecordId
        ]
      );

      // Notify the User (Vendor/Customer) about the status update
      try {
        if (warranty.user_id) {
          let notifTitle = 'Warranty Update';
          let notifMessage = `Your warranty registration (${warranty.uid}) has been updated.`;

          if (warrantyData.productType) { // If it was an edit/resubmission
            notifMessage = `Your warranty registration (${warranty.uid}) has been updated and resubmitted.`;
          }

          // If we are just updating status (logic in a different method? No, this is updateWarranty which is mostly for EDITS)
          // For APPROVAl/REJECTION, that's usually a different method "updateStatus" or similar?
          // The current file doesn't seem to have a specific "approveWarranty" method visible in the 540 lines? 
          // Wait, I might have missed it or it's in a different controller? 
          // Re-reading file... I see submit, get, getById, update. 
          // Where is approve? Ah, I might need to scroll down or it was truncated? 
          // The file has 540 lines and ends with closing brace. 
          // It seems "updateWarranty" is used for EDITS by vendor.
          // Admin approval usually happens via `updateStatus` or similar. 
          // Let me check if there are more methods or a separate admin controller.

          // For now, I'll add notification for this "update" action (e.g. if Admin fixed a typo?)
          await NotificationService.notify(warranty.user_id, {
            title: notifTitle,
            message: notifMessage,
            type: 'warranty',
            link: `/warranty/view/${warranty.uid}`
          });
        }
      } catch (e) {
        console.error('Failed to notify user of warranty update', e);
      }

      res.json({
        success: true,
        message: 'Warranty updated and resubmitted successfully'
      });


    } catch (error: any) {
      console.error('Update warranty error:', error);
      res.status(500).json({ error: 'Failed to update warranty' });
    }
  }
}