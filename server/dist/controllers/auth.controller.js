import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { EmailService } from '../services/email.service.js';
import { OTPService } from '../services/otp.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';
import dotenv from 'dotenv';
dotenv.config();
// Validation regex patterns
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PINCODE_REGEX = /^\d{6}$/;
const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = process.env.SESSION_COOKIE_SECURE
        ? process.env.SESSION_COOKIE_SECURE === 'true'
        : isProduction;
    let sameSite = process.env.SESSION_COOKIE_SAMESITE
        ?? (secure ? 'none' : 'lax');
    // Browsers reject SameSite=None cookies unless Secure is true.
    if (!secure && sameSite === 'none') {
        sameSite = 'lax';
    }
    const maxAgeMs = Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 24 * 60 * 60 * 1000);
    return {
        httpOnly: true,
        secure,
        sameSite,
        path: '/',
        maxAge: maxAgeMs
    };
};
export class AuthController {
    static async register(req, res) {
        try {
            const { name, email, phoneNumber, role, storeName, address, state, city, pincode, manpower } = req.body;
            // Validate input
            if (!name || !email || !phoneNumber || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            // SBP-001: Block admin self-registration — admins can only be created via admin endpoint
            if (role === 'admin') {
                return res.status(403).json({ error: 'Admin accounts cannot be created through public registration' });
            }
            // Validate email format
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({ error: 'Please enter a valid email address' });
            }
            // Validate Indian mobile number (clean it first)
            const cleanedPhone = phoneNumber.replace(/[\s\-+]/g, '').replace(/^91/, '').replace(/^0/, '');
            if (!INDIAN_MOBILE_REGEX.test(cleanedPhone)) {
                return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (must start with 6-9)' });
            }
            // Validate vendor specific fields
            if (role === 'vendor') {
                if (!storeName || !address || !state || !city || !pincode) {
                    return res.status(400).json({ error: 'All vendor details are required' });
                }
                // Validate pincode
                if (!PINCODE_REGEX.test(pincode)) {
                    return res.status(400).json({ error: 'Pincode must be 6 digits' });
                }
            }
            // Clean up expired pending registrations first
            await db.execute('DELETE FROM pending_registrations WHERE expires_at < NOW()');
            // Check if user already exists in ACTUAL profiles table (verified users only)
            const [existingUsers] = await db.execute('SELECT id FROM profiles WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            // Check if phone number already exists
            const [existingPhones] = await db.execute('SELECT id FROM profiles WHERE phone_number = ?', [cleanedPhone]);
            if (existingPhones.length > 0) {
                return res.status(400).json({ error: 'Phone number already registered' });
            }
            // Delete any existing pending registration with this email (allows re-registration)
            await db.execute('DELETE FROM pending_registrations WHERE email = ?', [email]);
            const pendingId = uuidv4();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
            // Store manpower as JSON if vendor
            const manpowerJson = role === 'vendor' && manpower ? JSON.stringify(manpower) : null;
            // Insert into pending_registrations table
            await db.execute(`INSERT INTO pending_registrations 
         (id, name, email, phone_number, role, store_name, store_email, address, state, city, pincode, manpower_data, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                pendingId,
                name,
                email,
                phoneNumber,
                role,
                role === 'vendor' ? storeName : null,
                role === 'vendor' ? email : null,
                role === 'vendor' ? address : null,
                role === 'vendor' ? state : null,
                role === 'vendor' ? city : null,
                role === 'vendor' ? pincode : null,
                manpowerJson,
                expiresAt
            ]);
            // Generate OTP (using pending registration ID)
            const otp = await OTPService.createOTP(pendingId);
            await EmailService.sendOTP(email, name, otp);
            res.status(201).json({
                success: true,
                message: 'OTP sent to your email. Please verify to complete registration.',
                userId: pendingId,
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
            // Check vendor verification and activation status
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified, is_active FROM vendor_verification WHERE user_id = ?', [user.id]);
                if (verification.length === 0 || !verification[0].is_verified) {
                    return res.status(403).json({
                        error: 'Vendor account pending verification. Please wait for admin approval.'
                    });
                }
                // Note: We allow login for deactivated vendors but return isActive=false
                // Frontend will handle showing deactivation message
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
            // FIRST: Check if this is a pending registration (new user flow)
            const [pendingUsers] = await db.execute('SELECT * FROM pending_registrations WHERE id = ? AND expires_at > NOW()', [userId]);
            if (pendingUsers.length > 0) {
                // This is a NEW REGISTRATION - move data from pending to actual tables
                const pending = pendingUsers[0];
                const newUserId = uuidv4(); // Generate new permanent user ID
                const allowedRoles = new Set(['customer', 'vendor']);
                // SBP-001: Reject unexpected roles in pending registrations (defense in depth)
                if (!allowedRoles.has(pending.role)) {
                    await db.execute('DELETE FROM pending_registrations WHERE id = ?', [userId]);
                    return res.status(403).json({ error: 'Invalid registration role' });
                }
                // Use transaction for atomic multi-table writes
                const connection = await db.getConnection();
                try {
                    await connection.beginTransaction();
                    // Insert into profiles table
                    await connection.execute('INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)', [newUserId, pending.name, pending.email, pending.phone_number]);
                    // Insert user role
                    await connection.execute('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [uuidv4(), newUserId, pending.role]);
                    // If vendor, create verification record and details
                    if (pending.role === 'vendor') {
                        const verificationToken = uuidv4();
                        await connection.execute("INSERT INTO vendor_verification (id, user_id, is_verified) VALUES (?, ?, ?)", [uuidv4(), newUserId, false]);
                        // Insert vendor details
                        const vendorDetailsId = uuidv4();
                        await connection.execute(`INSERT INTO vendor_details 
               (id, user_id, store_name, store_email, address, state, city, pincode) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [vendorDetailsId, newUserId, pending.store_name, pending.store_email, pending.address, pending.state, pending.city, pending.pincode]);
                        // Insert manpower details if any
                        if (pending.manpower_data) {
                            const manpowerList = typeof pending.manpower_data === 'string'
                                ? JSON.parse(pending.manpower_data)
                                : pending.manpower_data;
                            if (manpowerList && manpowerList.length > 0) {
                                for (const m of manpowerList) {
                                    await connection.execute(`INSERT INTO manpower 
                     (id, vendor_id, name, phone_number, manpower_id, applicator_type) 
                     VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), vendorDetailsId, m.name, m.phoneNumber, m.manpowerId, m.applicatorType]);
                                }
                            }
                        }
                        // Delete from pending registrations (inside transaction)
                        await connection.execute('DELETE FROM pending_registrations WHERE id = ?', [userId]);
                        // Commit the transaction
                        await connection.commit();
                        // Send emails AFTER successful commit (outside transaction)
                        await EmailService.sendVendorVerificationRequest(pending.email, pending.name, pending.phone_number, newUserId, verificationToken);
                        await EmailService.sendVendorRegistrationConfirmation(pending.email, pending.name);
                        // Vendor needs admin approval, don't provide token yet
                        return res.json({
                            success: true,
                            message: 'Registration complete! Your vendor account is pending admin approval.',
                            token: null,
                            user: null
                        });
                    }
                    // For customers - delete from pending (inside transaction)
                    await connection.execute('DELETE FROM pending_registrations WHERE id = ?', [userId]);
                    // Commit the transaction
                    await connection.commit();
                    // Generate JWT for customer
                    const token = jwt.sign({
                        id: newUserId,
                        email: pending.email,
                        name: pending.name,
                        role: pending.role
                    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
                    res.cookie('auth_token', token, getAuthCookieOptions());
                    return res.json({
                        success: true,
                        message: 'Registration successful!',
                        token,
                        user: {
                            id: newUserId,
                            email: pending.email,
                            name: pending.name,
                            role: pending.role,
                            phoneNumber: pending.phone_number,
                            isValidated: true
                        }
                    });
                }
                catch (transactionError) {
                    // Rollback on any failure
                    await connection.rollback();
                    throw transactionError;
                }
                finally {
                    connection.release();
                }
            }
            // SECOND: This is a LOGIN flow - user already exists in profiles
            const [users] = await db.execute('SELECT id, email, name, phone_number FROM profiles WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found or registration expired. Please register again.' });
            }
            const user = users[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
            const userRole = roles[0].role;
            // Get verification and activation status for vendors
            let isValidated = userRole === 'customer';
            let isActive = true;
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified, is_active FROM vendor_verification WHERE user_id = ?', [userId]);
                isValidated = verification[0]?.is_verified || false;
                // Fix: MySQL returns 0 for false, which !== false evaluates to true. 
                // We must check if it is 1 or true.
                const activeVal = verification[0]?.is_active;
                isActive = (activeVal === 1 || activeVal === true);
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
                name: user.name,
                role: userRole
            }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
            res.cookie('auth_token', token, getAuthCookieOptions());
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: userRole,
                    phoneNumber: user.phone_number,
                    isValidated,
                    isActive
                }
            });
            // Log Admin Login
            if (userRole === 'admin') {
                await ActivityLogService.log({
                    adminId: user.id,
                    adminName: user.name,
                    adminEmail: user.email,
                    actionType: 'ADMIN_LOGIN',
                    targetType: 'SYSTEM',
                    ipAddress: req.ip || req.socket?.remoteAddress
                });
            }
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
            let userEmail;
            let userName;
            // FIRST: Check if this is a pending registration
            const [pendingUsers] = await db.execute('SELECT email, name FROM pending_registrations WHERE id = ? AND expires_at > NOW()', [userId]);
            if (pendingUsers.length > 0) {
                userEmail = pendingUsers[0].email;
                userName = pendingUsers[0].name;
            }
            else {
                // SECOND: Check profiles table (login flow)
                const [users] = await db.execute('SELECT id, email, name FROM profiles WHERE id = ?', [userId]);
                if (users.length === 0) {
                    return res.status(404).json({ error: 'User not found or registration expired. Please register again.' });
                }
                userEmail = users[0].email;
                userName = users[0].name;
            }
            // Invalidate all existing unused OTPs for this user
            await db.execute('UPDATE otp_codes SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE', [userId]);
            // Generate new OTP
            const otp = await OTPService.createOTP(userId);
            // Send OTP email
            await EmailService.sendOTP(userEmail, userName, otp);
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
            const authenticatedUser = req.user;
            if (!authenticatedUser?.id) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Get user data
            const [users] = await db.execute('SELECT id, email, name, phone_number FROM profiles WHERE id = ?', [authenticatedUser.id]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const user = users[0];
            // Get user role
            const [roles] = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [authenticatedUser.id]);
            const userRole = roles[0].role;
            // Get verification and activation status for vendors
            let isValidated = userRole === 'customer';
            let isActive = true;
            if (userRole === 'vendor') {
                const [verification] = await db.execute('SELECT is_verified, is_active FROM vendor_verification WHERE user_id = ?', [authenticatedUser.id]);
                isValidated = verification[0]?.is_verified || false;
                // Fix: MySQL returns 0 for false.
                const activeVal = verification[0]?.is_active;
                isActive = (activeVal === 1 || activeVal === true || activeVal === '1');
            }
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: userRole,
                    phoneNumber: user.phone_number,
                    isValidated,
                    isActive
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
            // Log Admin Profile Update
            if (userRole === 'admin') {
                await ActivityLogService.log({
                    adminId: userId,
                    adminName: updatedUser.name,
                    adminEmail: updatedUser.email,
                    actionType: 'ADMIN_PROFILE_UPDATED',
                    targetType: 'ADMIN',
                    targetId: userId,
                    targetName: updatedUser.name,
                    details: {
                        changedFields: {
                            name: name !== currentUser[0].name ? { from: currentUser[0].name, to: name } : undefined,
                            email: email !== currentUser[0].email ? { from: currentUser[0].email, to: email } : undefined,
                            phone: phoneNumber !== currentUser[0].phone_number ? { from: currentUser[0].phone_number, to: phoneNumber } : undefined
                        }
                    },
                    ipAddress: req.ip || req.socket?.remoteAddress
                });
            }
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
}
