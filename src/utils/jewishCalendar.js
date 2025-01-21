import { format, addDays, isAfter, isBefore, isSaturday } from 'date-fns';

// Helper to check if a date is Shabbat (Saturday)
export const isShabbat = (date) => {
  return isSaturday(date);
};

// Major Jewish holidays in 2024
// Note: Holidays begin at sundown the evening before
export const HOLIDAYS_2024 = [
  { name: 'Tu BiShvat', date: '2024-01-25', hasEveningShift: false },
  { name: 'Purim', date: '2024-03-24', hasEveningShift: true },
  { name: 'Pesach I', date: '2024-04-23', hasEveningShift: true },
  { name: 'Pesach II', date: '2024-04-24', hasEveningShift: false },
  { name: 'Pesach VII', date: '2024-04-29', hasEveningShift: true },
  { name: 'Pesach VIII', date: '2024-04-30', hasEveningShift: false },
  { name: 'Shavuot I', date: '2024-06-12', hasEveningShift: true },
  { name: 'Shavuot II', date: '2024-06-13', hasEveningShift: false },
  { name: 'Rosh Hashana I', date: '2024-10-03', hasEveningShift: true },
  { name: 'Rosh Hashana II', date: '2024-10-04', hasEveningShift: false },
  { name: 'Yom Kippur', date: '2024-10-12', hasEveningShift: true },
  { name: 'Sukkot I', date: '2024-10-17', hasEveningShift: true },
  { name: 'Sukkot II', date: '2024-10-18', hasEveningShift: false },
  { name: 'Shemini Atzeret', date: '2024-10-24', hasEveningShift: true },
  { name: 'Simchat Torah', date: '2024-10-25', hasEveningShift: false }
];

export const isJewishHoliday = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return HOLIDAYS_2024.some(holiday => holiday.date === dateStr);
};

export const getHolidayName = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = HOLIDAYS_2024.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
};

export const hasEveningShift = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = HOLIDAYS_2024.find(h => h.date === dateStr);
  return holiday ? holiday.hasEveningShift : false;
};

export const isShiftDay = (date) => {
  return isShabbat(date) || isJewishHoliday(date);
};

// Get the next valid shift dates
export const getNextShiftDates = (count = 5) => {
  const dates = [];
  let currentDate = new Date();
  
  while (dates.length < count) {
    if (isShiftDay(currentDate)) {
      dates.push(new Date(currentDate));
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};