import { HebrewCalendar, HDate, Event } from '@hebcal/core';
import { supabase } from './supabase';
import { isShabbat, isMajorHoliday, getHolidayName } from './hebcal';

export async function generateShifts(startDate: Date, endDate: Date) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isShabbat(currentDate) || isMajorHoliday(currentDate)) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const shifts = dates.flatMap(date => {
    const hebrewName = isShabbat(date) ? 'Shabbat' : getHolidayName(date) || '';
    const isHoliday = !isShabbat(date);

    // Create both early and late shifts
    return [
      {
        date,
        shift_type: 'EARLY',
        hebrew_name: hebrewName,
        is_holiday: isHoliday,
        min_volunteers: 2,
        ideal_volunteers: 3
      },
      {
        date,
        shift_type: 'LATE',
        hebrew_name: hebrewName,
        is_holiday: isHoliday,
        min_volunteers: 2,
        ideal_volunteers: 3
      }
    ];
  });

  const { data, error } = await supabase
    .from('shifts')
    .upsert(shifts, { 
      onConflict: 'date,shift_type',
      ignoreDuplicates: true 
    });

  if (error) {
    console.error('Error generating shifts:', error);
    throw error;
  }

  return data;
}