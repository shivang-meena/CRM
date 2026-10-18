import { Lead } from '@/types/lead';

const pad = (n: number) => String(n).padStart(2, '0');

// Output: DD-MM-YYYY HH:mm  (empty string if no date)
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('day')}-${part('month')}-${part('year')} ${part('hour')}:${part('minute')}`;
}

// Output example: ₹ 10,00,000.00  (Indian grouping, 2 decimals)
export function formatINR(n: number): string {
  const value = n || 0;
  const [intPart, dec] = Math.abs(value).toFixed(2).split('.');
  let last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  if (rest) last3 = ',' + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹ ${value < 0 ? '-' : ''}${rest}${last3}.${dec}`;
}

// Input text must be DD-MM-YYYY HH:mm or empty.
export function parseDateTimeInput(text: string): { ok: boolean; value: string | null } {
  const t = text.trim();
  if (!t) return { ok: true, value: null };
  const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(t);
  if (!m) return { ok: false, value: null };
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  const hour = Number(m[4]), minute = Number(m[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return { ok: false, value: null };
  }
  const calendar = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (year < 1900 || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return { ok: false, value: null };
  const d = new Date(calendar.getTime() - 330 * 60000);
  return { ok: true, value: d.toISOString() };
}

// Overdue = follow-up date is in the past AND status is not CONFIRM or CANCEL
export function isOverdue(lead: Lead): boolean {
  if (!lead.nextFollowUpAt) return false;
  if (lead.status === 'CONFIRM' || lead.status === 'CANCEL') return false;
  return new Date(lead.nextFollowUpAt).getTime() < Date.now();
}

export function crmDateKey(date = new Date()): string {
  const value = formatDateTime(date.toISOString());
  return value.slice(6, 10) + '-' + value.slice(3, 5) + '-' + value.slice(0, 2);
}

export function crmDayRange(date = new Date()) {
  const key = crmDateKey(date);
  const from = new Date(key + 'T00:00:00+05:30');
  return { from: from.toISOString(), to: new Date(from.getTime() + 86400000).toISOString() };
}

export function formatMoney(value: string, currency = 'INR') {
  const [whole, decimals = '00'] = value.split('.');
  const sign = whole.startsWith('-') ? '-' : '';
  const digits = whole.replace('-', '');
  const grouped = digits.length <= 3 ? digits : digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + digits.slice(-3);
  return (currency === 'INR' ? '₹ ' : currency + ' ') + sign + grouped + '.' + decimals.padEnd(2, '0');
}
