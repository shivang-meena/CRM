import type { StaffPermissions } from '../types/staff';

export const TOKEN_KEY = 'crm_token';
export const USER_KEY = 'crm_user';
export const ROLE_KEY = 'crm_role';
export const PERMISSIONS_KEY = 'crm_permissions';
const LOGIN_LOCK_KEY = 'crm_login_lock';
const LOGIN_IN_PROGRESS = 'A sign-in is already in progress in this browser. Please wait for it to finish.';

export type UserRole = 'super_admin' | 'admin' | 'staff';
export type AuthSession = {
  token: string;
  userName: string;
  role: UserRole | null;
  permissions: StaffPermissions | null;
};

export function parseSession(token: string | null, userName: string | null, role: string | null, permissions: string | null): AuthSession | null {
  if (!token) return null;
  let parsedPermissions: StaffPermissions | null = null;
  try { parsedPermissions = permissions ? JSON.parse(permissions) : null; } catch { /* Ignore invalid cached permissions. */ }
  return {
    token, userName: userName ?? '',
    role: role === 'admin' || role === 'staff' || role === 'super_admin' ? role : null,
    permissions: parsedPermissions,
  };
}

export function readBrowserSession(): AuthSession | null {
  return parseSession(
    localStorage.getItem(TOKEN_KEY), localStorage.getItem(USER_KEY),
    localStorage.getItem(ROLE_KEY), localStorage.getItem(PERMISSIONS_KEY),
  );
}

// Publish the token last: other tabs always receive a complete profile with the session.
export function writeBrowserSession(session: AuthSession, expectedToken?: string): boolean {
  if (expectedToken !== undefined && localStorage.getItem(TOKEN_KEY) !== expectedToken) return false;
  localStorage.setItem(USER_KEY, session.userName);
  if (session.role) localStorage.setItem(ROLE_KEY, session.role);
  else localStorage.removeItem(ROLE_KEY);
  if (session.permissions) localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(session.permissions));
  else localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.setItem(TOKEN_KEY, session.token);
  return true;
}

export function clearBrowserSession(expectedToken?: string): boolean {
  if (expectedToken !== undefined && localStorage.getItem(TOKEN_KEY) !== expectedToken) return false;
  for (const key of [USER_KEY, ROLE_KEY, PERMISSIONS_KEY, TOKEN_KEY]) localStorage.removeItem(key);
  return true;
}

function assertSignedOut() {
  const session = readBrowserSession();
  if (!session) return;
  const label = session.role === 'super_admin' ? 'Super Admin' : session.role === 'staff' ? 'Staff' : 'Admin';
  throw new Error(`This browser already has an active ${label} session. Sign out before signing in with another account.`);
}

type LoginLease = { id: string; expiresAt: number };
function readLease(): LoginLease | null {
  try { return JSON.parse(localStorage.getItem(LOGIN_LOCK_KEY) ?? 'null'); } catch { return null; }
}

export async function createBrowserSession(authenticate: () => Promise<AuthSession>): Promise<AuthSession> {
  assertSignedOut();
  const attempt = async (ownsLock: () => boolean = () => true) => {
    assertSignedOut();
    const session = await authenticate();
    if (!ownsLock()) throw new Error(LOGIN_IN_PROGRESS);
    assertSignedOut();
    writeBrowserSession(session);
    return session;
  };

  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(LOGIN_LOCK_KEY, { ifAvailable: true }, lock => {
      if (!lock) throw new Error(LOGIN_IN_PROGRESS);
      return attempt();
    });
  }

  // HTTP/older-browser fallback. Expire abandoned attempts and verify ownership before committing.
  const existing = readLease();
  if (existing && existing.expiresAt > Date.now()) throw new Error(LOGIN_IN_PROGRESS);
  const lease: LoginLease = { id: `${Date.now()}-${Math.random()}`, expiresAt: Date.now() + 60000 };
  localStorage.setItem(LOGIN_LOCK_KEY, JSON.stringify(lease));
  const ownsLock = () => {
    const current = readLease();
    return current?.id === lease.id && current.expiresAt > Date.now();
  };
  try {
    await new Promise(resolve => setTimeout(resolve, 50));
    if (!ownsLock()) throw new Error(LOGIN_IN_PROGRESS);
    return await attempt(ownsLock);
  } finally {
    if (readLease()?.id === lease.id) localStorage.removeItem(LOGIN_LOCK_KEY);
  }
}

export function subscribeBrowserSession(onChange: (session: AuthSession | null) => void): () => void {
  const sync = () => onChange(readBrowserSession());
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea && event.storageArea !== localStorage) return;
    if (event.key === null || [TOKEN_KEY, USER_KEY, ROLE_KEY, PERMISSIONS_KEY].includes(event.key)) sync();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', sync);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', sync);
  };
}
