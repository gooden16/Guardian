export const formatTime = (time: string): string => {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getQuarterDates = (date: Date = new Date()): { start: Date; end: Date } => {
  const quarter = Math.floor(date.getMonth() / 3);
  const startDate = new Date(date.getFullYear(), quarter * 3, 1);
  const endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
  return { start: startDate, end: endDate };
};