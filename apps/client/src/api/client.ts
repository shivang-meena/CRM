import axios from 'axios';
import { getItem } from '@/utils/storage';

export const TOKEN_KEY = 'crm_token';
export const USER_KEY = 'crm_user';

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15000,
});
export const apiClient = api;

api.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error?.config?.url ?? '';
    if (error?.response?.status === 401 && !url.includes('/auth/login') && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  const e = error as any;
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return e?.message ?? 'Something went wrong';
}
