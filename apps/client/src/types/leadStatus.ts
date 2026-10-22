export interface LeadStatusMasterEntry {
  id: string;
  name: string;
  normalizedName?: string;
  code?: string | null;
  color: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveLeadStatusMasterPayload {
  id?: string;
  name: string;
  code?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}
