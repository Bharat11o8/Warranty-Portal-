interface IPGeoResult {
    ip: string;
    city: string | null;
    region: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    org: string | null;
}

/**
 * Geolocate an IP address using ipinfo.io.
 * Free tier: 50K requests/month. Set IPINFO_TOKEN in .env for paid plan.
 * 
 * @param ip - The IP address to geolocate
 * @returns Geolocation data or nulls on failure
 */
export async function geolocateIP(ip: string): Promise<IPGeoResult> {
    const result: IPGeoResult = {
        ip,
        city: null,
        region: null,
        country: null,
        lat: null,
        lng: null,
        org: null,
    };

    // Skip private/localhost IPs
    if (isPrivateIP(ip)) {
        console.log(`[IPGeolocate] Skipping private IP: ${ip}`);
        return result;
    }

    try {
        const token = process.env.IPINFO_TOKEN || '';
        const url = token
            ? `https://ipinfo.io/${ip}?token=${token}`
            : `https://ipinfo.io/${ip}/json`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
            console.warn(`[IPGeolocate] API returned ${response.status} for IP: ${ip}`);
            return result;
        }

        const data = await response.json();

        result.city = data.city || null;
        result.region = data.region || null;
        result.country = data.country || null;
        result.org = data.org || null;

        // ipinfo.io returns loc as "lat,lng" string
        if (data.loc) {
            const [lat, lng] = data.loc.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                result.lat = lat;
                result.lng = lng;
            }
        }
    } catch (err) {
        console.warn(`[IPGeolocate] Failed to geolocate IP ${ip}:`, err);
        // Return result with nulls — don't throw
    }

    return result;
}

/**
 * Extract the real client IP from request headers.
 * Handles reverse proxy setups (nginx, cloudflare, etc.)
 */
export function getClientIP(req: any): string {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
        return ips[0].trim();
    }

    // CF-Connecting-IP for Cloudflare
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) {
        return typeof cfIp === 'string' ? cfIp : cfIp[0];
    }

    // X-Real-IP for nginx
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return typeof realIp === 'string' ? realIp : realIp[0];
    }

    // Fallback to remoteAddress
    return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

/**
 * Check if an IP address is private/localhost
 */
function isPrivateIP(ip: string): boolean {
    return (
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip === 'localhost' ||
        ip.startsWith('10.') ||
        ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') ||
        ip.startsWith('172.20.') ||
        ip.startsWith('172.21.') ||
        ip.startsWith('172.22.') ||
        ip.startsWith('172.23.') ||
        ip.startsWith('172.24.') ||
        ip.startsWith('172.25.') ||
        ip.startsWith('172.26.') ||
        ip.startsWith('172.27.') ||
        ip.startsWith('172.28.') ||
        ip.startsWith('172.29.') ||
        ip.startsWith('172.30.') ||
        ip.startsWith('172.31.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('0.0.0.') ||
        ip.startsWith('::ffff:127.') ||
        ip.startsWith('::ffff:10.') ||
        ip.startsWith('::ffff:192.168.')
    );
}
