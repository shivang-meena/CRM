import { api } from './client';
import { CalendarEventInput, CalendarItem, CalendarItemsQuery } from '@/types/calendar';

export async function fetchCalendarItems(query: CalendarItemsQuery) { return (await api.get<{ items: CalendarItem[] }>('/calendar/items', { params: { from: query.from, to: query.to, categories: query.categories.join(',') } })).data; }
export async function createCalendarEvent(data: CalendarEventInput) { return (await api.post<CalendarItem>('/calendar/events', data)).data; }
export async function updateCalendarEvent(id: string, data: CalendarEventInput) { return (await api.patch<CalendarItem>(`/calendar/events/${id}`, data)).data; }
export async function deleteCalendarEvent(id: string, version: number) { return (await api.delete(`/calendar/events/${id}`, { data: { version } })).data; }
