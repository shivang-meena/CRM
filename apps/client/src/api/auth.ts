import { api } from './client';

export async function loginRequest(id: string, password: string) {
  const res = await api.post<{ accessToken: string; user: { name: string } }>('/auth/login', { id, password });
  return res.data;
}
