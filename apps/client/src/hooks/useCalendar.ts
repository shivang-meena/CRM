import { useModuleQuery } from './useModuleQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCalendarEvent, deleteCalendarEvent, fetchCalendarItems, updateCalendarEvent } from '@/api/calendar';
import { CalendarEventInput, CalendarItemsQuery } from '@/types/calendar';

export function useCalendarItems(query: CalendarItemsQuery) {
  const categories = [...query.categories].sort();
  const canonical = { ...query, categories };
  return useModuleQuery('calendar', { queryKey: ['calendar-items', canonical], queryFn: () => fetchCalendarItems(canonical), refetchInterval: 60000 });
}

export function useCalendarActions() {
  const client = useQueryClient();
  const refresh = () => { void client.invalidateQueries({ queryKey: ['calendar-items'] }); };
  return {
    create: useMutation({ mutationFn: createCalendarEvent, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: CalendarEventInput }) => updateCalendarEvent(id, data), onSuccess: refresh }),
    remove: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => deleteCalendarEvent(id, version), onSuccess: refresh }),
  };
}
