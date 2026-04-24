import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { formatDate, formatTimeAgo } from '../utils/date';

export const useFormatDate = () => {
  const { dateFormat, dateSeparator } = useSelector((state: RootState) => state.preferences);


  const format = (date: string | Date) => {
    return formatDate(date, dateFormat, dateSeparator);
  };


  const formatRelative = (date: string | Date) => {
    return formatTimeAgo(date, dateFormat, dateSeparator);
  };

  return { format, formatRelative };
};
