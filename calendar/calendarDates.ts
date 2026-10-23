// apps/client/src/calendar/calendarDates.ts
import { CalendarItem, CalendarView } from '@/types/calendar';

const IST_MINUTES = 330;
const DAY_MS = 86400000;
const pad = (value: number) => String(value).padStart(2, '0');

export function todayIstKey(now = new Date()): string {
  const shifted = new Date(now.getTime() + IST_MINUTES * 60000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error('Invalid calendar date key.');
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function dateKeyToUtc(key: string): Date { const { year, month, day } = parseDateKey(key); return new Date(Date.UTC(year, month - 1, day)); }
export function dateKeyToIstMidnightIso(key: string): string { return new Date(dateKeyToUtc(key).getTime() - IST_MINUTES * 60000).toISOString(); }
export function dateTimeKeyToIstIso(key: string, time: string): string { const [hour, minute] = time.split(':').map(Number); return new Date(dateKeyToUtc(key).getTime() + (hour * 60 + minute - IST_MINUTES) * 60000).toISOString(); }
export function addDays(key: string, amount: number): string { const date = new Date(dateKeyToUtc(key).getTime() + amount * DAY_MS); return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`; }
export function addMonths(key: string, amount: number): string { const { year, month, day } = parseDateKey(key); const index = year * 12 + month - 1 + amount; const nextYear = Math.floor(index / 12); const nextMonth = index % 12 + 1; const maxDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate(); return `${nextYear}-${pad(nextMonth)}-${pad(Math.min(day, maxDay))}`; }
export function firstDayOfMonth(key: string): string { const { year, month } = parseDateKey(key); return `${year}-${pad(month)}-01`; }
export function lastDayOfMonth(key: string): string { const { year, month } = parseDateKey(key); return `${year}-${pad(month)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate())}`; }
export function monthGridKeys(key: string): string[] { const first = firstDayOfMonth(key); const offset = dateKeyToUtc(first).getUTCDay(); const days = dateKeyToUtc(lastDayOfMonth(key)).getUTCDate(); const cells = Math.max(35, Math.ceil((offset + days) / 7) * 7); return Array.from({ length: cells }, (_, index) => addDays(first, index - offset)); }
export function visibleRange(view: CalendarView, selected: string): { from: string; to: string } { if (view === 'day') return { from: dateKeyToIstMidnightIso(selected), to: dateKeyToIstMidnightIso(addDays(selected, 1)) }; if (view === 'list') { const first = firstDayOfMonth(selected); return { from: dateKeyToIstMidnightIso(first), to: dateKeyToIstMidnightIso(addDays(first, dateKeyToUtc(lastDayOfMonth(selected)).getUTCDate())) }; } const grid = monthGridKeys(selected); return { from: dateKeyToIstMidnightIso(grid[0]), to: dateKeyToIstMidnightIso(addDays(grid[grid.length - 1], 1)) }; }
export function overlapsIstDay(item: CalendarItem, key: string): boolean { const from = dateKeyToIstMidnightIso(key); const to = dateKeyToIstMidnightIso(addDays(key, 1)); if (!item.endAt) return item.startAt >= from && item.startAt < to; return item.startAt < to && item.endAt > from; }
export function formatMonthHeading(key: string): string { return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateKeyToUtc(key)); }
export function formatDayHeading(key: string): string { return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateKeyToUtc(key)); }
export function formatDateKey(key: string): string { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dateKeyToUtc(key)); }
export function formatCalendarTime(iso: string): string { return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date(iso)); }
export function formatCalendarDate(iso: string): string { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso)); }
export function itemRangeLabel(item: CalendarItem): string { if (item.allDay && item.endAt) return `${formatDateKey(todayIstKey(new Date(item.startAt)))} – ${formatDateKey(addDays(todayIstKey(new Date(item.endAt)), -1))}`; if (!item.endAt) return formatCalendarTime(item.startAt); return `${formatCalendarDate(item.startAt)} ${formatCalendarTime(item.startAt)} – ${formatCalendarDate(item.endAt)} ${formatCalendarTime(item.endAt)}`; }
