import { api } from './client';

export interface HsnMasterEntry {
  id: string;
  code: string;
  description: string;
  igstRate: number;
  sgstRate: number;
  cgstRate: number;
  isActive: boolean;
}
export type HsnMasterPayload = Omit<HsnMasterEntry, 'id'>;
export const HSN_MASTER_KEY = ['settings', 'hsn-master'] as const;
export const INVOICE_HSN_MASTER_KEY = ['sales-documents', 'hsn-master'] as const;

export async function fetchHsnMaster() {
  return (await api.get<HsnMasterEntry[]>('/settings/hsn-master')).data;
}
export async function fetchInvoiceHsnMaster() {
  return (await api.get<HsnMasterEntry[]>('/sales-documents/hsn-master')).data;
}
export async function saveHsnMaster({ id, data }: { id?: string; data: HsnMasterPayload }) {
  return id
    ? (await api.patch<HsnMasterEntry>(`/settings/hsn-master/${id}`, data)).data
    : (await api.post<HsnMasterEntry>('/settings/hsn-master', data)).data;
}
