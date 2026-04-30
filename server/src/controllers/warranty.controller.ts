import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { getISTTimestamp } from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { WarrantyData } from '../types/index.js';
import jwt from 'jsonwebtoken';
import { NotificationService } from '../services/notification.service.js';
import { geolocateIP, getClientIP } from '../utils/ipGeolocation.js';
import { calculateFraudScore } from '../utils/fraudScoring.js';


// Extending WarrantyData interface locally if not updated in types file yet
interface ExtendedWarrantyData extends WarrantyData {
  manpowerId?: string;
  vendorDirect?: boolean;
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
          if (file.fieldname === 'invoiceFile') {
            warrantyData.productDetails.invoiceFileName = file.path;
          } else if (['lhsPhoto', 'rhsPhoto', 'frontRegPhoto', 'backRegPhoto', 'warrantyPhoto', 'vehiclePhoto', 'seatCoverPhoto', 'carOuterPhoto'].includes(file.fieldname)) {
            if (!warrantyData.productDetails.photos) {
              warrantyData.productDetails.photos = {};
            }
            let key = file.fieldname.replace('Photo', '');
            if (file.fieldname === 'frontRegPhoto') key = 'frontReg';
            if (file.fieldname === 'backRegPhoto') key = 'backReg';
            if (file.fieldname === 'seatCoverPhoto') key = 'seatCover';
            if (file.fieldname === 'carOuterPhoto') key = 'carOuter';

            (warrantyData.productDetails.photos as any)[key] = file.path;
          }
        });
      }

      // --- FRAUD DETECTION: EXIF data from frontend ---
      let exifData = { lat: null as number | null, lng: null as number | null, timestamp: null as Date | null, deviceMake: null as string | null, deviceModel: null as string | null, deviceFingerprint: null as string | null };
      if ((warrantyData.productDetails as any).exifData) {
        const feExif = (warrantyData.productDetails as any).exifData;
        exifData = {
          lat: feExif.lat || null,
          lng: feExif.lng || null,
          timestamp: feExif.timestamp ? new Date(feExif.timestamp) : null,
          deviceMake: feExif.deviceMake || null,
          deviceModel: feExif.deviceModel || null,
          deviceFingerprint: feExif.deviceFingerprint || null
        };
      } else if ((warrantyData.productDetails as any).deviceFingerprint) {
         exifData.deviceFingerprint = (warrantyData.productDetails as any).deviceFingerprint;
      }

      // --- FRAUD DETECTION: IP Geolocation ---
      const clientIP = getClientIP(req);
      let ipGeo = { city: null as string | null, region: null as string | null, country: null as string | null, lat: null as number | null, lng: null as number | null };
      try {
        const ipResult = await geolocateIP(clientIP);
        ipGeo = { city: ipResult.city, region: ipResult.region, country: ipResult.country, lat: ipResult.lat, lng: ipResult.lng };
      } catch (err) {
        console.warn('[FraudDetection] IP geolocation failed:', err);
      }

      // Validate required fields
      // Customer email is optional for vendors uploading on behalf of customers
      if (!warrantyData.productType || !warrantyData.customerName ||
        !warrantyData.customerPhone ||
        !warrantyData.customerAddress || !warrantyData.registrationNumber ||
        !warrantyData.carYear ||
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

      // ===== UID Pre-Validation for Seat Covers =====
      // --- RESUBMISSION DETECTION (must run BEFORE is_used check) ---
      let isResubmission = false;
      const checkId = uid || warrantyData.productDetails.serialNumber;
      if (checkId) {
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

            // Mark as resubmission (do NOT delete original)
            isResubmission = true;
            console.log(`[Resubmission] Detected resubmission for UID: ${checkId}, routing to staging table.`);
          } else {
            return res.status(400).json({
              error: `This ${uid ? 'UID' : 'Serial Number'} is already registered.`
            });
          }
        }
      }

      // Check if the UID exists in the pre_generated_uids table and is available
      // SKIP this check for resubmissions (UID was already validated on original submission)
      if (warrantyData.productType === 'seat-cover' && uid && !isResubmission) {
        const [uidRows]: any = await db.execute(
          'SELECT uid, is_used FROM pre_generated_uids WHERE uid = ?',
          [uid]
        );

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

      // Check if phone or registration number already exists for this product category
      let categoryQuery = `SELECT uid, customer_name FROM warranty_registrations WHERE (customer_phone = ?`;
      let categoryParams = [warrantyData.customerPhone];

      if (warrantyData.registrationNumber !== 'APPLIED-FOR') {
        categoryQuery += ` OR registration_number = ?`;
        categoryParams.push(warrantyData.registrationNumber);
      }

      categoryQuery += `) AND product_type = ? AND status != 'rejected' AND uid != ?`;
      categoryParams.push(warrantyData.productType, checkId || '');

      const [existingCategoryData]: any = await db.execute(categoryQuery, categoryParams);

      if (existingCategoryData.length > 0) {
        const existing = existingCategoryData[0];
        // Identify which field is duplicate
        // Note: For simplicity, we just block if either is duplicate for the same type.
        // But let's be more specific with the message.
        return res.status(400).json({
          error: `A registration for this ${warrantyData.productType === 'seat-cover' ? 'Seat Cover' : 'Paint Protection Film (PPF)'} already exists with the same phone or vehicle details.`
        });
      }

      // For customer submissions, set status to 'pending_vendor' (needs franchise verification)
      // For vendor/admin submissions, go directly to 'pending_review' (admin review) for resubmissions, otherwise 'pending'
      const baseStatus = req.user.role === 'customer' ? 'pending_vendor' : 'pending';
      // Resubmissions ALWAYS go to 'pending_review' in the staging table
      // (the staging table enum only supports: pending_review, approved, rejected)
      let initialStatus = isResubmission ? 'pending_review' : baseStatus;

      // Use provided UID (for seat covers), Serial Number (for EV products), 
      // original checkId (for edits), or generate a new UUID (fallback)
      const warrantyId = isResubmission ? checkId : (warrantyData.productDetails.uid || warrantyData.productDetails.serialNumber || uuidv4());

      // --- FRAUD DETECTION: Calculate fraud score ---
      let fraudScore = 0;
      let fraudFlags = {};
      let storeLocation = { lat: null as number | null, lng: null as number | null, city: null as string | null, state: null as string | null };
      if (warrantyData.installerName) {
        try {
          const [storeRows]: any = await db.execute(
            'SELECT latitude, longitude, city, state FROM vendor_details WHERE store_name = ? LIMIT 1',
            [warrantyData.installerName]
          );
          if (storeRows.length > 0) {
            storeLocation = {
              lat: storeRows[0].latitude ? parseFloat(storeRows[0].latitude) : null,
              lng: storeRows[0].longitude ? parseFloat(storeRows[0].longitude) : null,
              city: storeRows[0].city || null,
              state: storeRows[0].state || null,
            };
          }
        } catch (err) {
          console.warn('[FraudDetection] Store location lookup failed:', err);
        }
      }
      try {
        const result = calculateFraudScore(
          { 
            source: req.user.role === 'customer' ? 'customer' : 'franchise',
            exif_lat: exifData.lat, 
            exif_lng: exifData.lng, 
            exif_timestamp: exifData.timestamp, 
            ip_city: ipGeo.city, 
            ip_region: ipGeo.region, 
            ip_lat: ipGeo.lat, 
            ip_lng: ipGeo.lng, 
            submission_time: new Date(),
            userAgent: req.headers['user-agent'] || '',
            all_exif_data: (warrantyData.productDetails as any).allExifData
          },
          storeLocation
        );
        fraudScore = result.trust_percentage;
        fraudFlags = result.flags;
      } catch (err) {
        console.warn('[FraudDetection] Fraud scoring failed:', err);
      }

      // Determine user_id: If vendor/admin is submitting, we ensure a customer profile exists
      let finalUserId = req.user.id;
      
      // For vendor/admin submissions with a customer email, auto-create customer profile
      if (req.user.role !== 'customer' && warrantyData.customerEmail) {
        try {
          const customerEmail = warrantyData.customerEmail.toLowerCase().trim();
          
          // Prevent franchise from using their own email
          if (customerEmail === req.user.email.toLowerCase().trim()) {
            return res.status(400).json({ error: "You cannot use your franchise email address as the customer's email. Please use the actual customer's email address." });
          }

          const [existingUsers]: any = await db.execute(
            'SELECT id FROM profiles WHERE email = ?',
            [customerEmail]
          );

          if (existingUsers.length > 0) {
            finalUserId = existingUsers[0].id;
            
            // Fetch all roles for this user
            const [roles]: any = await db.execute(
              'SELECT role FROM user_roles WHERE user_id = ?',
              [finalUserId]
            );
            
            const userRoles = roles.map((r: any) => r.role);
            
            // If the user is an admin or vendor, prevent using this email as a customer
            if (userRoles.includes('admin') || userRoles.includes('vendor')) {
              return res.status(400).json({ error: "This email address is registered as a franchise or admin account and cannot be used as a customer email." });
            }

            // Ensure they have the 'customer' role
            if (!userRoles.includes('customer')) {
              await db.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "customer")',
                [uuidv4(), finalUserId]
              );
            }
          } else {
            // Create new customer profile 
            // Note: We don't set a password, user will use OTP login
            const newCustomerId = uuidv4();
            await db.execute(
              'INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)',
              [newCustomerId, warrantyData.customerName, customerEmail, warrantyData.customerPhone]
            );
            await db.execute(
              'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "customer")',
              [uuidv4(), newCustomerId]
            );
            finalUserId = newCustomerId;
          }
        } catch (profileError) {
          console.error('Error auto-creating customer profile:', profileError);
          // Continue with original user_id if profile creation fails to avoid blocking the submission
        }
      }
      
      // Inject submission source for UI display
      warrantyData.productDetails.submissionSource = req.user.role === 'customer' ? 'Customer Dashboard' : 'Franchise Dashboard';

      if (isResubmission) {
        // Use ON DUPLICATE KEY UPDATE for resubmissions to handle subsequent edits before approval
        await db.execute(
          `INSERT INTO warranty_resubmissions 
          (original_uid, user_id, product_type, customer_name, customer_email, customer_phone, 
           customer_address, registration_number, car_make, car_model, car_year, 
           purchase_date, installer_name, installer_contact, product_details, manpower_id, warranty_type, status,
           exif_lat, exif_lng, exif_timestamp, exif_device, device_fingerprint, submission_ip, ip_city, ip_region, ip_lat, ip_lng, fraud_score, fraud_flags,
           seat_cover_photo_url, car_outer_photo_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            customer_name = VALUES(customer_name),
            customer_email = VALUES(customer_email),
            customer_phone = VALUES(customer_phone),
            customer_address = VALUES(customer_address),
            registration_number = VALUES(registration_number),
            car_make = VALUES(car_make),
            car_model = VALUES(car_model),
            car_year = VALUES(car_year),
            purchase_date = VALUES(purchase_date),
            installer_name = VALUES(installer_name),
            installer_contact = VALUES(installer_contact),
            product_details = VALUES(product_details),
            manpower_id = VALUES(manpower_id),
            status = VALUES(status),
            exif_lat = VALUES(exif_lat),
            exif_lng = VALUES(exif_lng),
            exif_timestamp = VALUES(exif_timestamp),
            exif_device = VALUES(exif_device),
            device_fingerprint = VALUES(device_fingerprint),
            submission_ip = VALUES(submission_ip),
            fraud_score = VALUES(fraud_score),
            fraud_flags = VALUES(fraud_flags),
            seat_cover_photo_url = VALUES(seat_cover_photo_url),
            car_outer_photo_url = VALUES(car_outer_photo_url),
            created_at = CURRENT_TIMESTAMP()`,
          [
            warrantyId, finalUserId, warrantyData.productType, warrantyData.customerName, warrantyData.customerEmail,
            warrantyData.customerPhone, warrantyData.customerAddress, warrantyData.registrationNumber,
            warrantyData.carMake || null, warrantyData.carModel || null, warrantyData.carYear, warrantyData.purchaseDate,
            warrantyData.installerName || null, warrantyData.installerContact || null, JSON.stringify(warrantyData.productDetails),
            (warrantyData.manpowerId && warrantyData.manpowerId !== 'owner') ? warrantyData.manpowerId : null,
            warrantyData.warrantyType, initialStatus, exifData.lat, exifData.lng, exifData.timestamp,
            exifData.deviceMake ? `${exifData.deviceMake} ${exifData.deviceModel || ''}`.trim() : null,
            exifData.deviceFingerprint, clientIP, ipGeo.city, ipGeo.region, ipGeo.lat, ipGeo.lng, fraudScore,
            JSON.stringify(fraudFlags), (warrantyData.productDetails as any)?.photos?.seatCover || null,
            (warrantyData.productDetails as any)?.photos?.carOuter || null
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO warranty_registrations 
          (uid, user_id, product_type, customer_name, customer_email, customer_phone, 
           customer_address, registration_number, car_make, car_model, car_year, 
           purchase_date, installer_name, installer_contact, product_details, manpower_id, warranty_type, status,
           exif_lat, exif_lng, exif_timestamp, exif_device, device_fingerprint, submission_ip, ip_city, ip_region, ip_lat, ip_lng, fraud_score, fraud_flags,
           seat_cover_photo_url, car_outer_photo_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            warrantyId, finalUserId, warrantyData.productType, warrantyData.customerName, warrantyData.customerEmail,
            warrantyData.customerPhone, warrantyData.customerAddress, warrantyData.registrationNumber,
            warrantyData.carMake || null, warrantyData.carModel || null, warrantyData.carYear, warrantyData.purchaseDate,
            warrantyData.installerName || null, warrantyData.installerContact || null, JSON.stringify(warrantyData.productDetails),
            (warrantyData.manpowerId && warrantyData.manpowerId !== 'owner') ? warrantyData.manpowerId : null,
            warrantyData.warrantyType, initialStatus, exifData.lat, exifData.lng, exifData.timestamp,
            exifData.deviceMake ? `${exifData.deviceMake} ${exifData.deviceModel || ''}`.trim() : null,
            exifData.deviceFingerprint, clientIP, ipGeo.city, ipGeo.region, ipGeo.lat, ipGeo.lng, fraudScore,
            JSON.stringify(fraudFlags), (warrantyData.productDetails as any)?.photos?.seatCover || null,
            (warrantyData.productDetails as any)?.photos?.carOuter || null
          ]
        );
      }

      // UID is checked but NOT marked as used until Admin approves it.

      // Handle Email Notifications
      if (initialStatus === 'pending_vendor' && warrantyData.installerContact) {
        // Generate Token
        const token = jwt.sign(
          { warrantyId: warrantyId, vendorEmail: warrantyData.installerContact },
          process.env.JWT_SECRET!,
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
          warrantyData.registrationNumber,
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
          warrantyId,
          warrantyData.productType,
          warrantyData.productDetails,
          warrantyData.registrationNumber,
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

      // Extract Filters from Query
      const { status, search, product_type, make, date_from, date_to } = req.query;

      let conditions: string[] = [];
      let params: any[] = [];

      // 1. Role-based Security Filters (Base Filters)
      if (req.user.role === 'customer') {
        conditions.push('w.user_id = ?');
        params.push(req.user.id);
      }
      else if (req.user.role === 'vendor') {
        // First, get vendor's vendor_details_id and store_name
        const [vendorDetails]: any = await db.execute(
          'SELECT id, store_name, store_email FROM vendor_details WHERE user_id = ?',
          [req.user.id]
        );

        if (vendorDetails.length > 0) {
          const vendorDetailsId = vendorDetails[0].id;
          const vendorStoreName = vendorDetails[0].store_name;
          const vendorStoreEmail = vendorDetails[0].store_email;

          // Get all manpower IDs for this vendor
          const [manpower]: any = await db.execute(
            'SELECT id FROM manpower WHERE vendor_id = ?',
            [vendorDetailsId]
          );

          if (manpower.length > 0) {
            const manpowerIds = manpower.map((m: any) => m.id);
            const inClause = manpowerIds.map(() => '?').join(',');
            // Show warranties where:
            // 1. manpower_id matches one of this vendor's manpower, OR
            // 2. user_id matches (vendor submitted directly), OR
            // 3. installer_name AND installer_contact match this store (catches QR/public submissions)
            conditions.push(`(w.manpower_id IN (${inClause}) OR w.user_id = ? OR (w.installer_name = ? AND w.installer_contact = ?))`);
            params.push(...manpowerIds, req.user.id, vendorStoreName, vendorStoreEmail);
          } else {
            // No manpower — show warranties submitted by vendor OR linked via store name + email
            conditions.push('(w.user_id = ? OR (w.installer_name = ? AND w.installer_contact = ?))');
            params.push(req.user.id, vendorStoreName, vendorStoreEmail);
          }
        } else {
          // No vendor details, just show warranties submitted by vendor
          conditions.push('w.user_id = ?');
          params.push(req.user.id);
        }
      }

      // 2. Apply Dynamic Filters

      // Status Mapping (Frontend Tab -> DB Status)
      if (status && status !== 'all') {
        if (status === 'pending') {
          conditions.push("(w.status = 'pending_vendor' OR w.status = 'pending')");
        } else if (status === 'pending_ho') {
          conditions.push("w.status = 'pending'");
        } else {
          conditions.push('w.status = ?');
          params.push(status);
        }
      }

      // Product Type
      if (product_type && product_type !== 'all') {
        conditions.push('w.product_type = ?');
        params.push(product_type);
      }

      // Car Make
      if (make && make !== 'all') {
        conditions.push('w.car_make = ?');
        params.push(make);
      }

      // Car Model (New)
      const { model } = req.query;
      if (model && model !== 'all') {
        conditions.push('w.car_model = ?');
        params.push(model);
      }

      // Search (Multi-column)
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(`(
          w.customer_name LIKE ? OR 
          w.customer_phone LIKE ? OR 
          w.uid LIKE ? OR 
          w.registration_number LIKE ? OR 
          w.car_make LIKE ? OR 
          w.car_model LIKE ?
        )`);
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Date Range
      if (date_from && date_to) {
        conditions.push('w.created_at BETWEEN ? AND ?');
        params.push(new Date(date_from as string), new Date(date_to as string));
      }

      // 3. Build & Execute Queries
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count Query (Matches Filtes)
      const countQuery = `SELECT COUNT(*) as total FROM warranty_registrations w ${whereClause}`;
      const [countResult]: any = await db.execute(countQuery, params);
      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      // Data Query (Matches Filters + Pagination)
      const baseQuery = `
        SELECT 
            w.*, 
            m.name as manpower_name_from_db,
            vp.phone_number as vendor_phone_number,
            COALESCE(vd.city, vd_owner.city) as vendor_city,
            COALESCE(vd.store_name, vd_owner.store_name) as vendor_store_name,
            COALESCE(vd.state, vd_owner.state) as vendor_state
        FROM warranty_registrations w 
        LEFT JOIN manpower m ON w.manpower_id = m.id
        LEFT JOIN vendor_details vd ON (w.installer_name = vd.store_name AND w.installer_contact = vd.store_email)
        LEFT JOIN profiles vp ON vd.user_id = vp.id
        LEFT JOIN vendor_details vd_owner ON (
            w.manpower_id LIKE 'owner-%' AND 
            vd_owner.id = REPLACE(w.manpower_id, 'owner-', '')
        )
        ${whereClause}
        ORDER BY w.created_at DESC 
        LIMIT ? OFFSET ?
      `; // Limit/Offset added via params

      const mainParams = [...params, limit, offset];
      const [warranties]: any = await db.execute(baseQuery, mainParams);

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

  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      let conditions: string[] = [];
      let params: any[] = [];

      // 1. Role-based Security (Access Control)
      if (req.user.role === 'customer') {
        conditions.push('user_id = ?');
        params.push(req.user.id);
      } else if (req.user.role === 'vendor') {
        const [vendorDetails]: any = await db.execute(
          'SELECT id, store_name, store_email FROM vendor_details WHERE user_id = ?',
          [req.user.id]
        );

        if (vendorDetails.length > 0) {
          const vendorDetailsId = vendorDetails[0].id;
          const vendorStoreName = vendorDetails[0].store_name;
          const [manpower]: any = await db.execute(
            'SELECT id FROM manpower WHERE vendor_id = ?',
            [vendorDetailsId]
          );

          if (manpower.length > 0) {
            const manpowerIds = manpower.map((m: any) => m.id);
            const inClause = manpowerIds.map(() => '?').join(',');
            const vendorStoreEmail = vendorDetails[0].store_email;
            conditions.push(`(manpower_id IN (${inClause}) OR user_id = ? OR (installer_name = ? AND installer_contact = ?))`);
            params.push(...manpowerIds, req.user.id, vendorStoreName, vendorStoreEmail);
          } else {
            const vendorStoreEmail = vendorDetails[0].store_email;
            conditions.push('(user_id = ? OR (installer_name = ? AND installer_contact = ?))');
            params.push(req.user.id, vendorStoreName, vendorStoreEmail);
          }
        } else {
          conditions.push('user_id = ?');
          params.push(req.user.id);
        }
      }

      // 2. Build Where Clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 3. Execute Count Query with Group By Status
      const query = `
        SELECT 
          status, 
          COUNT(*) as count 
        FROM warranty_registrations 
        ${whereClause} 
        GROUP BY status
      `;

      const [rows]: any = await db.execute(query, params);

      // 4. Format Result
      const stats = {
        pending_vendor: 0,
        pending: 0,
        validated: 0,
        rejected: 0
      };

      rows.forEach((row: any) => {
        if (stats.hasOwnProperty(row.status)) {
          (stats as any)[row.status] = row.count;
        }
      });

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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
        !warrantyData.customerAddress || !warrantyData.registrationNumber ||
        !warrantyData.carYear ||
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
        // Seat cover
        if (!warrantyData.productDetails.photos) warrantyData.productDetails.photos = {};
          
        if (!warrantyData.productDetails.invoiceFileName && existingProductDetails.invoiceFileName) {
          warrantyData.productDetails.invoiceFileName = existingProductDetails.invoiceFileName;
        }
        
        // Ensure seat-cover internal photos are preserved! This caused the UI corruption earlier!
        const seatCoverKeys = ['vehicle', 'seatCover', 'carOuter'];
        seatCoverKeys.forEach(key => {
          if (!(warrantyData.productDetails.photos as any)[key] && existingProductDetails.photos?.[key]) {
             (warrantyData.productDetails.photos as any)[key] = existingProductDetails.photos[key];
          }
        });
      }

      // Update warranty details
      // Determine status based on who is updating and current status
      // If it's already pending or validated, preserve the status. 
      // Only transition to pending if it was previously rejected.
      let updatedStatus = warranty.status;
      let clearRejectionReason = false;

      if (warranty.status === 'rejected') {
        updatedStatus = req.user.role === 'customer' ? 'pending_vendor' : 'pending';
        clearRejectionReason = true;
      }

      // Use the warranty's actual id from the found record for update
      const warrantyRecordId = warranty.id;
      await db.execute(
        `UPDATE warranty_registrations SET
         product_type = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
         customer_address = ?, registration_number = ?, car_make = ?, car_model = ?, car_year = ?,
         purchase_date = ?, installer_name = ?,
         installer_contact = ?, product_details = ?, manpower_id = ?, warranty_type = ?,
         status = ?, rejection_reason = ${clearRejectionReason ? 'NULL' : 'rejection_reason'}
         WHERE id = ?`,
        [
          warrantyData.productType,
          warrantyData.customerName,
          warrantyData.customerEmail,
          warrantyData.customerPhone,
          warrantyData.customerAddress,
          warrantyData.registrationNumber,
          warrantyData.carMake || null,
          warrantyData.carModel || null,
          warrantyData.carYear,
          warrantyData.purchaseDate,
          warrantyData.installerName || null,
          warrantyData.installerContact || null,
          JSON.stringify(warrantyData.productDetails),
          (warrantyData.manpowerId && warrantyData.manpowerId !== 'owner') ? warrantyData.manpowerId : (warranty.manpower_id && warranty.manpower_id !== 'owner' ? warranty.manpower_id : null),
          warrantyData.warrantyType,
          updatedStatus,
          warrantyRecordId
        ]
      );

      // --- Notifications ---
      const warrantyUid = warranty.uid;

      // 1. Notify the Customer (Owner)
      try {
        if (warranty.user_id) {
          await NotificationService.notify(warranty.user_id, {
            title: 'Warranty Resubmitted',
            message: `Your warranty registration (${warrantyUid}) has been updated and resubmitted for review.`,
            type: 'warranty',
            link: `/warranty/view/${warrantyUid}`
          });
        }
      } catch (e) {
        console.error('Failed to notify customer of warranty update', e);
      }

      // 2. Notify Admin
      try {
        await NotificationService.broadcast({
          title: 'Warranty Resubmitted',
          message: `Warranty ${warrantyUid} has been resubmitted by the customer (${warrantyData.customerName}) and is awaiting ${updatedStatus === 'pending_vendor' ? 'franchise' : 'admin'} review.`,
          type: 'warranty',
          link: `/admin/verifications?uid=${warrantyUid}`,
          targetUsers: [],
          targetRole: 'admin'
        });
      } catch (err) {
        console.error('Failed to send admin notification for update', err);
      }

      // 3. Notify Vendor/Franchise
      try {
        let vendorUserId: string | null = null;
        let storeName: string | null = null;

        // Method 1: Look up vendor by manpower_id
        if (warrantyData.manpowerId || warranty.manpower_id) {
          const mId = (warrantyData.manpowerId && warrantyData.manpowerId !== 'owner') ? warrantyData.manpowerId : warranty.manpower_id;
          if (mId && mId !== 'owner') {
            const [vendorInfo]: any = await db.execute(
              `SELECT vd.user_id, vd.store_name FROM manpower m 
               JOIN vendor_details vd ON m.vendor_id = vd.id 
               WHERE m.id = ?`,
              [mId]
            );
            if (vendorInfo.length > 0) {
              vendorUserId = vendorInfo[0].user_id;
              storeName = vendorInfo[0].store_name;
            }
          }
        }

        // Method 2: Fallback - Look up vendor by installer_name
        if (!vendorUserId && (warrantyData.installerName || warranty.installer_name)) {
          const iName = warrantyData.installerName || warranty.installer_name;
          const [vendorByName]: any = await db.execute(
            `SELECT user_id, store_name FROM vendor_details WHERE store_name = ?`,
            [iName]
          );
          if (vendorByName.length > 0) {
            vendorUserId = vendorByName[0].user_id;
            storeName = vendorByName[0].store_name;
          }
        }

        if (vendorUserId) {
          await NotificationService.notify(vendorUserId, {
            title: 'Warranty Updated',
            message: `The warranty for ${warrantyData.customerName} (${warrantyUid}) has been resubmitted and requires your verification.`,
            type: 'warranty',
            link: `/dashboard/vendor`
          });
          console.log(`✓ Notified vendor ${storeName} about warranty update`);
        }
      } catch (err) {
        console.error('Failed to send vendor notification for update', err);
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