/**
 * Image compression utility for mobile photo uploads
 * Automatically resizes large images to prevent network timeouts
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,    // Max width for photos
    maxHeight: 1920,   // Max height for photos
    quality: 0.8,      // JPEG quality (0.8 = 80%)
    maxSizeKB: 1024,   // Target max size: 1MB
};

/**
 * Compress an image file before upload
 * Works with JPEG, PNG, HEIC (Safari auto-converts HEIC to JPEG)
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<File> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip if already small enough (under target size)
    if (file.size <= (opts.maxSizeKB || 1024) * 1024) {
        console.log(`[ImageCompression] File ${file.name} already small (${(file.size / 1024).toFixed(0)}KB), skipping`);
        return file;
    }

    console.log(`[ImageCompression] Compressing ${file.name}: ${(file.size / 1024).toFixed(0)}KB`);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('[ImageCompression] Canvas not supported');
            resolve(file); // Return original if canvas not supported
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            const maxW = opts.maxWidth || 1920;
            const maxH = opts.maxHeight || 1920;

            if (width > maxW || height > maxH) {
                const ratio = Math.min(maxW / width, maxH / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image on canvas (this also handles HEIC by converting to RGB)
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob (JPEG for better compression)
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error('[ImageCompression] Failed to create blob');
                        resolve(file);
                        return;
                    }

                    // Create new File object with original name (but .jpg extension)
                    const originalName = file.name.replace(/\.(heic|heif|png)$/i, '.jpg');
                    const compressedFile = new File([blob], originalName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(
                        `[ImageCompression] Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
                    );

                    resolve(compressedFile);
                },
                'image/jpeg',
                opts.quality
            );
        };

        img.onerror = (err) => {
            console.error('[ImageCompression] Failed to load image:', err);
            resolve(file); // Return original on error
        };

        // Create object URL and load image
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Compress multiple images
 */
export const compressImages = async (
    files: (File | null)[],
    options?: CompressionOptions
): Promise<(File | null)[]> => {
    const results = await Promise.all(
        files.map(async (file) => {
            if (!file) return null;
            return compressImage(file, options);
        })
    );
    return results;
};

/**
 * Check if file is an image that can be compressed
 */
export const isCompressibleImage = (file: File): boolean => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    return imageTypes.includes(file.type) ||
        /\.(jpe?g|png|heic|heif)$/i.test(file.name);
};
