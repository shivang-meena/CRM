import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantStore = {
  /** The tenant (Admin) id of the current request. null only in system mode. */
  adminId: string | null;
  /** true = no tenant filter (only for the places allowed in MASTER RULES G9). */
  system: boolean;
};

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/** Returns the current tenant id or throws. Use inside `data: { ..., adminId: currentAdminId() }` on create calls. */
export function currentAdminId(): string {
  const store = tenantStorage.getStore();
  if (!store || !store.adminId) {
    throw new Error('[tenant] No tenant context. This code must run inside an authenticated Admin/Staff request or runWithTenant().');
  }
  return store.adminId;
}

/** Run `fn` as one specific tenant. */
export function runWithTenant<T>(adminId: string, fn: () => T): T {
  return tenantStorage.run({ adminId, system: false }, fn);
}

/** Run `fn` WITHOUT any tenant filter. Allowed only where MASTER RULES G9 says so. */
export function runAsSystem<T>(fn: () => T): T {
  return tenantStorage.run({ adminId: null, system: true }, fn);
}
