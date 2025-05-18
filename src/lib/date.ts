import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM yyyy \'at\' hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}; 

export const formatDateOnly = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const formatTimeOnly = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'hh:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}; 