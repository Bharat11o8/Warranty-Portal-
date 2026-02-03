import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Convert data to CSV format
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle strings with commas, quotes, or newlines
        if (typeof value === 'string') {
          const escaped = value.replace(/"/g, '""'); // Escape double quotes
          return `"${escaped}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function getWarrantyExpiration(createdAt: string | Date | null | undefined, warrantyType?: string) {
  if (!createdAt) return { expirationDate: null, daysLeft: 0, isExpired: false };

  // Parse warranty duration from type (e.g., "5", "2+3", "1+1")
  let warrantyYears = 1; // Default
  if (warrantyType) {
    if (warrantyType.includes('+')) {
      // Handle "2+3", "1+2" etc.
      warrantyYears = warrantyType.split('+')
        .map(part => parseInt(part.trim()) || 0)
        .reduce((sum, current) => sum + current, 0);
    } else {
      // Handle simple numbers "5", "3"
      warrantyYears = parseInt(warrantyType) || 1;
    }
  }

  const registeredDate = new Date(createdAt);
  const expirationDate = new Date(registeredDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + warrantyYears);

  const today = new Date();
  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    expirationDate,
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    isExpired: daysLeft <= 0
  };
}

export function formatToIST(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return "N/A";

  let date: Date;

  // Handle MySQL datetime strings (e.g., "2026-01-22 10:00:00" or "2026-01-22T10:00:00.000Z")
  if (typeof dateInput === 'string') {
    // MySQL datetime format without timezone - append Z to treat as UTC
    // This ensures consistent conversion to IST regardless of server timezone
    if (!dateInput.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateInput)) {
      const cleanDate = dateInput.replace(' ', 'T') + 'Z';
      date = new Date(cleanDate);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return "Invalid Date";

  // ALWAYS apply IST timezone for consistent display
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Optimize Cloudinary image URLs with automatic format and quality.
 * Adds f_auto (format), q_auto (quality), and optional width transformations.
 * 
 * @param url - The original Cloudinary URL
 * @param options - Optional width for responsive images
 * @returns Optimized URL or original if not a Cloudinary URL
 */
export function optimizeCloudinaryUrl(url: string | undefined | null, options?: { width?: number }): string {
  if (!url) return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Check if already has transformations
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Build transformation string
  let transformations = 'f_auto,q_auto';
  if (options?.width) {
    transformations += `,w_${options.width}`;
  }

  // Insert transformations after /upload/
  const beforeUpload = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Check if there are existing transformations (they start with letters like v1234, w_, h_, c_, etc.)
  // If the path after upload starts with 'v' followed by numbers, it's a version, not a transformation
  if (/^v\d+\//.test(afterUpload)) {
    // Has version number, insert transformations before it
    return `${beforeUpload}${transformations}/${afterUpload}`;
  } else if (/^[a-z]/.test(afterUpload)) {
    // Already has transformations, prepend ours
    return `${beforeUpload}${transformations},${afterUpload}`;
  } else {
    // No transformations, add ours
    return `${beforeUpload}${transformations}/${afterUpload}`;
  }
}
