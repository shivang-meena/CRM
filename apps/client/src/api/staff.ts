import { api } from '@/api/client';
import { StaffFilters, StaffMember, StaffPage, StaffPayload, StaffStatus, UpdateStaffPayload } from '@/types/staff';

export async function fetchStaff(filters: StaffFilters): Promise<StaffPage> {
  const response = await api.get<StaffPage>('/staff', { params: filters });
  return response.data;
}

export async function createStaff(payload: StaffPayload): Promise<StaffMember> {
  const response = await api.post<StaffMember>('/staff', payload);
  return response.data;
}

export async function updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffMember> {
  const response = await api.patch<StaffMember>(`/staff/${encodeURIComponent(id)}`, payload);
  return response.data;
}

export async function updateStaffStatus(id: string, status: StaffStatus, version: number): Promise<StaffMember> {
  const response = await api.patch<StaffMember>(`/staff/${encodeURIComponent(id)}/status`, { status, version });
  return response.data;
}
