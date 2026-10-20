import { api } from './client';
import type {
  InvoiceSettings,
  InvoiceSettingsPayload,
  NonGstInvoiceSettings,
} from '@/types/nonGstInvoiceSettings';

export async function fetchInvoiceSettings(): Promise<InvoiceSettings> {
  return (await api.get<InvoiceSettings>('/settings/invoices')).data;
}
export async function saveInvoiceSettings(
  data: InvoiceSettingsPayload,
): Promise<InvoiceSettings> {
  return (await api.put<InvoiceSettings>('/settings/invoices', data)).data;
}
export async function resetNonGstInvoiceStart(): Promise<NonGstInvoiceSettings> {
  return (
    await api.post<NonGstInvoiceSettings>('/settings/invoices/non-gst/reset')
  ).data;
}
export async function fetchInvoiceNonGstSettings(): Promise<NonGstInvoiceSettings | null> {
  return (
    await api.get<NonGstInvoiceSettings | null>(
      '/sales-documents/non-gst-settings',
    )
  ).data;
}
