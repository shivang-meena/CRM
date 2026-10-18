import { api } from './client';
import { CrmNotification, Page } from '@/types/leadActivities';
export async function fetchNotifications(page = 1) { return (await api.get<Page<CrmNotification> & { unread: number }>('/notifications', { params: { page, pageSize: 20 } })).data; }
export async function readNotification(id: string) { await api.patch('/notifications/' + id + '/read'); }
