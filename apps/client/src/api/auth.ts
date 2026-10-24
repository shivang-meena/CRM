import { api } from './client';
import { StaffPermissions } from '@/types/staff';

export async function loginRequest(id: string, password: string) {
  const res = await api.post<{
    accessToken: string;
    user: { id: string; name: string; role: 'admin'; permissions: StaffPermissions; businessName?: string };
  }>('/auth/login', { id, password });
  return res.data;
}

export async function staffLoginRequest(email: string, password: string) {
  const res = await api.post<{
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: 'staff';
      permissions: StaffPermissions;
      businessName?: string;
    };
  }>('/auth/staff/login', { email, password });
  return res.data;
}

export async function superAdminLoginRequest(id: string, password: string) {
  const res = await api.post<{
    accessToken: string;
    user: { id: string; name: string; role: 'super_admin' };
  }>('/super-admin/login', { id, password });
  return res.data;
}

export async function getMeRequest() {
  const res = await api.get<{
    id: string;
    name: string;
    email?: string;
    role: 'admin' | 'staff';
    permissions: StaffPermissions | null;
    businessName?: string;
  }>('/auth/me');
  return res.data;
}

export async function getSuperAdminMeRequest() {
  const res = await api.get<{ id: string; name: string; role: 'super_admin' }>('/super-admin/me');
  return res.data;
}
