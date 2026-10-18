export type LeadStatus = 'NEW' | 'PROCESSING' | 'CLOSE_BY' | 'CONFIRM' | 'CANCEL';
export type LeadSource =
  | 'CUSTOMER_REFERENCE' | 'WEBSITE' | 'CALL' | 'WHATSAPP' | 'SOCIAL_MEDIA' | 'OTHER';

export interface Lead {
  id: string;
  name: string;
  companyName: string | null;
  company?: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  comment: string | null;
  reference: string | null;
  status: LeadStatus;
  source: LeadSource;
  label: string | null;
  estimatedAmount: number;
  rating: number;
  nextFollowUpAt: string | null;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LeadInput {
  version?: number;
  name: string;
  phone: string;
  companyName?: string;
  email?: string;
  address?: string;
  comment?: string;
  reference?: string;
  status?: LeadStatus;
  source?: LeadSource;
  label?: string;
  estimatedAmount?: number;
  rating?: number;
  nextFollowUpAt?: string | null;
  assignedTo?: string;
}

export const STATUS_LIST: { key: LeadStatus; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'CLOSE_BY', label: 'Close-by' },
  { key: 'CONFIRM', label: 'Confirm' },
  { key: 'CANCEL', label: 'Cancel' },
];

export const SOURCE_LIST: { key: LeadSource; label: string }[] = [
  { key: 'CUSTOMER_REFERENCE', label: 'Customer Reference' },
  { key: 'WEBSITE', label: 'Website' },
  { key: 'CALL', label: 'Call' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'SOCIAL_MEDIA', label: 'Social Media' },
  { key: 'OTHER', label: 'Other' },
];

export const statusLabel = (k: LeadStatus) => STATUS_LIST.find((s) => s.key === k)?.label ?? k;
export const sourceLabel = (k: LeadSource) => SOURCE_LIST.find((s) => s.key === k)?.label ?? k;
