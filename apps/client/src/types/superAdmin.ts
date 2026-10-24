import type { StaffPermissions } from '@/types/staff';

export type AdminStatus = 'ACTIVE' | 'BLOCKED';
export type FeatureKey = keyof StaffPermissions;
export type FeatureMap = Record<FeatureKey, boolean>;

export const FEATURE_LIST: { key: FeatureKey; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'reminder', label: 'Reminder' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'note', label: 'Notes' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'customer', label: 'Customer' },
  { key: 'invoice', label: 'Invoice & Quotation' },
  { key: 'staff', label: 'Staff' },
  { key: 'leave', label: 'Leave' },
];

export const ALL_FEATURES_ON: FeatureMap = {
  lead: true, reminder: true, meeting: true, note: true, calendar: true,
  customer: true, invoice: true, staff: true, leave: true,
};

export interface AdminRecord {
  id: string;
  loginId: string;
  name: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  status: AdminStatus;
  blockedAt: string | null;
  features: FeatureMap;
  enabledFeatureCount: number;
  totalFeatureCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListResponse {
  items: AdminRecord[];
  total: number;
  summary: { totalCount: number; activeCount: number; blockedCount: number };
}

export interface CreateAdminPayload {
  loginId: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  features?: Partial<FeatureMap>;
}

export interface UpdateAdminPayload {
  name?: string;
  businessName?: string;
  phone?: string;
  email?: string;
}
