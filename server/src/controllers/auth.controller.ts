import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { EmailService } from '../services/email.service';
import { OTPService } from '../services/otp.service';
import { RegisterData, LoginData } from '../types/index';
import dotenv from 'dotenv';

dotenv.config();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, phoneNumber, role, password }: RegisterData = req.body;

      // Validate input
      if (!name || !email || !phoneNumber || !role || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user already exists
      const [existingUsers]: any = await db.execute(
        'SELECT id FROM profiles WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Insert user profile
      await db.execute(
        'INSERT INTO profiles (id, name, email, phone_number, password_hash) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, phoneNumber, passwordHash]
      );

      // Insert user role
      await db.execute(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [uuidv4(), userId, role]
      );

      // If vendor, create verification record and send email
      if (role === 'vendor') {
        const verificationToken = uuidv4();
        await db.execute(
          'INSERT INTO vendor_verification (id, user_id, verification_token) VALUES (?, ?, ?)',
          [uuidv4(), userId, verificationToken]
        );

        // Send verification email to admin
        await EmailService.sendVendorVerificationRequest(
          email,
          name,
          phoneNumber,
          userId,
          verificationToken
        );
      }

      res.status(201).json({
        success: true,
        message: role === 'vendor' 
          ? 'Vendor registration submitted. Awaiting verification.' 
          : 'Registration successful. Please login.',
        userId
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginData = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Get user profile
      const [users]: any = await db.execute(
        'SELECT * FROM profiles WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get user role
      const [roles]: any = await db.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [user.id]
      );

      if (roles.length === 0) {
        return res.status(500).json({ error: 'User role not found' });
      }

      const userRole = roles[0].role;

      // Check vendor verification
      if (userRole === 'vendor') {
        const [verification]: any = await db.execute(
          'SELECT is_verified FROM vendor_verification WHERE user_id = ?',
          [user.id]
        );

        if (verification.length === 0 || !verification[0].is_verified) {
          return res.status(403).json({ 
            error: 'Vendor account pending verification. Please wait for admin approval.' 
          });
        }
      }

      // Generate OTP
      const otp = await OTPService.createOTP(user.id);

      // Send OTP email
      await EmailService.sendOTP(user.email, user.name, otp);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        userId: user.id,
        requiresOTP: true
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async verifyOTP(req: Request, res: Response) {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        return res.status(400).json({ error: 'User ID and OTP are required' });
      }

      // Verify OTP
      const isValid = await OTPService.verifyOTP(userId, otp);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }

      // Get user data
      const [users]: any = await db.execute(
        'SELECT id, email, name, phone_number FROM profiles WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];

      // Get user role
      const [roles]: any = await db.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [userId]
      );

      const userRole = roles[0].role;

      // Get verification status for vendors
      let isValidated = userRole === 'customer';
      if (userRole === 'vendor') {
        const [verification]: any = await db.execute(
          'SELECT is_verified FROM vendor_verification WHERE user_id = ?',
          [userId]
        );
        isValidated = verification[0]?.is_verified || false;
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: userRole
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          phoneNumber: user.phone_number,
          isValidated
        }
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({ error: 'OTP verification failed' });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Get user data
      const [users]: any = await db.execute(
        'SELECT id, email, name, phone_number FROM profiles WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];

      // Get user role
      const [roles]: any = await db.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [decoded.id]
      );

      const userRole = roles[0].role;

      // Get verification status for vendors
      let isValidated = userRole === 'customer';
      if (userRole === 'vendor') {
        const [verification]: any = await db.execute(
          'SELECT is_verified FROM vendor_verification WHERE user_id = ?',
          [decoded.id]
        );
        isValidated = verification[0]?.is_verified || false;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          phoneNumber: user.phone_number,
          isValidated
        }
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}