import { api } from './client';

export interface ServiceMasterEntry {
  id: string;
  name: string;
  hsnSac?: string;
  description?: string;
  igstRate?: number;
  sgstRate?: number;
  cgstRate?: number;
  isActive: boolean;
}

export interface SaveServiceMasterPayload {
  id?: string;
  name: string;
  hsnSac?: string;
  description?: string;
  igstRate?: number;
  sgstRate?: number;
  cgstRate?: number;
  isActive?: boolean;
}

export const SERVICE_MASTER_KEY = ['settings', 'services'] as const;
export const LEAD_SERVICES_KEY = ['lead-services'] as const;
export const LEAD_PRODUCTS_KEY = ['lead-products'] as const;

export async function fetchServiceMaster() {
  return (await api.get<ServiceMasterEntry[]>('/settings/services')).data;
}

export async function fetchLeadServices() {
  return (await api.get<ServiceMasterEntry[]>('/leads/services')).data;
}

export async function fetchLeadProducts() {
  return (await api.get<{ id: string; name: string; isActive: boolean }[]>('/leads/products')).data;
}

export async function saveServiceMaster(payload: SaveServiceMasterPayload) {
  const { id, ...data } = payload;
  return id
    ? (await api.patch<ServiceMasterEntry>(`/settings/services/${id}`, data)).data
    : (await api.post<ServiceMasterEntry>('/settings/services', data)).data;
}
