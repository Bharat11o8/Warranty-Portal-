/**
 * Local disk upload utility — replaces Cloudinary storage
 * Organizes uploads into monthly subdirectories: uploads/{folder}/YYYY-MM/{filename}
 * Naming convention: {uid}_{fieldName}_{originalName}_{timestamp}.{ext} (same as Cloudinary)
 * Image compression is handled client-side (imageCompression.ts) — no server compression needed
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOADS_BASE_DIR = process.env.UPLOADS_BASE_DIR || '/home/deploy/uploads';
const APP_URL = process.env.APP_URL || 'https://api.autoformindia.co.in';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get current YYYY-MM folder name */
function getMonthFolder(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/** Ensure directory exists, create recursively if not */
function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/** Convert absolute disk path → public HTTPS URL */
function diskPathToUrl(absolutePath: string): string {
    const normalized = absolutePath.replace(/\\/g, '/');
    const base = UPLOADS_BASE_DIR.replace(/\\/g, '/');
    const relative = normalized.replace(base, '');
    return `${APP_URL}/uploads${relative}`;
}

/** Build destination function for a given subfolder */
function createDestination(folder: string) {
    return (req: Request, file: Express.Multer.File, cb: (error: any, destination: string) => void) => {
        const monthFolder = getMonthFolder();
        const destDir = path.join(UPLOADS_BASE_DIR, folder, monthFolder);
        ensureDir(destDir);
        cb(null, destDir);
    };
}

// ─── Filename Strategies ─────────────────────────────────────────────────────

/**
 * Warranty naming: {uid}_{fieldName}_{originalName}_{timestamp}.{ext}
 * Matches the existing Cloudinary public_id convention.
 * HEIC/HEIF files get .jpg extension (already converted by client compression).
 */
function warrantyFileName(
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, filename: string) => void
) {
    let uid = 'UNKNOWN';
    try {
        if (req.body?.productDetails) {
            const pd =
                typeof req.body.productDetails === 'string'
                    ? JSON.parse(req.body.productDetails)
                    : req.body.productDetails;
            uid = pd.uid || pd.serialNumber || 'NO_UID';
        }
    } catch (_e) { /* ignore parse errors */ }

    const fieldName = file.fieldname || 'upload';
    const originalBase = file.originalname
        .split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20);
    const timestamp = Date.now();
    const rawExt = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const ext = ['heic', 'heif'].includes(rawExt) ? 'jpg' : rawExt;

    cb(null, `${uid}_${fieldName}_${originalBase}_${timestamp}.${ext}`);
}

/**
 * Generic naming: {fieldName}_{originalName}_{timestamp}.{ext}
 * Used by POSM, grievance, and broadcast routes.
 */
function genericFileName(
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, filename: string) => void
) {
    const fieldName = file.fieldname || 'upload';
    const originalBase = file.originalname
        .split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);
    const timestamp = Date.now();
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();

    cb(null, `${fieldName}_${originalBase}_${timestamp}.${ext}`);
}

// ─── Public URL Middleware ────────────────────────────────────────────────────

/**
 * After multer saves files to disk, replace each file.path (absolute disk path)
 * with its public HTTPS URL. This means existing controllers that read file.path
 * continue to work without any changes.
 */
export function attachPublicUrls(req: any, _res: any, next: any): void {
    const patchFile = (file: any) => {
        if (file?.path) {
            file.path = diskPathToUrl(file.path);
        }
    };

    if (req.file) patchFile(req.file);

    if (req.files) {
        if (Array.isArray(req.files)) {
            req.files.forEach(patchFile);
        } else {
            Object.values(req.files as Record<string, any[]>)
                .forEach(arr => arr.forEach(patchFile));
        }
    }

    next();
}

// ─── Pre-built Upload Instances ───────────────────────────────────────────────

/** Warranty & public QR warranty uploads → uploads/warranty-portal/YYYY-MM/ */
export const warrantyUpload = multer({
    storage: multer.diskStorage({
        destination: createDestination('warranty-portal'),
        filename: warrantyFileName,
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB (already compressed client-side)
        files: 6,                   // invoice + up to 5 photos
    },
    fileFilter: (_req, file, cb) => {
        const ext = (file.originalname.split('.').pop() || '').toLowerCase();
        const allowedExts = ['jpg', 'jpeg', 'png', 'heic', 'heif'];
        const allowedMimes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/jpg'];
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.originalname}`));
        }
    },
});

/** Broadcast / announcement uploads → uploads/broadcasts/YYYY-MM/ */
export const broadcastUpload = multer({
    storage: multer.diskStorage({
        destination: createDestination('broadcasts'),
        filename: genericFileName,
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for videos
    },
});

/** POSM request uploads → uploads/posm_requests/YYYY-MM/ */
export const posmUpload = multer({
    storage: multer.diskStorage({
        destination: createDestination('posm_requests'),
        filename: genericFileName,
    }),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB for videos/excel
        files: 5,
    },
});

/** Grievance uploads → uploads/grievances/YYYY-MM/ */
export const grievanceUpload = multer({
    storage: multer.diskStorage({
        destination: createDestination('grievances'),
        filename: genericFileName,
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 3,
    },
});
