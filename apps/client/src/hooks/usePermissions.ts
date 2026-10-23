import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { StaffPermissions } from '@/types/staff';
import type { LeadSection } from '@/types/leadActivities';

export type ModulePermission = keyof StaffPermissions;

export const activityPermissions = {
  followups: 'lead', reminders: 'reminder', meetings: 'meeting',
} as const satisfies Record<string, ModulePermission>;

export const leadSectionPermissions: Record<LeadSection, ModulePermission> = {
  details: 'lead', followups: 'lead', history: 'lead',
  reminders: 'reminder', meetings: 'meeting', quotations: 'invoice', invoices: 'invoice',
};

export function usePermissions() {
  const { token, loading, role, permissions } = useAuth();
  const canAccess = useCallback((module: ModulePermission) =>
    !loading && !!token && (role === 'admin' || (role === 'staff' && permissions?.[module] === true)),
  [token, loading, role, permissions]);
  return { canAccess, isAdmin: !loading && !!token && role === 'admin' };
}
