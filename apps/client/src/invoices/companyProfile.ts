import type { InvoiceCompanyProfile } from '@/types/companyProfile';
import type { SalesDocumentRecord } from '@/types/salesDocuments';

export function getDocumentInvoiceSettings(document: SalesDocumentRecord) {
  return document.gstMode === 'NON_GST'
    ? (document.nonGstInvoiceSettingsSnapshot ??
        document.gstInvoiceSettingsSnapshot)
    : document.gstInvoiceSettingsSnapshot;
}

export function getDocumentCompanyProfile(
  document: SalesDocumentRecord,
): InvoiceCompanyProfile {
  if (document.companyProfileSnapshot) return document.companyProfileSnapshot;
  // Historical documents keep their recorded issuer details.
  return {
    companyName: document.sellerCompanyName ?? '',
    contactNumber: document.sellerPhone ?? '',
    dialCode: '',
    email: document.sellerEmail ?? '',
    address: document.sellerAddress ?? '',
    gstNumber: '',
    logo: '',
    city: '',
    state: '',
    country: '',
    businessCategory: '',
    themeColor: '#0B2F7D',
    fontColor: '#56627C',
  };
}
