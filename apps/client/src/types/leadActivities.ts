export type ActivityKind = 'followups' | 'tasks' | 'reminders' | 'meetings';
export type DocumentKind = 'quotations' | 'invoices';
export type LeadSection = 'details' | ActivityKind | DocumentKind | 'history';
export const sectionLabels: Record<LeadSection, string> = { details: 'Details', followups: 'FollowUp', history: 'History', tasks: 'Task', reminders: 'Reminder', meetings: 'Meeting', quotations: 'Quotation', invoices: 'Invoice' };
export const sectionOrder: LeadSection[] = ['details','followups','history','tasks','reminders','meetings','quotations','invoices'];
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number; completed?: number }
export interface ListFilters { page?: number; pageSize?: number; search?: string; status?: string; priority?: string; overdue?: string; from?: string; to?: string }
export interface ActivityRecord {
  id: string; leadId: string | null; title: string; status: string; version: number; independent?: boolean;
  createdAt: string; updatedAt: string; deletedAt: string | null; createdByName?: string; updatedByName?: string | null;
  assignedTo?: string; description?: string | null; outcome?: string | null;
  scheduledAt?: string; dueAt?: string; remindAt?: string; startAt?: string; endAt?: string;
  channel?: string; priority?: string; message?: string | null; agenda?: string | null;
  mode?: string; location?: string | null; meetingUrl?: string | null;
  attendees?: { name: string; email?: string }[];
  followUpId?: string | null; taskId?: string | null; meetingId?: string | null;
  lead?: { id: string; name: string } | null;
}
export interface SectionSummary {
  counts: Record<ActivityKind | DocumentKind, number>;
  pending: Record<ActivityKind, number>;
  overdue: { followups: number; tasks: number; invoices: number };
  nextFollowUpAt: string | null;
}
export interface HistoryRecord {
  id: string; entityType: string; action: string; actorName: string; summary: string;
  createdAt: string; changes: Record<string, { before: unknown; after: unknown }> | null;
}
export interface CrmNotification { id: string; leadId: string | null; title: string; message: string | null; createdAt: string; readAt: string | null }
export const activityStatuses: Record<ActivityKind, string[]> = {
  followups: ['PENDING','COMPLETED','CANCELLED'], tasks: ['TODO','IN_PROGRESS','COMPLETED','CANCELLED'],
  reminders: ['PENDING','TRIGGERED','DISMISSED','CANCELLED'], meetings: ['SCHEDULED','COMPLETED','CANCELLED'],
};
export function activityDate(row: ActivityRecord) { return row.scheduledAt ?? row.dueAt ?? row.remindAt ?? row.startAt ?? null; }
export function activityPending(row: ActivityRecord) { return ['PENDING','TODO','IN_PROGRESS','SCHEDULED'].includes(row.status); }
