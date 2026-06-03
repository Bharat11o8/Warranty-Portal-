/**
 * Image compression utility for mobile photo uploads
 * Automatically resizes large images to prevent network timeouts.
 *
 * Key guarantees:
 *  - Every image (large OR small) is run through a canvas round-trip so the
 *    output is always a freshly-encoded, structurally-valid JPEG. This prevents
 *    partially-written or corrupt originals from ever reaching the server.
 *  - img.onerror rejects instead of silently resolving with the broken file.
 *  - canvas.toBlob() returning null rejects instead of resolving with the original.
 *  - A configurable timeout aborts the canvas encoding if it stalls (e.g. OOM on
 *    low-RAM Android devices).
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
    /** Max ms to wait for canvas.toBlob() before aborting. Default: 30 000 ms */
    timeoutMs?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,    // Max width for photos
    maxHeight: 1920,   // Max height for photos
    quality: 0.8,      // JPEG quality (0.8 = 80%)
    maxSizeKB: 1024,   // Target max size: 1MB
    timeoutMs: 30_000, // 30s canvas encoding timeout
};

/**
 * Compress (and sanitize) an image file before upload.
 *
 * Always produces a fresh JPEG via canvas — even if the file is already small —
 * so structurally corrupt originals are caught and rejected here rather than
 * causing silent server-side corruption.
 *
 * Throws on:
 *  - Image load failure (corrupt / unreadable file)
 *  - canvas.toBlob() returning null (OOM on low-RAM devices)
 *  - Encoding timeout
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<File> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const targetBytes = (opts.maxSizeKB || 1024) * 1024;

    console.log(
        `[ImageCompression] Processing ${file.name}: ${(file.size / 1024).toFixed(0)}KB` +
        (file.size <= targetBytes ? ' (small — still re-encoding for integrity)' : '')
    );

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        let settled = false;

        // --- Timeout watchdog ------------------------------------------------
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(objectUrl);
            reject(new Error(
                `[ImageCompression] Canvas encoding timed out after ${opts.timeoutMs}ms for ${file.name}`
            ));
        }, opts.timeoutMs);

        const done = (result: File | Error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(objectUrl);
            if (result instanceof Error) reject(result);
            else resolve(result);
        };

        // --- Image load error ------------------------------------------------
        img.onerror = (err) => {
            console.error('[ImageCompression] Failed to load image — file may be corrupt:', file.name, err);
            done(new Error(
                `Image file appears to be corrupt or unreadable: ${file.name}. ` +
                `Please retake or re-select the photo.`
            ));
        };

        // --- Image load success → canvas encode ------------------------------
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    // Canvas not supported (extremely rare) — pass original through
                    console.warn('[ImageCompression] Canvas 2D context unavailable, passing original');
                    done(file);
                    return;
                }

                // Calculate dimensions maintaining aspect ratio
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

                // Fill white background (avoids transparent-PNG-to-JPEG artifacts)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Determine quality: use lower quality if the image is above target size
                const quality = file.size > targetBytes ? (opts.quality || 0.8) : 0.92;

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            // toBlob returning null = out-of-memory or internal canvas error
                            done(new Error(
                                `[ImageCompression] canvas.toBlob() returned null for ${file.name}. ` +
                                `Device may be low on memory — please close other apps and retry.`
                            ));
                            return;
                        }

                        // Preserve original name with .jpg extension
                        const outputName = file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg');
                        const compressed = new File([blob], outputName, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        console.log(
                            `[ImageCompression] ${file.name}: ` +
                            `${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB ` +
                            `(${Math.round((1 - compressed.size / file.size) * 100)}% reduction, ` +
                            `${width}×${height}px, q=${quality})`
                        );

                        done(compressed);
                    },
                    'image/jpeg',
                    quality
                );
            } catch (err) {
                done(err instanceof Error ? err : new Error(String(err)));
            }
        };

        img.src = objectUrl;
    });
};

/**
 * Compress multiple images in parallel.
 * If any image fails compression, the error propagates — callers should handle it
 * and show a user-facing message rather than silently uploading the broken original.
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
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
    return imageTypes.includes(file.type) ||
        /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name);
};
