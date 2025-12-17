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

export function getWarrantyExpiration(createdAt: string | Date | null | undefined) {
  if (!createdAt) return { expirationDate: null, daysLeft: 0, isExpired: false };

  const registeredDate = new Date(createdAt);
  const expirationDate = new Date(registeredDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 2); // 2 years warranty

  const today = new Date();
  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    expirationDate,
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    isExpired: daysLeft <= 0
  };
}
