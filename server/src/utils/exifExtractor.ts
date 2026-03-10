import exifr from 'exifr';

interface ExifData {
    lat: number | null;
    lng: number | null;
    timestamp: Date | null;
    deviceMake: string | null;
    deviceModel: string | null;
}

/**
 * Extract GPS coordinates, timestamp, and device info from an image buffer.
 * Returns nulls for any fields that can't be extracted.
 */
export async function extractExifData(buffer: Buffer): Promise<ExifData> {
    const result: ExifData = {
        lat: null,
        lng: null,
        timestamp: null,
        deviceMake: null,
        deviceModel: null,
    };

    try {
        // Parse GPS data
        const gps = await exifr.gps(buffer).catch(() => null);
        if (gps) {
            result.lat = gps.latitude ?? null;
            result.lng = gps.longitude ?? null;
        }

        // Parse other EXIF tags
        const tags = await exifr.parse(buffer, {
            pick: ['DateTimeOriginal', 'CreateDate', 'Make', 'Model'],
        }).catch(() => null);

        if (tags) {
            result.timestamp = tags.DateTimeOriginal || tags.CreateDate || null;
            result.deviceMake = tags.Make || null;
            result.deviceModel = tags.Model || null;
        }
    } catch (err) {
        console.warn('[ExifExtractor] Failed to extract EXIF data:', err);
        // Return nulls — don't throw
    }

    return result;
}

/**
 * Extract EXIF data from multiple image buffers.
 * Returns the first non-null GPS coordinates found across all images.
 * This is useful when multiple photos are uploaded — we want the best GPS data available.
 */
export async function extractBestExifData(buffers: Buffer[]): Promise<ExifData> {
    const results = await Promise.all(buffers.map(extractExifData));

    // Find the first result with GPS data
    const withGps = results.find(r => r.lat !== null && r.lng !== null);

    // Find the first result with timestamp
    const withTimestamp = results.find(r => r.timestamp !== null);

    // Find the first result with device info
    const withDevice = results.find(r => r.deviceMake !== null);

    return {
        lat: withGps?.lat ?? null,
        lng: withGps?.lng ?? null,
        timestamp: withTimestamp?.timestamp ?? null,
        deviceMake: withDevice?.deviceMake ?? null,
        deviceModel: withDevice?.deviceModel ?? null,
    };
}
