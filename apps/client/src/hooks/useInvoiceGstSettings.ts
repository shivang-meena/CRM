import { fetchInvoiceGstSettings } from '@/api/gstInvoiceSettings';
import { useModuleQuery } from './useModuleQuery';

export const INVOICE_GST_SETTINGS_KEY = ['invoice-gst-settings'] as const;
export function useInvoiceGstSettings(enabled = true) {
  return useModuleQuery('invoice', {
    queryKey: INVOICE_GST_SETTINGS_KEY,
    queryFn: fetchInvoiceGstSettings,
    enabled,
    retry: false,
    refetchOnMount: 'always',
  });
}
