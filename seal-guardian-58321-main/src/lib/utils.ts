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
    // Check if it's already an ISO string with timezone (ends with Z or has offset)
    if (dateInput.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateInput)) {
      // It's a UTC timestamp, convert to IST
      date = new Date(dateInput);
    } else {
      // MySQL datetime format without timezone - treat as already IST
      // Just parse it and display as-is without timezone conversion
      const cleanDate = dateInput.replace(' ', 'T');
      date = new Date(cleanDate);
      // Format without timezone conversion since it's already IST
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return "Invalid Date";

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

