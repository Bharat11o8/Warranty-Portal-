import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { OTPService } from '../services/otp.service.js';
import dotenv from 'dotenv';
dotenv.config();
export class AuthController {
    static async register(req, res) {
        try {
            const { name, email, phoneNumber, role, storeName, address, state, city, pincode, manpower } = req.body;
            // Validate input
            if (!name || !email || !phoneNumber || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            // Validate vendor specific fields
            if (role === 'vendor') {
                if (!storeName || !address || !state || !city || !pincode) {
                    return res.status(400).json({ error: 'All vendor details are required' });
                }
            }
            // Check if user already exists
            const [existingUsers] = await db.execute('SELECT id FROM profiles WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            const userId = uuidv4();
            // Insert user profile (no password)
            await db.execute('INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)', [userId, name, email, phoneNumber]);
            // Insert user role
            await db.execute('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuidv4(), userId, role]);
            // If vendor, create verification record and details
            if (role === 'vendor') {
                const verificationToken = uuidv4();
                await db.execute("INSERT INTO vendor_verification (id, user_id, is_verified) VALUES (?, ?, ?)", [uuidv4(), userId, false]);
                // Insert vendor details
                const vendorDetailsId = uuidv4();
                await db.execute(`INSERT INTO vendor_details 
           (id, user_id, store_name, store_email, address, state, city, pincode) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [vendorDetailsId, userId, storeName, email, address, state, city, pincode]);
                // Insert manpower details
                if (manpower && manpower.length > 0) {
                    for (const m of manpower) {
                        await db.execute(`INSERT INTO manpower 
               (id, vendor_id, name, phone_number, manpower_id, applicator_type) 
               VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), vendorDetailsId, m.name, m.phoneNumber, m.manpowerId, m.applicatorType]);
                    }
                }
                // Send verification email to admin
                await EmailService.sendVendorVerificationRequest(email, name, phoneNumber, userId, verificationToken);
                // Send confirmation email to vendor
                await EmailService.sendVendorRegistrationConfirmation(email, name);
            }
            // Generate OTP
            const otp = await OTPService.createOTP(userId);
            await EmailService.sendOTP(email, name, otp);
            res.status(201).json({
                success: true,
                message: 'Registration successful. OTP sent to your email.',
                userId,
                requiresOTP: true
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    static async login(req, res) {
        try {
            const { email, role } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            if (!role) {
                return res.status(400).json({ error: 'Role is required' });
            }
            // Get user profile
            const [users] = await db.execute('SELECT * FROM profiles WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.status(401).json({ error: 'User not found. Please register first.' });
            }
            const user = users[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
            if (roles.length === 0) {
                return res.status(500).json({ error: 'User role not found' });
            }
            const userRole = roles[0].role;
            // Validate that the user's registered role matches the login role
            if (userRole !== role) {
                return res.status(403).json({
                    error: `This email is registered as a ${userRole}. Please use the ${userRole} login.`
                });
            }
            // Check vendor verification
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified FROM vendor_verification WHERE user_id = ?', [user.id]);
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
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
    static async verifyOTP(req, res) {
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
            const [users] = await db.execute('SELECT id, email, name, phone_number FROM profiles WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = users[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
            const userRole = roles[0].role;
            // Get verification status for vendors
            let isValidated = userRole === 'customer';
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified FROM vendor_verification WHERE user_id = ?', [userId]);
                isValidated = verification[0]?.is_verified || false;
                // If vendor not validated, don't provide token
                if (!isValidated) {
                    return res.json({
                        success: true,
                        message: 'OTP verified. Waiting for vendor approval.',
                        token: null,
                        user: null
                    });
                }
            }
            // Generate JWT (only for customers or verified vendors)
            const token = jwt.sign({
                id: user.id,
                email: user.email,
                role: userRole
            }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
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
        }
        catch (error) {
            console.error('OTP verification error:', error);
            res.status(500).json({ error: 'OTP verification failed' });
        }
    }
    static async resendOTP(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            // Get user data
            const [users] = await db.execute('SELECT id, email, name FROM profiles WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = users[0];
            // Invalidate all existing unused OTPs for this user
            await db.execute('UPDATE otp_codes SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE', [userId]);
            // Generate new OTP
            const otp = await OTPService.createOTP(userId);
            // Send OTP email
            await EmailService.sendOTP(user.email, user.name, otp);
            res.json({
                success: true,
                message: 'New OTP sent to your email'
            });
        }
        catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({ error: 'Failed to resend OTP' });
        }
    }
    static async getCurrentUser(req, res) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Get user data
            const [users] = await db.execute('SELECT id, email, name, phone_number FROM profiles WHERE id = ?', [decoded.id]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = users[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [decoded.id]);
            const userRole = roles[0].role;
            // Get verification status for vendors
            let isValidated = userRole === 'customer';
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified FROM vendor_verification WHERE user_id = ?', [decoded.id]);
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
        }
        catch (error) {
            console.error('Get current user error:', error);
            res.status(401).json({ error: 'Invalid token' });
        }
    }
    static async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { name, email, phoneNumber } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            if (!name || !email || !phoneNumber) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            // Check if email is being changed and if it's already taken
            const [currentUser] = await db.execute('SELECT email FROM profiles WHERE id = ?', [userId]);
            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (currentUser[0].email !== email) {
                const [existingUsers] = await db.execute('SELECT id FROM profiles WHERE email = ? AND id != ?', [email, userId]);
                if (existingUsers.length > 0) {
                    return res.status(400).json({ error: 'Email already in use by another account' });
                }
            }
            // Update profile
            await db.execute('UPDATE profiles SET name = ?, email = ?, phone_number = ? WHERE id = ?', [name, email, phoneNumber, userId]);
            // Fetch updated user data to return
            const [updatedUsers] = await db.execute('SELECT id, email, name, phone_number FROM profiles WHERE id = ?', [userId]);
            const updatedUser = updatedUsers[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
            const userRole = roles[0]?.role;
            // Get verification status for vendors
            let isValidated = userRole === 'customer';
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified FROM vendor_verification WHERE user_id = ?', [userId]);
                isValidated = verification[0]?.is_verified || false;
            }
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    role: userRole,
                    phoneNumber: updatedUser.phone_number,
                    isValidated
                }
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
}
