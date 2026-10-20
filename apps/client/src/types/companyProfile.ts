export type CompanyProfile = {
  companyName: string;
  contactNumber: string;
  dialCode: string;
  gstNumber: string;
  email: string;
  address: string;
  logo: string;
  country: string;
  state: string;
  city: string;
  businessCategory: string;
  openingTime: string;
  closingTime: string;
  considerOvertime: boolean;
  themeColor: string;
  fontColor: string;
  missedFollowUpReminder: boolean;
  staffWhatsAppDeviceReconnect: boolean;
};

export type InvoiceCompanyProfile = Pick<
  CompanyProfile,
  | 'companyName'
  | 'contactNumber'
  | 'dialCode'
  | 'gstNumber'
  | 'email'
  | 'address'
  | 'logo'
  | 'country'
  | 'state'
  | 'city'
  | 'businessCategory'
  | 'themeColor'
  | 'fontColor'
>;

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  companyName: '',
  contactNumber: '',
  dialCode: '+91',
  gstNumber: '',
  email: '',
  address: '',
  logo: '',
  country: 'India',
  state: '',
  city: '',
  businessCategory: '',
  openingTime: '',
  closingTime: '',
  considerOvertime: false,
  themeColor: '#1966A6',
  fontColor: '#1966A6',
  missedFollowUpReminder: false,
  staffWhatsAppDeviceReconnect: false,
};
