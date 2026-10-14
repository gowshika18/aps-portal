/**
 * Timezone and Weekend Utilities for Asia/Kolkata
 */

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns current date and time formatted in Asia/Kolkata timezone
 */
export function getKolkataDate(date: Date = new Date()): Date {
  const dateStr = date.toLocaleString('en-US', { timeZone: APP_TIMEZONE });
  return new Date(dateStr);
}

/**
 * Returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday in Asia/Kolkata
 */
export function getKolkataDayOfWeek(date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  });
  const weekday = formatter.format(date);
  switch (weekday) {
    case 'Sun': return 0;
    case 'Mon': return 1;
    case 'Tue': return 2;
    case 'Wed': return 3;
    case 'Thu': return 4;
    case 'Fri': return 5;
    case 'Sat': return 6;
    default: return new Date().getDay();
  }
}

/**
 * Check if given date is Saturday (6) or Sunday (0) in Asia/Kolkata
 */
export function isWeekendInKolkata(date: Date = new Date()): boolean {
  const day = getKolkataDayOfWeek(date);
  return day === 0 || day === 6;
}

/**
 * Get week start date (Monday) and week end date (Sunday) for a given date in Asia/Kolkata
 */
export function getKolkataWeekRange(date: Date = new Date()): { weekStartDate: Date; weekEndDate: Date } {
  const kDate = getKolkataDate(date);
  const day = kDate.getDay();
  // If Sunday (0), distance from Monday is 6 days back
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(kDate);
  monday.setDate(kDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { weekStartDate: monday, weekEndDate: sunday };
}
