import { api } from '@/api/client';
import { ApplyLeavePayload, LeaveFilters, LeavePage, LeaveRequest, ReviewLeavePayload, UpdateLeavePayload } from '@/types/leave';

export async function fetchLeaves(filters: LeaveFilters): Promise<LeavePage> {
  const response = await api.get<LeavePage>('/leave', { params: filters });
  return response.data;
}

export async function applyLeave(payload: ApplyLeavePayload): Promise<LeaveRequest> {
  const response = await api.post<LeaveRequest>('/leave', payload);
  return response.data;
}

export async function updateLeave(id: string, payload: UpdateLeavePayload): Promise<LeaveRequest> {
  const response = await api.patch<LeaveRequest>(`/leave/${encodeURIComponent(id)}`, payload);
  return response.data;
}

export async function reviewLeave(id: string, payload: ReviewLeavePayload): Promise<LeaveRequest> {
  const response = await api.patch<LeaveRequest>(`/leave/${encodeURIComponent(id)}/review`, payload);
  return response.data;
}

export async function cancelLeave(id: string, version: number): Promise<LeaveRequest> {
  const response = await api.patch<LeaveRequest>(`/leave/${encodeURIComponent(id)}/cancel`, { version });
  return response.data;
}
