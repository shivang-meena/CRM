import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest } from '@/api/auth';
import { TOKEN_KEY, USER_KEY, setOnUnauthorized } from '@/api/client';
import { getItem, removeItem, setItem } from '@/utils/storage';

type AuthCtx = {
  token: string | null;
  userName: string;
  loading: boolean;
  login: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      setToken(await getItem(TOKEN_KEY));
      setUserName((await getItem(USER_KEY)) ?? '');
      setLoading(false);
    })();
  }, []);

  const logout = useCallback(async () => {
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
    setToken(null);
    setUserName('');
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });
    return () => setOnUnauthorized(null);
  }, [logout]);

  const login = useCallback(async (id: string, password: string) => {
    const res = await loginRequest(id, password);
    await setItem(TOKEN_KEY, res.accessToken);
    await setItem(USER_KEY, res.user.name);
    setUserName(res.user.name);
    setToken(res.accessToken);
  }, []);

  const value = useMemo(
    () => ({ token, userName, loading, login, logout }),
    [token, userName, loading, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
