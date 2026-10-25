import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModuleQuery } from './useModuleQuery';
import {
  fetchLeadStatusMaster,
  saveLeadStatusMaster,
  reorderLeadStatuses,
  deleteLeadStatusMaster,
  LEAD_STATUS_MASTER_KEY,
} from '@/api/leadStatusMaster';
import { SaveLeadStatusMasterPayload } from '@/types/leadStatus';

export function useLeadStatuses() {
  return useModuleQuery('lead', {
    queryKey: LEAD_STATUS_MASTER_KEY,
    queryFn: fetchLeadStatusMaster,
  });
}

export function useSaveLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveLeadStatusMasterPayload) => saveLeadStatusMaster(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEAD_STATUS_MASTER_KEY });
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useReorderLeadStatuses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderLeadStatuses(ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEAD_STATUS_MASTER_KEY });
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeadStatusMaster(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEAD_STATUS_MASTER_KEY });
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
