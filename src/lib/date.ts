import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM yyyy \'at\' hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}; 