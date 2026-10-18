import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivities, fetchDashboardActivities, fetchHistory, fetchSectionSummary } from '@/api/leadActivities';
import { ActivityKind, ListFilters } from '@/types/leadActivities';
export function useSectionSummary(id: string) { return useQuery({ queryKey: ['lead-sections-summary', id], queryFn: () => fetchSectionSummary(id), enabled: !!id }); }
export function useActivities(id: string, kind: ActivityKind, filters: ListFilters, enabled = true) { return useQuery({ queryKey: ['lead-' + kind, id, filters], queryFn: () => fetchActivities(id, kind, filters), enabled: !!id && enabled }); }
export function useHistory(id: string, filters: ListFilters) { return useQuery({ queryKey: ['lead-history', id, filters], queryFn: () => fetchHistory(id, filters), enabled: !!id }); }
export function useDashboardActivities(kind: ActivityKind, filters: ListFilters) { return useQuery({ queryKey: ['dashboard-lead-activities', kind, filters], queryFn: () => fetchDashboardActivities(kind, filters), refetchInterval: 60000 }); }
export function useCrmMutation<T>(leadId: string, fn: (input: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: async () => {
    await Promise.all([
      ...['customers', 'customer', 'customer-by-lead'].map(key =>
        qc.invalidateQueries({ queryKey: [key] }),
      ),
      ...['lead-followups','lead-tasks','lead-meetings','lead-reminders','lead-sections-summary','lead-history','lead-documents','lead-document','lead'].map(key => qc.invalidateQueries({ queryKey: [key, leadId] })),
      qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['dashboard-lead-activities'] }),
      qc.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  } });
}
export function useSubmissionKey() {
  const state = useRef({ signature: '', key: '' });
  return (body: unknown) => {
    const signature = JSON.stringify(body);
    if (state.current.signature !== signature || !state.current.key) state.current = { signature, key: 'crm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) };
    return state.current.key;
  };
}
