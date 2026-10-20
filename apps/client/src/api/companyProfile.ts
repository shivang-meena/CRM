import { api } from './client';
import { CompanyProfile, InvoiceCompanyProfile } from '@/types/companyProfile';

export async function fetchInvoiceCompanyProfile(): Promise<InvoiceCompanyProfile | null> {
  return (
    await api.get<InvoiceCompanyProfile | null>(
      '/sales-documents/company-profile',
    )
  ).data;
}

export async function fetchCompanyProfile(): Promise<CompanyProfile | null> {
  return (await api.get<CompanyProfile | null>('/settings/company-profile'))
    .data;
}

export async function saveCompanyProfile(
  profile: CompanyProfile,
): Promise<CompanyProfile> {
  return (await api.put<CompanyProfile>('/settings/company-profile', profile))
    .data;
}
