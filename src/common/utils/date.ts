/**
 * Formats a date string or Date object into a preferred format
 * @param date The date to format
 * @param format The desired format: 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY'
 * @param separator The desired separator: '-' | '/'
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date, 
  format: 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY' = 'DD-MM-YYYY',
  separator: '-' | '/' = '-'
): string => {
  const d = new Date(date);
  
  // Handle invalid dates
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
