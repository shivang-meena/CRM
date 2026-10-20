import { fetchInvoiceNonGstSettings } from '@/api/nonGstInvoiceSettings';
import { useModuleQuery } from './useModuleQuery';

export const INVOICE_NON_GST_SETTINGS_KEY = [
  'invoice-non-gst-settings',
] as const;
export function useInvoiceNonGstSettings(enabled = true) {
  return useModuleQuery('invoice', {
    queryKey: INVOICE_NON_GST_SETTINGS_KEY,
    queryFn: fetchInvoiceNonGstSettings,
    enabled,
    retry: false,
    refetchOnMount: 'always',
  });
}
