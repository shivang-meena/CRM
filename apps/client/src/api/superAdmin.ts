import { api } from './client';
import type {
  AdminListResponse, AdminRecord, AdminStatus, CreateAdminPayload, FeatureMap, UpdateAdminPayload,
} from '@/types/superAdmin';

export async function listAdmins(search?: string, status?: AdminStatus) {
  const res = await api.get<AdminListResponse>('/super-admin/admins', {
    params: { ...(search ? { search } : {}), ...(status ? { status } : {}) },
  });
  return res.data;
}

export async function getAdmin(id: string) {
  const res = await api.get<AdminRecord>(`/super-admin/admins/${id}`);
  return res.data;
}

export async function createAdmin(payload: CreateAdminPayload) {
  const res = await api.post<AdminRecord>('/super-admin/admins', payload);
  return res.data;
}

export async function updateAdmin(id: string, payload: UpdateAdminPayload) {
  const res = await api.patch<AdminRecord>(`/super-admin/admins/${id}`, payload);
  return res.data;
}

export async function updateAdminFeatures(id: string, features: Partial<FeatureMap>) {
  const res = await api.patch<AdminRecord>(`/super-admin/admins/${id}/features`, { features });
  return res.data;
}

export async function updateAdminStatus(id: string, status: AdminStatus) {
  const res = await api.patch<AdminRecord>(`/super-admin/admins/${id}/status`, { status });
  return res.data;
}

export async function resetAdminPassword(id: string, password: string) {
  const res = await api.patch<{ success: boolean }>(`/super-admin/admins/${id}/password`, { password });
  return res.data;
}
