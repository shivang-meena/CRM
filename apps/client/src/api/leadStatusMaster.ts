import { api } from './client';
import {
  LeadStatusMasterEntry,
  SaveLeadStatusMasterPayload,
} from '@/types/leadStatus';

export const LEAD_STATUS_MASTER_KEY = ['settings', 'lead-statuses'] as const;

export async function fetchLeadStatusMaster() {
  return (await api.get<LeadStatusMasterEntry[]>('/settings/lead-statuses')).data;
}

export async function saveLeadStatusMaster(payload: SaveLeadStatusMasterPayload) {
  const { id, ...data } = payload;
  return id
    ? (await api.patch<LeadStatusMasterEntry>(`/settings/lead-statuses/${id}`, data)).data
    : (await api.post<LeadStatusMasterEntry>('/settings/lead-statuses', data)).data;
}

export async function reorderLeadStatuses(ids: string[]) {
  return (await api.put<LeadStatusMasterEntry[]>(
    '/settings/lead-statuses/reorder',
    { ids },
  )).data;
}

export async function deleteLeadStatusMaster(id: string) {
  return (await api.delete<{ success: boolean }>(
    `/settings/lead-statuses/${id}`,
  )).data;
}
