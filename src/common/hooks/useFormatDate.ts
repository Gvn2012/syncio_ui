import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { formatDate, formatTimeAgo } from '../utils/date';

/**
 * Custom hook that provides a date formatter function pre-configured with user preferences.
 */
export const useFormatDate = () => {
  const { dateFormat, dateSeparator } = useSelector((state: RootState) => state.preferences);

  /**
   * Formats a date using preferred format and separator from Redux store.
   * @param date Date to format
   */
  const format = (date: string | Date) => {
    return formatDate(date, dateFormat, dateSeparator);
  };

  /**
   * Formats a date relatively (e.g., "2h ago").
   * @param date Date to format
   */
  const formatRelative = (date: string | Date) => {
    return formatTimeAgo(date);
  };

  return { format, formatRelative };
};
