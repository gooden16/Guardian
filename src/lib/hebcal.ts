import { format } from 'date-fns';

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

export async function getUpcomingShabbatDates(startDate: Date, endDate: Date): Promise<ShabbatDate[]> {
  // Collect all year+month combos in the range
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const results = await Promise.all(
    months.map(({ year, month }) =>
      fetch(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&i=off&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on`
      ).then((r) => r.json())
    )
  );

  const allEvents: HebcalEvent[] = results.flatMap((data) => data.items ?? []);

  // Parse a date string as local time (avoid UTC offset shifting the day)
  const parseLocal = (str: string) => {
    const [y, m, d] = str.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Regular weekly parasha (Friday → add 1 day to get Saturday)
  const parashatEvents = allEvents
    .filter((e) => e.category === 'parashat')
    .map((e) => ({
      date: parseLocal(e.date),
      parasha: e.title.replace('Parashat ', ''),
      hebrew: e.hebrew,
    }));

  // All holiday events (Rosh Hashana, Yom Kippur, Pesach, Shavuot, Purim, etc.)
  // Exclude candle lighting / havdalah / omer counts which aren't shift days
  const skipTitles = /candle|havdalah|omer|fast ends|fast begins/i;
  const holidayEvents = allEvents
    .filter((e) => e.category === 'holiday' && !skipTitles.test(e.title))
    .map((e) => ({
      date: parseLocal(e.date),
      parasha: e.title,
      hebrew: e.hebrew,
    }));

  // Merge, deduplicate by date string
  const seen = new Set<string>();
  return [...parashatEvents, ...holidayEvents]
    .filter((e) => {
      const key = format(e.date, 'yyyy-MM-dd');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Parse "Q2 2026" → { startDate, endDate, name } */
export function parseQuarterName(input: string): { name: string; startDate: Date; endDate: Date } | null {
  const match = input.trim().match(/^Q([1-4])\s+(\d{4})$/i);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const startMonth = (q - 1) * 3; // 0-indexed
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // last day of quarter
  return { name: `Q${q} ${year}`, startDate, endDate };
}
