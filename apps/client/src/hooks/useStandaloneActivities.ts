import { useModuleQuery } from './useModuleQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeStandaloneActivity, createStandaloneActivity, deleteStandaloneActivity, fetchStandaloneActivities, StandaloneActivityKind, updateStandaloneActivity } from '@/api/standaloneActivities';
import { ListFilters } from '@/types/leadActivities';

export function useStandaloneActivities(kind: StandaloneActivityKind, filters: ListFilters) {
  return useModuleQuery(kind === 'meetings' ? 'meeting' : 'reminder', { queryKey: ['standalone-' + kind, filters], queryFn: () => fetchStandaloneActivities(kind, filters), refetchInterval: 60000 });
}

export function useStandaloneActivityActions() {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['standalone-meetings'] }),
      queryClient.invalidateQueries({ queryKey: ['standalone-reminders'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-lead-activities'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };
  return {
    createMeeting: useMutation({ mutationFn: (data: Record<string, unknown>) => createStandaloneActivity('meetings', data), onSuccess: refresh }),
    updateMeeting: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateStandaloneActivity('meetings', id, data), onSuccess: refresh }),
    deleteMeeting: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => deleteStandaloneActivity('meetings', id, version), onSuccess: refresh }),
    completeMeeting: useMutation({ mutationFn: ({ id, version, outcome }: { id: string; version: number; outcome?: string }) => changeStandaloneActivity('meetings', id, version, 'complete', outcome), onSuccess: refresh }),
    cancelMeeting: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => changeStandaloneActivity('meetings', id, version, 'cancel'), onSuccess: refresh }),
    createReminder: useMutation({ mutationFn: (data: Record<string, unknown>) => createStandaloneActivity('reminders', data), onSuccess: refresh }),
    updateReminder: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateStandaloneActivity('reminders', id, data), onSuccess: refresh }),
    deleteReminder: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => deleteStandaloneActivity('reminders', id, version), onSuccess: refresh }),
    dismissReminder: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => changeStandaloneActivity('reminders', id, version, 'dismiss'), onSuccess: refresh }),
    cancelReminder: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => changeStandaloneActivity('reminders', id, version, 'cancel'), onSuccess: refresh }),
  };
}
