export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type StaffFilterStatus = 'ALL' | StaffStatus;

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
}

export interface UpdateStaffPayload extends StaffPayload {
  version: number;
}
