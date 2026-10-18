import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  convertLeadRequest, fetchCustomer, fetchCustomerByLead, fetchCustomers,
} from '@/api/customers';
import { fetchLead } from '@/api/leads';
import { CustomerFilters } from '@/types/customer';

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => fetchCustomers(filters),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCustomerByLead(leadId: string) {
  return useQuery({
    queryKey: ['customer-by-lead', leadId],
    queryFn: () => fetchCustomerByLead(leadId),
    enabled: !!leadId,
  });
}

export function useConvertLead(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const lead = await fetchLead(leadId);
      return convertLeadRequest(leadId, lead.version);
    },
    onSuccess: customer => {
      queryClient.setQueryData(['customer-by-lead', leadId], customer);
      queryClient.setQueryData(['customer', customer.id], customer);
    },
    onSettled: () => {
      for (const key of [
        'customers', 'customer', 'customer-by-lead', 'lead', 'leads',
        'lead-history', 'lead-sections-summary',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
