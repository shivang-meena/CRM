import type { HistoryRecord } from '@/types/leadActivities';
import { formatDateTime } from './format';

const HIDDEN_FIELDS = new Set(['assignedToId', 'recipientId']);
const FIELD_LABELS: Record<string, string> = {
  assignedTo: 'Assigned To',
  productSelections: 'Products',
  serviceSelections: 'Services',
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatValue(value: unknown, field: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    return value.map(item => formatValue(item, field)).filter(text => text !== '—').join(', ') || '—';
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    // Selection rows wrap the actual product/service; use its saved name.
    for (const key of ['product', 'service']) {
      if (record[key] && typeof record[key] === 'object') return formatValue(record[key], field);
    }
    for (const key of ['name', 'title', 'label', 'documentNo', 'documentNumber', 'fileName']) {
      if (typeof record[key] === 'string' && record[key].trim()) return record[key];
    }
    return Object.entries(record)
      .filter(([key]) => !['id', 'adminId', 'leadId', 'position'].includes(key))
      .map(([key, entry]) => `${fieldLabel(key)}: ${formatValue(entry, key)}`)
      .join('; ') || '—';
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (!value.trim()) return '—';
    if (['status', 'source', 'channel', 'mode', 'origin'].includes(field) && /^[A-Z][A-Z0-9_]*$/.test(value)) {
      return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value) || value;
    return value;
  }
  return String(value);
}

export function historyChanges(changes: HistoryRecord['changes']) {
  return Object.entries(changes ?? {})
    .filter(([field]) => !HIDDEN_FIELDS.has(field))
    .filter(([field]) => {
      if (field === 'serviceId' || field === 'serviceIds') {
        return !changes?.service && !changes?.serviceSelections && !changes?.services;
      }
      if (field === 'productIds') return !changes?.productSelections && !changes?.products;
      return true;
    })
    .map(([field, change]) => ({
      field,
      label: fieldLabel(field),
      before: formatValue(change.before, field),
      after: formatValue(change.after, field),
    }))
    .filter(change => change.before !== '—' || change.after !== '—');
}
