import { addDays } from 'date-fns';

interface HebcalEvent {
  title: string;
  date: string;
  category: string;
  subcat: string;
  hebrew: string;
  link: string;
}

export interface ShabbatDate {
  date: Date;
  parasha: string;
  hebrew: string;
}

export async function getUpcomingShabbatDates(startDate: Date, count: number = 12): Promise<ShabbatDate[]> {
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  
  // Request data from HebCal API
  const response = await fetch(
    `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&i=off&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on`
  );
  
  const data = await response.json();
  const events: HebcalEvent[] = data.items;
  
  return events
    .filter(event => event.category === 'parashat')
    .slice(0, count)
    .map(event => ({
      // Add one day to the date to get Saturday morning instead of Friday evening
      date: addDays(new Date(event.date), 1),
      parasha: event.title.replace('Parashat ', ''),
      hebrew: event.hebrew
    }));
}