import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
export const authenticateToken = (req, res, next) => {
    // SBP-006: Read token from HttpOnly cookie first, then fall back to Authorization header
    const cookieToken = req.cookies?.auth_token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const token = cookieToken || headerToken;
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        // Clear invalid cookie if present
        if (cookieToken) {
            res.clearCookie('auth_token', { path: '/' });
        }
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
/**
 * requirePermission — granular RBAC middleware.
 * Super Admin bypasses all checks.
 * Non-admin roles (vendor, customer) are skipped — they are controlled by requireRole.
 * Regular admins must have the specified action (read/write) for the module.
 * The 'admins' module is Super Admin only.
 */
export const requirePermission = (module, action) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Non-admin roles (vendor, customer) are not subject to module permissions
        if (user.role !== 'admin') {
            return next();
        }
        // Super admin has unrestricted access
        if (user.isSuperAdmin) {
            return next();
        }
        // 'admins' module is Super Admin only
        if (module === 'admins') {
            return res.status(403).json({ error: 'Super Admin access required' });
        }
        const perm = user.permissions?.[module];
        if (!perm || !perm[action]) {
            return res.status(403).json({
                error: `You do not have ${action === 'write' ? 'edit' : action} access to this module`
            });
        }
        next();
    };
};
