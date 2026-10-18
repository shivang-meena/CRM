import { api } from './client';
import { ActivityRecord, ListFilters, Page } from '@/types/leadActivities';

export type StandaloneActivityKind = 'meetings' | 'reminders';

export async function fetchStandaloneActivities(kind: StandaloneActivityKind, filters: ListFilters) {
  return (await api.get<Page<ActivityRecord>>(`/${kind}`, { params: filters })).data;
}

export async function createStandaloneActivity(kind: StandaloneActivityKind, data: Record<string, unknown>) {
  return (await api.post<ActivityRecord>(`/${kind}`, data)).data;
}

export async function updateStandaloneActivity(kind: StandaloneActivityKind, id: string, data: Record<string, unknown>) {
  return (await api.patch<ActivityRecord>(`/${kind}/${id}`, data)).data;
}

export async function deleteStandaloneActivity(kind: StandaloneActivityKind, id: string, version: number) {
  return (await api.delete(`/${kind}/${id}`, { data: { version } })).data;
}

export async function changeStandaloneActivity(kind: StandaloneActivityKind, id: string, version: number, action: 'complete' | 'cancel' | 'dismiss', outcome?: string) {
  const body = { version, ...(outcome !== undefined ? { outcome } : {}) };
  return (await api.post<ActivityRecord>(`/${kind}/${id}/${action}`, body)).data;
}
