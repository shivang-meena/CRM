import { useModuleQuery } from './useModuleQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyLeave, cancelLeave, fetchLeaves, reviewLeave, updateLeave } from '@/api/leave';
import { ApplyLeavePayload, LeaveFilters, ReviewLeavePayload, UpdateLeavePayload } from '@/types/leave';

export function useLeaveList(filters: LeaveFilters) {
  return useModuleQuery('leave', { queryKey: ['leave', filters], queryFn: () => fetchLeaves(filters) });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeavePayload) => applyLeave(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeavePayload }) => updateLeave(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useReviewLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewLeavePayload }) => reviewLeave(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave'] }),
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => cancelLeave(id, version),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave'] }),
  });
}
