/**
 * Utility functions for CSV export
 */

export interface CSVColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

/**
 * Convert data to CSV format and trigger download
 */
export const exportToCSV = (
  data: Record<string, unknown>[],
  columns: CSVColumn[],
  filename: string
): void => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map((col) => col.label).join(',');

  // Create CSV rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value: unknown = item[col.key];

        // Apply custom formatting if provided
        if (col.format && value !== undefined && value !== null) {
          value = col.format(value);
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Convert to string and escape
        const stringValue = String(value);

        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Format date for CSV export
 */
export const formatDateForCSV = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency for CSV export
 */
export const formatCurrencyForCSV = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
