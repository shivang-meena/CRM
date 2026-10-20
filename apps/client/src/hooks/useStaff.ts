import { useModuleQuery } from './useModuleQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaff, fetchStaff, updateStaff, updateStaffStatus } from '@/api/staff';
import { StaffFilters, StaffPayload, StaffStatus, UpdateStaffPayload } from '@/types/staff';

export function useStaffList(filters: StaffFilters) {
  return useModuleQuery('staff', { queryKey: ['staff', filters], queryFn: () => fetchStaff(filters) });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffPayload) => createStaff(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) => updateStaff(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, version }: { id: string; status: StaffStatus; version: number }) => updateStaffStatus(id, status, version),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
}
