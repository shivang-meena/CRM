import { api } from './client';
import type {
  GstInvoiceSettings,
  GstInvoiceSettingsSnapshot,
} from '@/types/gstInvoiceSettings';

export async function fetchGstInvoiceSettings(): Promise<GstInvoiceSettings | null> {
  return (await api.get<GstInvoiceSettings | null>('/settings/invoices/gst'))
    .data;
}
export async function saveGstInvoiceSettings(
  settings: GstInvoiceSettingsSnapshot,
): Promise<GstInvoiceSettings> {
  return (await api.put<GstInvoiceSettings>('/settings/invoices/gst', settings))
    .data;
}
export async function resetGstInvoiceStart(): Promise<GstInvoiceSettings> {
  return (await api.post<GstInvoiceSettings>('/settings/invoices/gst/reset'))
    .data;
}
export async function fetchInvoiceGstSettings(): Promise<GstInvoiceSettings | null> {
  return (
    await api.get<GstInvoiceSettings | null>('/sales-documents/gst-settings')
  ).data;
}
