import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getMeRequest, loginRequest, staffLoginRequest } from '@/api/auth';
import { TOKEN_KEY, USER_KEY, setOnUnauthorized } from '@/api/client';
import { getItem, removeItem, setItem } from '@/utils/storage';
import { StaffPermissions } from '@/types/staff';

const ROLE_KEY = 'crm_role';
const PERMISSIONS_KEY = 'crm_permissions';

export type UserRole = 'admin' | 'staff';

type AuthCtx = {
  token: string | null;
  userName: string;
  role: UserRole | null;
  permissions: StaffPermissions | null;
  loading: boolean;
  login: (id: string, password: string) => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const refreshInFlight = useRef(false);

  const logout = useCallback(async () => {
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
    await removeItem(ROLE_KEY);
    await removeItem(PERMISSIONS_KEY);
    setToken(null);
    setUserName('');
    setRole(null);
    setPermissions(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setOnUnauthorized(() => { logout(); });
    return () => setOnUnauthorized(null);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    let t: string | null = null;
    try {
      t = await getItem(TOKEN_KEY);
      if (!t) return;
      const me = await getMeRequest();
      if ((await getItem(TOKEN_KEY)) !== t) return;
      setUserName(me.name);
      setRole(me.role);
      setPermissions(current => JSON.stringify(current) === JSON.stringify(me.permissions) ? current : me.permissions);
      await setItem(USER_KEY, me.name);
      await setItem(ROLE_KEY, me.role);
      if (me.permissions) {
        await setItem(PERMISSIONS_KEY, JSON.stringify(me.permissions));
      } else {
        await removeItem(PERMISSIONS_KEY);
      }
    } catch (e: any) {
      if (e?.response?.status === 401 && t && (await getItem(TOKEN_KEY)) === t) {
        await logout();
      }
    } finally {
      refreshInFlight.current = false;
    }
  }, [logout]);

  useEffect(() => {
    if (loading || !token || role !== 'staff') return;

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
    (async () => {
      const [t, u, r, p] = await Promise.all([
        getItem(TOKEN_KEY),
        getItem(USER_KEY),
        getItem(ROLE_KEY),
        getItem(PERMISSIONS_KEY),
      ]);
      setToken(t);
      setUserName(u ?? '');
      setRole((r as UserRole) ?? null);
      try {
        setPermissions(p ? JSON.parse(p) : null);
      } catch {
        setPermissions(null);
      }

      // Fetch live permissions and profile from server on load!
      if (t) {
        try {
          const me = await getMeRequest();
          setUserName(me.name);
          setRole(me.role);
          setPermissions(me.permissions);
          await setItem(USER_KEY, me.name);
          await setItem(ROLE_KEY, me.role);
          if (me.permissions) {
            await setItem(PERMISSIONS_KEY, JSON.stringify(me.permissions));
          } else {
            await removeItem(PERMISSIONS_KEY);
          }
        } catch (e: any) {
          if (e?.response?.status === 401) {
            await logout();
          }
        }
      }
      setLoading(false);
    })();
  }, [logout]);

  const login = useCallback(async (id: string, password: string) => {
    const res = await loginRequest(id, password);
    await setItem(TOKEN_KEY, res.accessToken);
    await setItem(USER_KEY, res.user.name);
    await setItem(ROLE_KEY, 'admin');
    await removeItem(PERMISSIONS_KEY);
    setUserName(res.user.name);
    setToken(res.accessToken);
    setRole('admin');
    setPermissions(null);
  }, []);

  const staffLogin = useCallback(async (email: string, password: string) => {
    const res = await staffLoginRequest(email, password);
    await setItem(TOKEN_KEY, res.accessToken);
    await setItem(USER_KEY, res.user.name);
    await setItem(ROLE_KEY, 'staff');
    await setItem(PERMISSIONS_KEY, JSON.stringify(res.user.permissions));
    setUserName(res.user.name);
    setToken(res.accessToken);
    setRole('staff');
    setPermissions(res.user.permissions);
  }, []);

  const value = useMemo(
    () => ({ token, userName, role, permissions, loading, login, staffLogin, refreshUser, logout }),
    [token, userName, role, permissions, loading, login, staffLogin, refreshUser, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
