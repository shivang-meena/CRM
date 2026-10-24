import { ForbiddenException, SetMetadata } from '@nestjs/common';

export type ModulePermission = 'lead' | 'reminder' | 'meeting' | 'note' | 'calendar' | 'customer' | 'invoice' | 'staff' | 'leave';
export const MODULES: ModulePermission[] = ['lead', 'reminder', 'meeting', 'note', 'calendar', 'customer', 'invoice', 'staff', 'leave'];
export type PermissionMap = Record<ModulePermission, boolean>;

export type UserRole = 'super_admin' | 'admin' | 'staff';
export type AuthenticatedUser = {
  id: string;
  name: string;
  role: UserRole;
  /** Tenant id. null only for super_admin. */
  adminId: string | null;
  /** Admin: the features enabled by Super Admin. Staff: staff permission AND admin feature. super_admin: null. */
  permissions: PermissionMap | null;
  email?: string;
  businessName?: string;
};

export const ACCESS_POLICY = 'crm:access-policy';
export type AccessPolicy = { permissions: ModulePermission[]; adminOnly?: boolean };

// An empty policy explicitly allows any authenticated Admin/Staff (for example /auth/me).
export const RequirePermissions = (...permissions: ModulePermission[]) =>
  SetMetadata(ACCESS_POLICY, { permissions } satisfies AccessPolicy);

// Only the Admin role may call it. Optional modules: the Admin must also have those features enabled.
export const AdminOnly = (...permissions: ModulePermission[]) =>
  SetMetadata(ACCESS_POLICY, { permissions, adminOnly: true } satisfies AccessPolicy);

export function hasPermission(user: AuthenticatedUser, permission: ModulePermission): boolean {
  return (user.role === 'admin' || user.role === 'staff') && user.permissions?.[permission] === true;
}

export function assertPermissions(user: AuthenticatedUser, ...permissions: ModulePermission[]): void {
  if (permissions.some(permission => !hasPermission(user, permission))) {
    throw new ForbiddenException('You do not have permission to access this module.');
  }
}

export const activityPermissions = {
  followups: 'lead', reminders: 'reminder', meetings: 'meeting',
} as const satisfies Record<string, ModulePermission>;
