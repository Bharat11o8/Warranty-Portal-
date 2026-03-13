interface FraudFlags {
    distance_penalty: number;
    time_penalty: number;
    ip_penalty: number;
    consistency_penalty: number;
    is_missing_data: boolean;
    device_category: 'ios' | 'android' | 'desktop' | 'unknown';
    multi_device_detected?: boolean;
    location_mismatch?: boolean;
}

interface FraudScoreResult {
    score: number; // 0.0 to 1.0 (1.0 = Trust, 0.0 = Fraud)
    trust_percentage: number; // 0-100
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
    userAgent: string;
    all_exif_data?: Record<string, any>;
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
 * Calculate fraud trust score (0.0 - 1.0) using 100-point weighted deduction.
 */
export function calculateFraudScore(
    submission: SubmissionData,
    store: StoreLocation
): FraudScoreResult {
    let deductions = 0;
    
    // Determine Device Category
    const ua = submission.userAgent || '';
    let deviceCategory: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
    if (/iPhone|iPad|iPod/i.test(ua)) deviceCategory = 'ios';
    else if (/Android/i.test(ua)) deviceCategory = 'android';
    else if (/Windows|Macintosh|Linux/i.test(ua)) deviceCategory = 'desktop';

    const flags: FraudFlags = {
        distance_penalty: 0,
        time_penalty: 0,
        ip_penalty: 0,
        consistency_penalty: 0,
        is_missing_data: false,
        device_category: deviceCategory
    };

    // 1. MULTI-IMAGE CONSISTENCY CHECK (New)
    if (submission.all_exif_data && Object.keys(submission.all_exif_data).length > 1) {
        const exifEntries = Object.values(submission.all_exif_data);
        
        // A. Device Consistency
        const devices = new Set(exifEntries.map(e => `${e.deviceMake || ''}-${e.deviceModel || ''}`.toLowerCase()));
        if (devices.size > 1) {
            flags.multi_device_detected = true;
            flags.consistency_penalty += 40; // Significant penalty for multi-device
        }

        // B. Location Consistency (Between photos)
        const coords = exifEntries.filter(e => e.lat && e.lng);
        if (coords.length > 1) {
            let maxDist = 0;
            for (let i = 0; i < coords.length; i++) {
                for (let j = i + 1; j < coords.length; j++) {
                    const d = haversineDistance(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng);
                    maxDist = Math.max(maxDist, d);
                }
            }
            if (maxDist > 0.5) { // More than 500m apart
                flags.location_mismatch = true;
                flags.consistency_penalty += 50;
            }
        }
    }
    deductions += flags.consistency_penalty;

    // 2. STORE DISTANCE PENALTY (Max 100 pts)
    if (submission.exif_lat === null || submission.exif_lng === null) {
        flags.is_missing_data = true;
        if (deviceCategory === 'desktop') {
            flags.distance_penalty = 100;
        } else {
            // Standardize -40 penalty for both Android and iOS missing data
            flags.distance_penalty = 40;
        }
    } else if (store.lat !== null && store.lng !== null) {
        const distance = haversineDistance(
            submission.exif_lat, submission.exif_lng,
            store.lat, store.lng
        );
        
        if (distance > 50) flags.distance_penalty = 100;
        else if (distance > 15) flags.distance_penalty = 85;
        else if (distance > 5) flags.distance_penalty = 50;
        else if (distance > 2) flags.distance_penalty = 20;
        else flags.distance_penalty = 0;
    }
    deductions += flags.distance_penalty;

    // 3. TIME PENALTY (Max 95 pts)
    if (submission.exif_timestamp === null) {
        flags.is_missing_data = true;
        flags.time_penalty = 10;
    } else {
        const photoTime = new Date(submission.exif_timestamp).getTime();
        const submitTime = submission.submission_time.getTime();
        const minutesDiff = Math.max(0, (submitTime - photoTime) / (1000 * 60));

        // Restored strict minute-based buckets
        if (minutesDiff > 30) flags.time_penalty = 95;
        else if (minutesDiff > 15) flags.time_penalty = 70;
        else if (minutesDiff > 5) flags.time_penalty = 40;
        else if (minutesDiff > 2) flags.time_penalty = 10;
        else flags.time_penalty = 0;
    }
    deductions += flags.time_penalty;

    // 4. IP PENALTY (Max 15 pts)
    if (submission.ip_city !== null && store.city !== null) {
        const ipCity = submission.ip_city.toLowerCase().trim();
        const storeCity = store.city.toLowerCase().trim();
        const ipRegion = (submission.ip_region || '').toLowerCase().trim();
        const storeState = (store.state || '').toLowerCase().trim();

        const cityMatch = ipCity.includes(storeCity) || storeCity.includes(ipCity);
        const stateMatch = storeState && (ipRegion.includes(storeState) || storeState.includes(ipRegion));

        // NCR (National Capital Region) Handling
        // Noida, Delhi, Gurugram, Gurgaon, Faridabad, Ghaziabad IPs often resolve interchangeably
        const ncrCities = ['noida', 'delhi', 'new delhi', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad', 'greater noida'];
        const isStoreInNCR = ncrCities.some(c => storeCity.includes(c) || storeState.includes(c));
        const isIpInNCR = ncrCities.some(c => ipCity.includes(c) || ipRegion.includes(c));
        const ncrMatch = isStoreInNCR && isIpInNCR;

        if (!cityMatch && !stateMatch && !ncrMatch) {
            flags.ip_penalty = 15;
        }
    } else {
        flags.ip_penalty = 10; // VPN/Missing IP data
    }
    deductions += flags.ip_penalty;

    // Calculate Final Scores
    // Use weighted total but cap at 100
    const trust_percentage = Math.max(0, 100 - deductions);
    const score = trust_percentage / 100;

    return { score, trust_percentage, flags };
}

