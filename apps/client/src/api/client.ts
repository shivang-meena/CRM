import axios from 'axios';
import { getItem } from '@/utils/storage';
import { notifyGlobalError } from '@/components/FeedbackToast';
import { TOKEN_KEY } from '@/utils/browserSession';

export { TOKEN_KEY, USER_KEY } from '@/utils/browserSession';

let onUnauthorized: ((failedToken: string) => void) | null = null;
export function setOnUnauthorized(fn: ((failedToken: string) => void) | null) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 15000,
});
export const apiClient = api;

api.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY);
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string = error?.config?.url ?? '';
    const authorization = error?.config?.headers?.Authorization;
    const failedToken = typeof authorization === 'string' ? authorization.replace(/^Bearer /, '') : null;
    // An old tab/request must never sign out a newer browser session.
    if (failedToken && failedToken !== await getItem(TOKEN_KEY)) return Promise.reject(error);
    const isLogin = ['/auth/login', '/auth/staff/login', '/super-admin/login'].includes(url.split('?')[0]);
    if (error?.response?.status === 401 && !isLogin && failedToken && onUnauthorized) {
      onUnauthorized(failedToken);
    }
    notifyGlobalError(errorMessage(error));
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  const e = error as any;
  const m = e?.response?.data?.message;
  if (e?.response?.status >= 500 && (!m || m === 'Internal server error')) {
    return 'The server could not complete this request. Please try again. If it keeps happening, contact support.';
  }
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  if (e?.response?.status >= 500) return 'The server could not complete this request. Please try again.';
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
  if (!e?.response && e?.request) return 'Could not reach the server. Check your internet connection and try again.';
  return e?.message ?? 'Something went wrong';
}
