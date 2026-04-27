/**
 * Parses a date string and ensures it's treated as UTC if no timezone is present
 */
export const parseUTCDate = (date: string | Date): Date => {
  if (date instanceof Date) return date;
  
  let dateToParse = date;
  if (!date.includes('Z') && !date.includes('+')) {
    // If it has a space, it's likely "YYYY-MM-DD HH:MM:SS"
    if (date.includes(' ')) {
      dateToParse = date.replace(' ', 'T') + 'Z';
    } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Just a date
      dateToParse = date + 'T00:00:00Z';
    } else if (date.includes('T') && !date.endsWith('Z')) {
      dateToParse = date + 'Z';
    }
  }
  
  return new Date(dateToParse);
};

export const formatDate = (
  date: string | Date, 
  format: 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY' = 'DD-MM-YYYY',
  separator: '-' | '/' = '-'
): string => {
  const d = parseUTCDate(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  
  switch (format) {
    case 'YYYY-MM-DD':
      return [year, month, day].join(separator);
    case 'MM-DD-YYYY':
      return [month, day, year].join(separator);
    case 'DD-MM-YYYY':
    default:
      return [day, month, year].join(separator);
  }
};

export const formatTimeAgo = (
  date: string | Date,
  format: 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY' = 'DD-MM-YYYY',
  separator: '-' | '/' = '-'
): string => {
  const d = parseUTCDate(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return formatDate(d, format, separator);
};
