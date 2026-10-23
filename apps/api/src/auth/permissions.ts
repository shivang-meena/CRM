import { ForbiddenException, SetMetadata } from '@nestjs/common';

export type ModulePermission = 'lead' | 'reminder' | 'meeting' | 'note' | 'calendar' | 'customer' | 'invoice' | 'staff' | 'leave';
export type AuthenticatedUser = {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  permissions: Record<ModulePermission, boolean> | null;
};

export const ACCESS_POLICY = 'crm:access-policy';
export type AccessPolicy = { permissions: ModulePermission[]; adminOnly?: boolean };

// An empty policy explicitly allows any authenticated account (for example /auth/me).
export const RequirePermissions = (...permissions: ModulePermission[]) =>
  SetMetadata(ACCESS_POLICY, { permissions } satisfies AccessPolicy);
export const AdminOnly = () =>
  SetMetadata(ACCESS_POLICY, { permissions: [], adminOnly: true } satisfies AccessPolicy);

export function hasPermission(user: AuthenticatedUser, permission: ModulePermission): boolean {
  return user.role === 'admin' || (user.role === 'staff' && user.permissions?.[permission] === true);
}

export function assertPermissions(user: AuthenticatedUser, ...permissions: ModulePermission[]): void {
  if (permissions.some(permission => !hasPermission(user, permission))) {
    throw new ForbiddenException('You do not have permission to access this module.');
  }
}

export const activityPermissions = {
  followups: 'lead', reminders: 'reminder', meetings: 'meeting',
} as const satisfies Record<string, ModulePermission>;
