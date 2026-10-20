import { api } from './client';
import { StaffPermissions } from '@/types/staff';

export async function loginRequest(id: string, password: string) {
  const res = await api.post<{ accessToken: string; user: { name: string; role: string } }>('/auth/login', { id, password });
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
    };
  }>('/auth/staff/login', { email, password });
  return res.data;
}

export async function getMeRequest() {
  const res = await api.get<{
    id: string;
    name: string;
    email?: string;
    role: 'admin' | 'staff';
    permissions: StaffPermissions | null;
  }>('/auth/me');
  return res.data;
}

