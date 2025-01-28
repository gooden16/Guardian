import { HebrewCalendar, HDate, Location, Event } from '@hebcal/core';

// New York coordinates for zmanim calculations
const NYC = new Location(40.7128, -74.0060, 'America/New_York', 'New York', 'US', 33);

// Major holidays we care about
const MAJOR_HOLIDAYS = [
  'Rosh Hashana',
  'Yom Kippur',
  'Sukkot',
  'Shmini Atzeret',
  'Simchat Torah',
  'Pesach',
  'Shavuot',
  'Purim'
];

export function getHebrewDate(date: Date): string {
  const hdate = new HDate(date);
  return hdate.toString();
}

export function isShabbat(date: Date): boolean {
  const hdate = new HDate(date);
  return hdate.getDay() === 6; // 6 = Saturday
}

export function isMajorHoliday(date: Date): boolean {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    location: NYC,
  });

  return events.some(ev => 
    MAJOR_HOLIDAYS.some(holiday => 
      ev.getDesc().includes(holiday)
    )
  );
}

export function getHolidayName(date: Date): string | null {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    location: NYC,
  });

  const holiday = events.find(ev => 
    MAJOR_HOLIDAYS.some(h => ev.getDesc().includes(h))
  );

  return holiday ? holiday.render('en') : null;
}

export function getHolidays(startDate: Date, endDate: Date): Event[] {
  const events = HebrewCalendar.calendar({
    start: startDate,
    end: endDate,
    location: NYC,
    sedrot: true,
    candlelighting: true,
    havdalahMins: 42,
  });

  return events;
}

export function isHoliday(date: Date): boolean {
  return isShabbat(date) || isMajorHoliday(date);
}

export function getParasha(date: Date): string | null {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    sedrot: true,
  });

  const parasha = events.find(ev => ev.getDesc().includes('Parashat'));
  return parasha ? parasha.render('en') : null;
}