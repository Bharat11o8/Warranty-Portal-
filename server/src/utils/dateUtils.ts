/**
 * IST (Indian Standard Time) Date Utilities
 * 
 * These functions ensure consistent IST formatting regardless of server timezone.
 * Uses JavaScript's built-in `timeZone` option for host-agnostic behavior.
 */

/**
 * Format a date to IST date string (e.g., "03 Feb 2026")
 */
export function formatDateIST(date: Date = new Date()): string {
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Format a date to IST datetime string (e.g., "03 Feb 2026, 04:30 pm")
 */
export function formatDateTimeIST(date: Date = new Date()): string {
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Get current IST timestamp as MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 */
export function getISTTimestamp(): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
    };

    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date());
    const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/**
 * Get current year in IST
 */
export function getISTYear(): number {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getFullYear();
}
