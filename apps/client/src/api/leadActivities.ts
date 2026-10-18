import { api } from './client';
import { ActivityKind, ActivityRecord, HistoryRecord, ListFilters, Page, SectionSummary } from '@/types/leadActivities';
export async function fetchSectionSummary(leadId: string) { return (await api.get<SectionSummary>(`/leads/${leadId}/sections-summary`)).data; }
export async function fetchActivities(leadId: string, kind: ActivityKind, filters: ListFilters) { return (await api.get<Page<ActivityRecord>>(`/leads/${leadId}/${kind}`, { params: filters })).data; }
export async function saveActivity(leadId: string, kind: ActivityKind, body: Record<string, unknown>, record?: ActivityRecord) {
  const url = `/leads/${leadId}/${kind}`;
  return record ? (await api.patch<ActivityRecord>(url + '/' + record.id, { ...body, version: record.version })).data : (await api.post<ActivityRecord>(url, body)).data;
}
export async function changeActivity(leadId: string, kind: ActivityKind, row: ActivityRecord, action: string, outcome?: string) {
  const url = `/leads/${leadId}/${kind}/${row.id}`, body = { version: row.version, outcome };
  return action === 'delete' ? (await api.delete(url, { data: body })).data : (await api.post<ActivityRecord>(url + '/' + action, body)).data;
}
export async function fetchHistory(leadId: string, filters: ListFilters) { return (await api.get<Page<HistoryRecord>>(`/leads/${leadId}/history`, { params: filters })).data; }
export async function fetchDashboardActivities(kind: ActivityKind, filters: ListFilters) { return (await api.get<Page<ActivityRecord>>('/dashboard/lead-activities', { params: { ...filters, type: kind } })).data; }
