import { Lead } from '@/types/lead';

export interface Customer {
  id: string;
  leadId: string;
  convertedAt: string;
  convertedById: string;
  convertedByName: string;
  lead: Lead & { deletedAt: string | null };
}

export interface CustomerFilters {
  search: string;
  page: number;
  pageSize: number;
}

export interface CustomerPage {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}
