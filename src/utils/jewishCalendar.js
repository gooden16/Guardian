import { format, addDays, isSaturday } from 'date-fns';

// Helper to check if a date is Shabbat (Saturday)
export const isShabbat = (date) => {
  return isSaturday(date);
};

// Major Jewish holidays in 2025
// Note: Holidays begin at sundown the evening before
export const HOLIDAYS_2025 = [
  { name: 'Tu BiShvat', date: '2025-02-13', hasEveningShift: false },
  { name: 'Purim', date: '2025-03-15', hasEveningShift: true },
  { name: 'Pesach I', date: '2025-04-13', hasEveningShift: true },
  { name: 'Pesach II', date: '2025-04-14', hasEveningShift: false },
  { name: 'Pesach VII', date: '2025-04-20', hasEveningShift: true },
  { name: 'Pesach VIII', date: '2025-04-21', hasEveningShift: false },
  { name: 'Shavuot I', date: '2025-06-02', hasEveningShift: true },
  { name: 'Shavuot II', date: '2025-06-03', hasEveningShift: false },
  { name: 'Rosh Hashana I', date: '2025-09-23', hasEveningShift: true },
  { name: 'Rosh Hashana II', date: '2025-09-24', hasEveningShift: false },
  { name: 'Yom Kippur', date: '2025-10-02', hasEveningShift: true },
  { name: 'Sukkot I', date: '2025-10-07', hasEveningShift: true },
  { name: 'Sukkot II', date: '2025-10-08', hasEveningShift: false },
  { name: 'Shemini Atzeret', date: '2025-10-14', hasEveningShift: true },
  { name: 'Simchat Torah', date: '2025-10-15', hasEveningShift: false }
];

export const isJewishHoliday = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return HOLIDAYS_2025.some(holiday => holiday.date === dateStr);
};

export const getHolidayName = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = HOLIDAYS_2025.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
};

export const hasEveningShift = (date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = HOLIDAYS_2025.find(h => h.date === dateStr);
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