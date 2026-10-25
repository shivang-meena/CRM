import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMeRequest, getSuperAdminMeRequest, loginRequest, staffLoginRequest, superAdminLoginRequest,
} from '@/api/auth';
import { setOnUnauthorized } from '@/api/client';
import { getItem, removeItem, setItem } from '@/utils/storage';
import { StaffPermissions } from '@/types/staff';
import {
  TOKEN_KEY, USER_KEY, ROLE_KEY, PERMISSIONS_KEY, parseSession,
  readBrowserSession, writeBrowserSession, clearBrowserSession,
  createBrowserSession, subscribeBrowserSession,
} from '@/utils/browserSession';
import type { AuthSession, UserRole } from '@/utils/browserSession';
export type { UserRole } from '@/utils/browserSession';

type AuthCtx = {
  token: string | null;
  userName: string;
  role: UserRole | null;
  /** Admin: features enabled by the Super Admin. Staff: effective permissions. Super admin: null. */
  permissions: StaffPermissions | null;
  loading: boolean;
  login: (id: string, password: string) => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<void>;
  superAdminLogin: (id: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function fetchMe(role: UserRole | null, token: string): Promise<{ name: string; role: UserRole; permissions: StaffPermissions | null }> {
  if (role === 'super_admin') {
    const me = await getSuperAdminMeRequest(token);
    return { name: me.name, role: 'super_admin', permissions: null };
  }
  const me = await getMeRequest(token);
  return { name: me.name, role: me.role, permissions: me.permissions };
}

async function readStoredSession(): Promise<AuthSession | null> {
  if (Platform.OS === 'web') return readBrowserSession();
  const [token, name, role, permissions] = await Promise.all([
    getItem(TOKEN_KEY), getItem(USER_KEY), getItem(ROLE_KEY), getItem(PERMISSIONS_KEY),
  ]);
  return parseSession(token, name, role, permissions);
}

async function writeStoredSession(session: AuthSession, expectedToken?: string): Promise<boolean> {
  if (Platform.OS === 'web') return writeBrowserSession(session, expectedToken);
  if (expectedToken !== undefined && await getItem(TOKEN_KEY) !== expectedToken) return false;
  await setItem(USER_KEY, session.userName);
  if (session.role) await setItem(ROLE_KEY, session.role);
  if (session.permissions) await setItem(PERMISSIONS_KEY, JSON.stringify(session.permissions));
  else await removeItem(PERMISSIONS_KEY);
  if (expectedToken !== undefined && await getItem(TOKEN_KEY) !== expectedToken) return false;
  await setItem(TOKEN_KEY, session.token);
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const refreshInFlight = useRef<string | null>(null);
  const loginInFlight = useRef(false);
  const currentToken = useRef<string | null>(null);

  const applySession = useCallback((session: AuthSession | null) => {
    const nextToken = session?.token ?? null;
    if (currentToken.current !== nextToken) qc.clear();
    currentToken.current = nextToken;
    setToken(nextToken);
    setUserName(session?.userName ?? '');
    setRole(session?.role ?? null);
    const nextPermissions = session?.permissions ?? null;
    setPermissions(current => JSON.stringify(current) === JSON.stringify(nextPermissions) ? current : nextPermissions);
  }, [qc]);

  const endSession = useCallback(async (expectedToken?: string) => {
    if (Platform.OS === 'web') {
      clearBrowserSession(expectedToken);
    } else if (expectedToken === undefined || await getItem(TOKEN_KEY) === expectedToken) {
      for (const key of [USER_KEY, ROLE_KEY, PERMISSIONS_KEY, TOKEN_KEY]) await removeItem(key);
    }
    applySession(await readStoredSession());
  }, [applySession]);

  const logout = useCallback(() => endSession(currentToken.current ?? undefined), [endSession]);

  useEffect(() => {
    setOnUnauthorized(failedToken => { void endSession(failedToken); });
    return () => setOnUnauthorized(null);
  }, [endSession]);

  const refreshUser = useCallback(async () => {
    const session = await readStoredSession();
    if (!session || refreshInFlight.current === session.token) return;
    refreshInFlight.current = session.token;
    try {
      const me = await fetchMe(session.role, session.token);
      const next = { ...session, userName: me.name, role: me.role, permissions: me.permissions };
      if (await writeStoredSession(next, session.token)) applySession(next);
    } catch (e: any) {
      if (e?.response?.status === 401) await endSession(session.token);
    } finally {
      if (refreshInFlight.current === session.token) refreshInFlight.current = null;
    }
  }, [applySession, endSession]);

  // Admin AND staff are re-checked regularly, so a block or a feature change by the Super Admin applies quickly.
  useEffect(() => {
    if (loading || !token || (role !== 'staff' && role !== 'admin')) return;

    const refreshWhenActive = () => {
      if (AppState.currentState === 'active') void refreshUser();
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshUser();
    });
    const timer = setInterval(refreshWhenActive, 30000);

    return () => {
      clearInterval(timer);
      subscription?.remove();
    };
  }, [loading, token, role, refreshUser]);

  useEffect(() => {
    let active = true;
    const unsubscribe = Platform.OS === 'web' ? subscribeBrowserSession(applySession) : undefined;
    void (async () => {
      try {
        const session = await readStoredSession();
        if (!active) return;
        applySession(session);
        if (session) await refreshUser();
      } catch {
        if (active) applySession(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; unsubscribe?.(); };
  }, [applySession, refreshUser]);

  const beginLogin = useCallback(async (authenticate: () => Promise<AuthSession>) => {
    if (loginInFlight.current) throw new Error('A sign-in is already in progress. Please wait.');
    loginInFlight.current = true;
    try {
      if (Platform.OS === 'web') {
        await createBrowserSession(authenticate);
      } else {
        if (await readStoredSession()) throw new Error('Sign out of the current account before signing in with another account.');
        const session = await authenticate();
        if (await readStoredSession()) throw new Error('Sign out of the current account before signing in with another account.');
        await writeStoredSession(session);
      }
      applySession(await readStoredSession());
    } finally {
      loginInFlight.current = false;
    }
  }, [applySession]);

  const login = useCallback(async (id: string, password: string) => {
    await beginLogin(async () => {
      const res = await loginRequest(id, password);
      return { token: res.accessToken, userName: res.user.name, role: 'admin', permissions: res.user.permissions };
    });
  }, [beginLogin]);

  const staffLogin = useCallback(async (email: string, password: string) => {
    await beginLogin(async () => {
      const res = await staffLoginRequest(email, password);
      return { token: res.accessToken, userName: res.user.name, role: 'staff', permissions: res.user.permissions };
    });
  }, [beginLogin]);

  const superAdminLogin = useCallback(async (id: string, password: string) => {
    await beginLogin(async () => {
      const res = await superAdminLoginRequest(id, password);
      return { token: res.accessToken, userName: res.user.name, role: 'super_admin', permissions: null };
    });
  }, [beginLogin]);

  const value = useMemo(
    () => ({ token, userName, role, permissions, loading, login, staffLogin, superAdminLogin, refreshUser, logout }),
    [token, userName, role, permissions, loading, login, staffLogin, superAdminLogin, refreshUser, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
