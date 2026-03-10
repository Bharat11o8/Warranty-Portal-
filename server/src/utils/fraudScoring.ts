interface FraudFlags {
    exif_location_mismatch: 0 | 1;
    ip_location_mismatch: 0 | 1;
    exif_timestamp_suspicious: 0 | 1;
    exif_data_missing: 0 | 1;
    ip_data_missing: 0 | 1;
}

interface FraudScoreResult {
    score: number; // 0-5
    flags: FraudFlags;
}

interface StoreLocation {
    lat: number | null;
    lng: number | null;
    city: string | null;
    state: string | null;
}

interface SubmissionData {
    exif_lat: number | null;
    exif_lng: number | null;
    exif_timestamp: Date | null;
    ip_city: string | null;
    ip_region: string | null;
    ip_lat: number | null;
    ip_lng: number | null;
    submission_time: Date;
}

/**
 * Calculate the Haversine distance between two GPS coordinates in kilometers.
 */
function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Calculate fraud score for a warranty submission.
 * 
 * 5 binary flags (0/1):
 * 1. exif_location_mismatch — EXIF GPS > 50km from store location
 * 2. ip_location_mismatch — IP geolocation doesn't match store city/state
 * 3. exif_timestamp_suspicious — Photo taken > 24 hours before submission
 * 4. exif_data_missing — No EXIF/GPS data in uploaded photos
 * 5. ip_data_missing — IP geolocation failed or returned no data
 * 
 * Score range: 0 (clean) to 5 (highly suspicious)
 */
export function calculateFraudScore(
    submission: SubmissionData,
    store: StoreLocation
): FraudScoreResult {
    const flags: FraudFlags = {
        exif_location_mismatch: 0,
        ip_location_mismatch: 0,
        exif_timestamp_suspicious: 0,
        exif_data_missing: 0,
        ip_data_missing: 0,
    };

    // Flag 1: EXIF GPS vs Store Location
    if (submission.exif_lat !== null && submission.exif_lng !== null &&
        store.lat !== null && store.lng !== null) {
        const distance = haversineDistance(
            submission.exif_lat, submission.exif_lng,
            store.lat, store.lng
        );
        if (distance > 50) { // > 50km mismatch
            flags.exif_location_mismatch = 1;
        }
    }

    // Flag 2: IP Location vs Store Location
    if (submission.ip_city !== null && store.city !== null) {
        const ipCity = submission.ip_city.toLowerCase().trim();
        const storeCity = store.city.toLowerCase().trim();
        const ipRegion = (submission.ip_region || '').toLowerCase().trim();
        const storeState = (store.state || '').toLowerCase().trim();

        // Check if city OR state match (flexible matching)
        const cityMatch = ipCity.includes(storeCity) || storeCity.includes(ipCity);
        const stateMatch = storeState && (ipRegion.includes(storeState) || storeState.includes(ipRegion));

        if (!cityMatch && !stateMatch) {
            flags.ip_location_mismatch = 1;
        }
    }

    // Flag 3: EXIF Timestamp Suspicious (photo > 24hrs old)
    if (submission.exif_timestamp !== null) {
        const photoTime = new Date(submission.exif_timestamp).getTime();
        const submitTime = submission.submission_time.getTime();
        const hoursDiff = (submitTime - photoTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            flags.exif_timestamp_suspicious = 1;
        }
    }

    // Flag 4: EXIF Data Missing
    if (submission.exif_lat === null || submission.exif_lng === null) {
        flags.exif_data_missing = 1;
    }

    // Flag 5: IP Data Missing
    if (submission.ip_city === null && submission.ip_lat === null) {
        flags.ip_data_missing = 1;
    }

    const score = Object.values(flags).reduce((sum, v) => sum + v, 0);

    return { score, flags };
}
