import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export type ModulePermissions = Record<string, { read: boolean; write: boolean }>;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    isSuperAdmin?: boolean;
    permissions?: ModulePermissions;
  };
}

const SESSION_ROLES = new Set(['admin', 'vendor', 'customer']);

/**
 * A valid signature is not enough to be a session.
 *
 * JWT_SECRET also signs single-purpose action tokens — the invoice-download
 * link in the WhatsApp button (`{ purpose: 'invoice', orderId }`) and the
 * franchise verify/reject link in email (`{ warrantyId, vendorEmail }`). Those
 * links are handed to franchises and get forwarded, so presenting one as
 * `auth_token` used to produce a `req.user` with no id and no role. Every
 * handler that scopes by `role === 'customer'` / `role === 'vendor'` then
 * matched neither branch and applied no filter at all — an invoice link read
 * the whole warranty table.
 *
 * Session tokens now carry `typ: 'session'`. The id/role check is what makes
 * this safe *today*: action tokens have neither, so they are rejected before
 * the 30-day cookies issued without a `typ` have expired.
 */
export const isSessionToken = (decoded: any): boolean => {
  if (!decoded || typeof decoded !== 'object') return false;
  if (decoded.typ !== undefined && decoded.typ !== 'session') return false;
  return typeof decoded.id === 'string' && decoded.id.length > 0
    && typeof decoded.role === 'string' && SESSION_ROLES.has(decoded.role);
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // SBP-006: Read token from HttpOnly cookie first, then fall back to Authorization header
  const cookieToken = req.cookies?.auth_token;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isSessionToken(decoded)) {
      if (cookieToken) {
        res.clearCookie('auth_token', { path: '/' });
      }
      return res.status(401).json({ error: 'Access token required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Clear invalid cookie if present
    if (cookieToken) {
      res.clearCookie('auth_token', { path: '/' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
export const requirePermission = (module: string, action: 'read' | 'write') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * Permit an admin who has access to any one of the listed modules. This keeps
 * shared supporting APIs usable without granting an unrelated parent module.
 */
export const requireAnyPermission = (modules: string[], action: 'read' | 'write') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (user.role !== 'admin' || user.isSuperAdmin) {
      return next();
    }

    if (modules.some(module => user.permissions?.[module]?.[action])) {
      return next();
    }

    return res.status(403).json({
      error: `You do not have ${action === 'write' ? 'edit' : action} access to this module`
    });
  };
};
