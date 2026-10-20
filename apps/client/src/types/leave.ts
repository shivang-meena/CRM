export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveFilterStatus = 'ALL' | LeaveStatus;

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason: string;
  leaveDetail: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  rejectionNote: string | null;
  version: number;
}

export interface LeaveSummary {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
}

export interface LeavePage {
  items: LeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
  summary: LeaveSummary;
}

export interface LeaveFilters {
  search?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  staffId?: string;
  page: number;
  pageSize: number;
}

export interface ApplyLeavePayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  leaveDetail?: string;
}

export interface UpdateLeavePayload extends ApplyLeavePayload {
  version: number;
}

export interface ReviewLeavePayload {
  status: 'APPROVED' | 'REJECTED';
  rejectionNote?: string;
  version: number;
}
