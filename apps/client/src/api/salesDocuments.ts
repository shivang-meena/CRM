import { api, apiClient } from './client';
import {
  BrochureRecord,
  CreateSalesDocumentPayload,
  PaymentMethodRecord,
  SalesDocumentRecord,
  SalesDocumentType,
  UpdateSalesDocumentPayload,
  SalesDocument,
} from '@/types/salesDocuments';
export type { BrochureRecord };
import { DocumentKind, ListFilters, Page } from '@/types/leadActivities';

export interface SalesDocumentFilters {
  type?: SalesDocumentType;
  paymentStatus?: string;
  gstMode?: string;
  gstType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export const salesDocumentsApi = {
  list: async (filters: SalesDocumentFilters): Promise<SalesDocumentRecord[]> => {
    const { data } = await apiClient.get<SalesDocumentRecord[]>('/sales-documents', {
      params: filters,
    });
    return data;
  },

  getById: async (id: string): Promise<SalesDocumentRecord> => {
    const { data } = await apiClient.get<SalesDocumentRecord>(`/sales-documents/${id}`);
    return data;
  },

  create: async (payload: CreateSalesDocumentPayload): Promise<SalesDocumentRecord> => {
    const { data } = await apiClient.post<SalesDocumentRecord>('/sales-documents', payload);
    return data;
  },

  update: async (
    id: string,
    payload: UpdateSalesDocumentPayload,
  ): Promise<SalesDocumentRecord> => {
    const { data } = await apiClient.patch<SalesDocumentRecord>(
      `/sales-documents/${id}`,
      payload,
    );
    return data;
  },

  convertToInvoice: async (id: string): Promise<SalesDocumentRecord> => {
    const { data } = await apiClient.post<SalesDocumentRecord>(
      `/sales-documents/${id}/convert-to-invoice`,
    );
    return data;
  },

  remove: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    const { data } = await apiClient.delete(`/sales-documents/${id}`);
    return data;
  },

  // Payment Methods
  listPaymentMethods: async (search?: string): Promise<PaymentMethodRecord[]> => {
    const { data } = await apiClient.get<PaymentMethodRecord[]>(
      '/sales-documents/payment-methods',
      { params: search ? { search } : undefined },
    );
    return data;
  },

  createPaymentMethod: async (payload: {
    requestKey: string;
    method: string;
  }): Promise<PaymentMethodRecord> => {
    const { data } = await apiClient.post<PaymentMethodRecord>(
      '/sales-documents/payment-methods',
      payload,
    );
    return data;
  },

  updatePaymentMethod: async (
    id: string,
    payload: { requestKey: string; method: string; version?: number },
  ): Promise<PaymentMethodRecord> => {
    const { data } = await apiClient.patch<PaymentMethodRecord>(
      `/sales-documents/payment-methods/${id}`,
      payload,
    );
    return data;
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-documents/payment-methods/${id}`);
  },

  // Brochures
  listBrochures: async (search?: string): Promise<BrochureRecord[]> => {
    const { data } = await apiClient.get<BrochureRecord[]>(
      '/sales-documents/brochures',
      { params: search ? { search } : undefined },
    );
    return data;
  },

  createBrochure: async (payload: {
    requestKey: string;
    brochureName: string;
    type: string;
    startAfter: string;
    fileUrl?: string;
  }): Promise<BrochureRecord> => {
    const { data } = await apiClient.post<BrochureRecord>(
      '/sales-documents/brochures',
      payload,
    );
    return data;
  },

  updateBrochure: async (
    id: string,
    payload: {
      requestKey: string;
      brochureName: string;
      type: string;
      startAfter: string;
      fileUrl?: string;
      version?: number;
    },
  ): Promise<BrochureRecord> => {
    const { data } = await apiClient.patch<BrochureRecord>(
      `/sales-documents/brochures/${id}`,
      payload,
    );
    return data;
  },

  deleteBrochure: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-documents/brochures/${id}`);
  },
};

// Backward compatibility functions for lead-level components
export async function fetchDocuments(leadId: string, kind: DocumentKind, filters: ListFilters) {
  return (await api.get<Page<SalesDocument>>(`/leads/${leadId}/${kind}`, { params: filters })).data;
}
export async function fetchDocument(leadId: string, kind: DocumentKind, id: string) {
  return (await api.get<SalesDocument>(`/leads/${leadId}/${kind}/${id}`)).data;
}
export async function saveDocument(leadId: string, kind: DocumentKind, body: Record<string, unknown>, row?: SalesDocument) {
  const url = `/leads/${leadId}/${kind}`;
  return row ? (await api.patch<SalesDocument>(url + '/' + row.id, { ...body, version: row.version })).data : (await api.post<SalesDocument>(url, body)).data;
}
export async function documentAction(leadId: string, kind: DocumentKind, row: SalesDocument, action: string, extra: Record<string, unknown> = {}) {
  const url = `/leads/${leadId}/${kind}/${row.id}`, body = { version: row.version, ...extra };
  return action === 'delete' ? (await api.delete<SalesDocument>(url, { data: body })).data : (await api.post<SalesDocument>(url + '/' + action, body)).data;
}
export async function convertQuotation(leadId: string, id: string, version: number, requestKey: string) {
  return (await api.post<SalesDocument>(`/leads/${leadId}/quotations/${id}/convert-to-invoice`, { version, requestKey })).data;
}
export async function fetchPayments(leadId: string, invoiceId: string) {
  return (await api.get<SalesDocument['payments']>(`/leads/${leadId}/invoices/${invoiceId}/payments`)).data;
}
export async function recordPayment(leadId: string, invoiceId: string, body: Record<string, unknown>) {
  return (await api.post<SalesDocument>(`/leads/${leadId}/invoices/${invoiceId}/payments`, body)).data;
}
export async function voidPayment(leadId: string, invoiceId: string, paymentId: string, version: number, reason: string) {
  return (await api.post<SalesDocument>(`/leads/${leadId}/invoices/${invoiceId}/payments/${paymentId}/void`, { version, reason })).data;
}
