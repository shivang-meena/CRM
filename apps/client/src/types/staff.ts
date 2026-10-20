export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type StaffFilterStatus = 'ALL' | StaffStatus;

export interface StaffPermissions {
  lead: boolean;
  task: boolean;
  reminder: boolean;
  meeting: boolean;
  note: boolean;
  calendar: boolean;
  customer: boolean;
  invoice: boolean;
  staff: boolean;
  leave: boolean;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  joiningDate: string;
  status: StaffStatus;
  department: string | null;
  designation: string | null;
  employeeCode: string | null;
  canLoginApp: boolean;
  hasPassword: boolean;
  permissions: StaffPermissions;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

export interface StaffPage {
  items: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
  summary: StaffSummary;
}

export interface StaffFilters {
  search?: string;
  status?: StaffStatus;
  page: number;
  pageSize: number;
}

export interface StaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  joiningDate: string;
  status: StaffStatus;
  department: string;
  designation: string;
  employeeCode: string;
  password: string;
  canLoginApp: boolean;
  permissions: StaffPermissions;
}

export interface StaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  joiningDate: string;
  status: StaffStatus;
  department: string | null;
  designation: string | null;
  employeeCode: string | null;
  password?: string | null;
  canLoginApp: boolean;
  permissions: StaffPermissions;
}

export interface UpdateStaffPayload extends StaffPayload {
  version: number;
}
