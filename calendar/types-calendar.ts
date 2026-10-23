// apps/client/src/types/calendar.ts
export type CalendarCategory = 'EVENT' | 'LEAD' | 'REMINDER' | 'MEETING' | 'HOLIDAY' | 'SERVICE';
export type CalendarSource = 'CALENDAR_EVENT' | 'LEAD_FOLLOWUP' | 'REMINDER' | 'MEETING';
export type CalendarView = 'month' | 'day' | 'list';

export interface CalendarItem {
  key: string;
  sourceId: string;
  source: CalendarSource;
  category: CalendarCategory;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  leadId: string | null;
  status: string | null;
  version: number | null;
  editable: boolean;
}

export interface CalendarItemsQuery { from: string; to: string; categories: CalendarCategory[] }
export interface CalendarEventInput { title: string; category: 'EVENT' | 'HOLIDAY' | 'SERVICE'; description?: string | null; startAt: string; endAt: string; allDay: boolean; timezone: 'Asia/Kolkata'; requestKey?: string; version?: number }

export const CALENDAR_CATEGORIES: CalendarCategory[] = ['EVENT', 'LEAD', 'REMINDER', 'MEETING', 'HOLIDAY', 'SERVICE'];
export const CALENDAR_CATEGORY_LABELS: Record<CalendarCategory, string> = { EVENT: 'Event', LEAD: 'Lead', REMINDER: 'Reminder', MEETING: 'Meeting', HOLIDAY: 'Holiday', SERVICE: 'Service' };
export const CALENDAR_CATEGORY_COLORS: Record<CalendarCategory, string> = { EVENT: '#F28A24', LEAD: '#1E9B68', REMINDER: '#7C5BC7', MEETING: '#D84B63', HOLIDAY: '#12A8C5', SERVICE: '#778196' };
