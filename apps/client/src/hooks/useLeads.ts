import { useModuleQuery } from './useModuleQuery';
import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLeadRequest, deleteLeadRequest, fetchLead, fetchLeads, updateLeadRequest,
} from '@/api/leads';
import { Lead, LeadInput } from '@/types/lead';

export function useLeads(search: string) {
  return useModuleQuery('lead', {
    queryKey: ['leads', search],
    queryFn: () => fetchLeads(search),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: string) {
  return useModuleQuery('lead', {
    queryKey: ['lead', id],
    queryFn: () => fetchLead(id),
    enabled: !!id,
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    for (const key of ['customers', 'customer', 'customer-by-lead']) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['lead'] });
    ['lead-history', 'lead-sections-summary', 'dashboard-lead-activities', 'notifications'].forEach(key => { void qc.invalidateQueries({ queryKey: [key] }); });
  };
}

export function useCreateLead() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (data: LeadInput) => createLeadRequest(data), onSuccess: refresh });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadInput> }) => {
      const cached = qc.getQueryData<Lead>(['lead', id]) ?? qc.getQueriesData<Lead[]>({ queryKey: ['leads'] }).flatMap(([, rows]) => rows ?? []).find(row => row.id === id);
      const version = data.version ?? cached?.version ?? (await fetchLead(id)).version;
      return updateLeadRequest(id, { ...data, version });
    },
    onSuccess: (lead) => { qc.setQueryData(['lead', lead.id], lead); },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['leads'] });
      const previousQueries = qc.getQueriesData<Lead[]>({ queryKey: ['leads'] });
      qc.setQueriesData<Lead[]>({ queryKey: ['leads'] }, (old) => {
        if (!old) return old;
        return old.map((lead) => (lead.id === id ? ({ ...lead, ...data } as Lead) : lead));
      });
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      for (const key of ['customers', 'customer', 'customer-by-lead']) {
        void qc.invalidateQueries({ queryKey: [key] });
      }
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead'] });
      qc.invalidateQueries({ queryKey: ['lead-history'] });
      qc.invalidateQueries({ queryKey: ['lead-sections-summary'] });
    },
  });
}

export function useDeleteLead() {
  const refresh = useRefresh();
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => {
    const cached = qc.getQueryData<Lead>(['lead', id]) ?? qc.getQueriesData<Lead[]>({ queryKey: ['leads'] }).flatMap(([, rows]) => rows ?? []).find(row => row.id === id);
    await deleteLeadRequest(id, cached?.version ?? (await fetchLead(id)).version);
    ['lead', 'lead-followups', 'lead-tasks', 'lead-reminders', 'lead-meetings', 'lead-documents', 'lead-document', 'lead-history', 'lead-sections-summary'].forEach(key => qc.removeQueries({ queryKey: [key, id] }));
  }, onSuccess: refresh });
}
