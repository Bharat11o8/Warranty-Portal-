interface FraudFlags {
    exif_location_mismatch: 0 | 1 | 2;
    ip_location_mismatch: 0 | 1;
    exif_timestamp_suspicious: 0 | 1 | 2;
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
 * Calculate fraud score for a warranty submission using weighted marking.
 * 
 * Score meaning: 0 (Match), 1 (Missing Data / Minor Warning), 2 (Hard Mismatch)
 * 
 * 1. exif_location_mismatch: 0 (Match), 1 (Missing), 2 (> 10km mismatch)
 * 2. ip_location_mismatch: 0 (Match), 1 (Mismatch/Missing)
 * 3. exif_timestamp_suspicious: 0 (Normal), 1 (Missing), 2 (> 4hrs old)
 * 4. exif_data_missing: 0 (Present), 1 (Missing)
 * 5. ip_data_missing: 0 (Present), 1 (Missing)
 * 
 * Total score is capped at 5.
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
    if (submission.exif_lat === null || submission.exif_lng === null) {
        flags.exif_location_mismatch = 1; // 1 = Data Missing
    } else if (store.lat !== null && store.lng !== null) {
        const distance = haversineDistance(
            submission.exif_lat, submission.exif_lng,
            store.lat, store.lng
        );
        if (distance > 10) { // Tightened from 50km to 10km for hard failure
            flags.exif_location_mismatch = 2; // 2 = Hard Mismatch
        }
    }

    // Flag 2: IP Location vs Store Location
    if (submission.ip_city !== null && store.city !== null) {
        const ipCity = submission.ip_city.toLowerCase().trim();
        const storeCity = store.city.toLowerCase().trim();
        const ipRegion = (submission.ip_region || '').toLowerCase().trim();
        const storeState = (store.state || '').toLowerCase().trim();

        const cityMatch = ipCity.includes(storeCity) || storeCity.includes(ipCity);
        const stateMatch = storeState && (ipRegion.includes(storeState) || storeState.includes(ipRegion));

        if (!cityMatch && !stateMatch) {
            flags.ip_location_mismatch = 1; // IP mismatch only +1 due to routing jumps
        }
    } else {
        flags.ip_location_mismatch = 1; // 1 = Data Missing
    }

    // Flag 3: EXIF Timestamp Suspicious
    if (submission.exif_timestamp === null) {
        flags.exif_timestamp_suspicious = 1; // 1 = Data Missing
    } else {
        const photoTime = new Date(submission.exif_timestamp).getTime();
        const submitTime = submission.submission_time.getTime();
        const hoursDiff = (submitTime - photoTime) / (1000 * 60 * 60);

        if (hoursDiff > 4) { // Tightened from 24h to 4hrs
            flags.exif_timestamp_suspicious = 2; // 2 = Hard Failure
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

    // Calculate total score (capped at 5)
    const rawScore = Object.values(flags).reduce((sum, v) => sum + v, 0);
    const score = Math.min(rawScore, 5);

    return { score, flags };
}
