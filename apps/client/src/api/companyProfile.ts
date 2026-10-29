import { api } from './client';
import { CompanyBranding, CompanyProfile, InvoiceCompanyProfile } from '@/types/companyProfile';

export const COMPANY_BRANDING_KEY = ['company-branding'] as const;

export async function fetchCompanyBranding(): Promise<CompanyBranding | null> {
  return (await api.get<CompanyBranding | null>('/settings/company-profile/branding')).data;
}

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
