import { fetchInvoiceCompanyProfile } from '@/api/companyProfile';
import { useModuleQuery } from './useModuleQuery';

export const INVOICE_COMPANY_PROFILE_KEY = ['invoice-company-profile'] as const;

export function useInvoiceCompanyProfile(enabled = true) {
  return useModuleQuery('invoice', {
    queryKey: INVOICE_COMPANY_PROFILE_KEY,
    queryFn: fetchInvoiceCompanyProfile,
    enabled,
    retry: false,
    refetchOnMount: 'always',
  });
}
