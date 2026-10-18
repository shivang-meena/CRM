import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDocument,
  fetchDocuments,
  fetchPayments,
  salesDocumentsApi,
  SalesDocumentFilters,
} from '@/api/salesDocuments';
import {
  CreateSalesDocumentPayload,
  UpdateSalesDocumentPayload,
} from '@/types/salesDocuments';
import { DocumentKind, ListFilters } from '@/types/leadActivities';

export function useSalesDocuments(filters: SalesDocumentFilters) {
  return useQuery({
    queryKey: ['sales-documents', filters],
    queryFn: () => salesDocumentsApi.list(filters),
  });
}

export function useSalesDocument(id?: string) {
  return useQuery({
    queryKey: ['sales-document', id],
    queryFn: () => salesDocumentsApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSalesDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalesDocumentPayload) =>
      salesDocumentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-documents'] });
    },
  });
}

export function useUpdateSalesDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalesDocumentPayload }) =>
      salesDocumentsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-documents'] });
      queryClient.invalidateQueries({ queryKey: ['sales-document', variables.id] });
    },
  });
}

export function useDeleteSalesDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesDocumentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-documents'] });
    },
  });
}

export function useConvertQuotationToInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesDocumentsApi.convertToInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-documents'] });
    },
  });
}

export function usePaymentMethods(search?: string) {
  return useQuery({
    queryKey: ['payment-methods', search ?? ''],
    queryFn: () => salesDocumentsApi.listPaymentMethods(search),
  });
}

export function usePaymentMethodActions() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: salesDocumentsApi.createPaymentMethod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { requestKey: string; method: string; version?: number };
    }) => salesDocumentsApi.updatePaymentMethod(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
  const remove = useMutation({
    mutationFn: salesDocumentsApi.deletePaymentMethod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
  return { create, update, remove };
}

export function useBrochures(search?: string) {
  return useQuery({
    queryKey: ['brochures', search ?? ''],
    queryFn: () => salesDocumentsApi.listBrochures(search),
  });
}

export function useBrochureActions() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: salesDocumentsApi.createBrochure,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brochures'] }),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        requestKey: string;
        brochureName: string;
        type: string;
        startAfter: string;
        fileUrl?: string;
        version?: number;
      };
    }) => salesDocumentsApi.updateBrochure(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brochures'] }),
  });
  const remove = useMutation({
    mutationFn: salesDocumentsApi.deleteBrochure,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brochures'] }),
  });
  return { create, update, remove };
}

// Backward compatibility hooks for lead-level components
export function useDocuments(leadId: string, kind: DocumentKind, filters: ListFilters, enabled = true) {
  return useQuery({
    queryKey: ['lead-documents', leadId, kind, filters],
    queryFn: () => fetchDocuments(leadId, kind, filters),
    enabled: !!leadId && enabled,
  });
}
export function useDocument(leadId: string, kind: DocumentKind, id: string) {
  return useQuery({
    queryKey: ['lead-document', leadId, kind, id],
    queryFn: () => fetchDocument(leadId, kind, id),
    enabled: !!id,
  });
}
export function usePayments(leadId: string, invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: ['invoice-payments', leadId, invoiceId],
    queryFn: () => fetchPayments(leadId, invoiceId),
    enabled: !!invoiceId && enabled,
  });
}
