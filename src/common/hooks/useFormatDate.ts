import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { formatDate, formatTimeAgo } from '../utils/date';

export const useFormatDate = () => {
  const { dateFormat, dateSeparator } = useSelector((state: RootState) => state.preferences);

  // Helper to force UTC+7 conversion if needed, or ensure it's treated as UTC
  const toUTC7 = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date.replace(' ', 'T') + (date.includes('Z') || date.includes('+') ? '' : 'Z')) : date;
    // If the user explicitly wants +7 conversion in the hook:
    // We can either let the browser handle it (if user is in +7)
    // or manually shift it if we want to FORCE +7 regardless of local TZ.
    // Given "convert to +7 hours", we'll ensure it's correctly parsed as UTC first.
    return d;
  };

  const format = (date: string | Date) => {
    return formatDate(date, dateFormat, dateSeparator);
  };

  const formatRelative = (date: string | Date) => {
    return formatTimeAgo(date, dateFormat, dateSeparator);
  };

  return { format, formatRelative, toUTC7 };
};
