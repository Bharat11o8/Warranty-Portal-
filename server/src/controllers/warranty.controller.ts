import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { EmailService } from '../services/email.service';
import { AuthRequest } from '../middleware/auth';
import { WarrantyData } from '../types/index';

export class WarrantyController {
  static async submitWarranty(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const warrantyData: WarrantyData = req.body;

      // Validate required fields
      if (!warrantyData.productType || !warrantyData.customerName || 
          !warrantyData.customerEmail || !warrantyData.customerPhone ||
          !warrantyData.customerAddress || !warrantyData.carMake ||
          !warrantyData.carModel || !warrantyData.carYear ||
          !warrantyData.registrationNumber || !warrantyData.purchaseDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const warrantyId = uuidv4();

      // Insert warranty registration
      await db.execute(
        `INSERT INTO warranty_registrations 
        (id, user_id, product_type, customer_name, customer_email, customer_phone, 
         customer_address, car_make, car_model, car_year, registration_number, 
         purchase_date, installer_name, installer_contact, product_details) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          warrantyData.registrationNumber,
          warrantyData.purchaseDate,
          warrantyData.installerName || null,
          warrantyData.installerContact || null,
          JSON.stringify(warrantyData.productDetails)
        ]
      );

      // Send confirmation email to customer
      await EmailService.sendWarrantyConfirmation(
        warrantyData.customerEmail,
        warrantyData.customerName,
        warrantyData.registrationNumber,
        warrantyData.productType
      );

      res.status(201).json({
        success: true,
        message: 'Warranty registration submitted successfully',
        warrantyId,
        registrationNumber: warrantyData.registrationNumber
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

      let query = 'SELECT * FROM warranty_registrations';
      let params: any[] = [];

      // If customer, only show their warranties
      if (req.user.role === 'customer') {
        query += ' WHERE user_id = ?';
        params = [req.user.id];
      }

      query += ' ORDER BY created_at DESC';

      const [warranties]: any = await db.execute(query, params);

      // Parse JSON product_details
      const formattedWarranties = warranties.map((warranty: any) => ({
        ...warranty,
        product_details: JSON.parse(warranty.product_details)
      }));

      res.json({
        success: true,
        warranties: formattedWarranties
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

      const { id } = req.params;

      let query = 'SELECT * FROM warranty_registrations WHERE id = ?';
      let params: any[] = [id];

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
      console.error('Get warranty by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch warranty' });
    }
  }
}