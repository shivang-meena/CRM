import type { Lead } from '@/types/lead';

export type ScheduleKind = 'Reminder' | 'Meeting' | 'Events';
export type DashboardEntry = {
  id: string;
  kind: 'note' | ScheduleKind;
  text: string;
  date: string | null;
  completed: boolean;
};

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isOnDay(iso: string | null, day: Date): boolean {
  return !!iso && dayKey(new Date(iso)) === dayKey(day);
}

export function isClosed(lead: Lead): boolean {
  return lead.status === 'CONFIRM' || lead.status === 'CANCEL';
}

export function completionPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.min(100, Math.max(0, completed / total * 100));
}

export function parseEntries(raw: string | null): DashboardEntry[] {
  if (!raw) return [];
  const saved: unknown = JSON.parse(raw);
  if (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1 ||
      !('entries' in saved) || !Array.isArray(saved.entries)) {
    throw new Error('Saved dashboard data could not be read.');
  }
  const kinds = ['note', 'Reminder', 'Meeting', 'Events'];
  const ids = new Set<string>();
  return saved.entries.filter((entry: unknown) =>
    !(entry && typeof entry === 'object' && 'kind' in entry && entry.kind === 'task'),
  ).map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('id' in entry) || typeof entry.id !== 'string' ||
        !('kind' in entry) || typeof entry.kind !== 'string' || !kinds.includes(entry.kind) ||
        !('text' in entry) || typeof entry.text !== 'string' || !entry.text.trim() ||
        !('completed' in entry) || typeof entry.completed !== 'boolean' || !('date' in entry) ||
        !(entry.date === null || (typeof entry.date === 'string' && Number.isFinite(new Date(entry.date).getTime()))) ||
        (entry.kind !== 'note' && entry.date === null) || ids.has(entry.id)) {
      throw new Error('Saved dashboard data could not be read.');
    }
    ids.add(entry.id);
    return entry as DashboardEntry;
  });
}
