import { api } from './client';

export interface ProductMasterEntry {
  id: string;
  name: string;
  hsnSac?: string;
  description?: string;
  igstRate?: number;
  sgstRate?: number;
  cgstRate?: number;
  isActive: boolean;
}

export interface SaveProductMasterPayload {
  id?: string;
  name: string;
  hsnSac?: string;
  description?: string;
  igstRate?: number;
  sgstRate?: number;
  cgstRate?: number;
  isActive?: boolean;
}

export const PRODUCT_MASTER_KEY = ['settings', 'products'] as const;

export async function fetchProductMaster() {
  return (await api.get<ProductMasterEntry[]>('/settings/products')).data;
}

export async function saveProductMaster(payload: SaveProductMasterPayload) {
  const { id, ...data } = payload;
  return id
    ? (await api.patch<ProductMasterEntry>(`/settings/products/${id}`, data)).data
    : (await api.post<ProductMasterEntry>('/settings/products', data)).data;
}
