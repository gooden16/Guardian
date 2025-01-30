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
  
  const response = await fetch(
    `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&i=off&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on`
  );
  
  const data = await response.json();
  const events: HebcalEvent[] = data.items;
  
  return events
    .filter(event => event.category === 'parashat')
    .slice(0, count)
    .map(event => ({
      date: new Date(event.date),
      parasha: event.title.replace('Parashat ', ''),
      hebrew: event.hebrew
    }));
}