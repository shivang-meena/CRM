import { Lead, LeadInput } from '@/types/lead';
import { api } from './client';

export async function fetchLeads(search: string): Promise<Lead[]> {
  const res = await api.get<Lead[]>('/leads', { params: search ? { search } : {} });
  return res.data;
}
export async function fetchLead(id: string): Promise<Lead> {
  const res = await api.get<Lead>(`/leads/${id}`);
  return res.data;
}
export async function createLeadRequest(data: LeadInput): Promise<Lead> {
  const res = await api.post<Lead>('/leads', data, { timeout: 30_000 });
  return res.data;
}
export async function updateLeadRequest(id: string, data: Partial<LeadInput>): Promise<Lead> {
  const res = await api.patch<Lead>(`/leads/${id}`, data, { timeout: 30_000 });
  return res.data;
}
export async function deleteLeadRequest(id: string, version: number): Promise<void> {
  await api.delete(`/leads/${id}`, { data: { version } });
}
