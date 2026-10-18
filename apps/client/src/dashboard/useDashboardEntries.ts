import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getItem, setItem } from '@/utils/storage';
import { DashboardEntry, parseEntries } from './model';

export default function useDashboardEntries(userName: string) {
  const key = `crm_dashboard_v1_${Array.from(userName).map((c) => c.codePointAt(0)!.toString(16)).join('_')}`;
  const [entries, setEntries] = useState<DashboardEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const currentKey = useRef(key);
  currentKey.current = key;

  useEffect(() => {
    let active = true;
    setReady(false);
    setEntries([]);
    setError('');
    (async () => {
      try {
        const raw = Platform.OS === 'web' ? localStorage.getItem(key) : await getItem(key);
        const restored = parseEntries(raw);
        if (active) { setEntries(restored); setReady(true); }
      } catch {
        if (active) setError('Unable to load your saved dashboard items. Check device storage and reload.');
      }
    })();
    return () => { active = false; };
  }, [key]);

  const save = useCallback(async (next: DashboardEntry[]): Promise<boolean> => {
    if (!ready || busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const raw = JSON.stringify({ version: 1, entries: next });
      if (Platform.OS === 'web') localStorage.setItem(key, raw);
      else await setItem(key, raw);
      if (currentKey.current === key) setEntries(next);
      return true;
    } catch {
      if (currentKey.current === key) setError('Could not save. Check available device storage and try again.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [key, ready]);

  return { entries, ready, saving, error, save };
}
