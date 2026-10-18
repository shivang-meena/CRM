import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/Button';
import { errorMessage } from '@/api/client';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
import { formatCalendarDate, formatCalendarTime, itemRangeLabel } from './calendarDates';

type Props = { item: CalendarItem | null; onClose: () => void; onEdit: (item: CalendarItem) => void; onDelete: (item: CalendarItem) => Promise<void> };

export default function CalendarItemDetailsModal({ item, onClose, onEdit, onDelete }: Props) {
  const router = useRouter(); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  if (!item) return null;
  const currentItem = item;
  const sourceLabel = currentItem.source === 'CALENDAR_EVENT' ? 'Calendar event' : currentItem.source === 'LEAD_FOLLOWUP' ? 'Lead follow-up' : currentItem.source === 'REMINDER' ? 'Reminder' : 'Meeting';
  function openSource() { if (currentItem.leadId) { router.push({ pathname: '/lead/[id]', params: { id: currentItem.leadId, section: currentItem.source === 'LEAD_FOLLOWUP' ? 'followups' : currentItem.source === 'REMINDER' ? 'reminders' : 'meetings' } }); } else if (currentItem.source === 'REMINDER') router.push('/reminders'); else if (currentItem.source === 'MEETING') router.push('/meetings'); }
  async function remove() { setBusy(true); setError(''); try { await onDelete(currentItem); setConfirm(false); onClose(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); } }
  return <><Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.modal}><View style={styles.header}><Text style={styles.title}>Calendar Details</Text><Pressable accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={21} color={colors.primaryText} /></Pressable></View><ScrollView contentContainerStyle={styles.body}><View style={styles.titleRow}><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[currentItem.category] }]} /><Text style={styles.eventTitle}>{currentItem.title}</Text></View><Detail label="Category" value={CALENDAR_CATEGORY_LABELS[currentItem.category]} /><Detail label="Source" value={sourceLabel} /><Detail label="When" value={currentItem.allDay ? itemRangeLabel(currentItem) : currentItem.endAt ? itemRangeLabel(currentItem) : `${formatCalendarDate(currentItem.startAt)} ${formatCalendarTime(currentItem.startAt)}`} /><Detail label="Status" value={currentItem.status ?? '—'} /><Detail label="Description" value={currentItem.description || '—'} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.footer}>{currentItem.editable ? <><Button title="Edit" variant="outline" onPress={() => onEdit(currentItem)} /><Button title="Delete" variant="danger" onPress={() => setConfirm(true)} /></> : currentItem.source !== 'CALENDAR_EVENT' ? <Button title="Open source" variant="outline" onPress={openSource} /> : null}<Button title="Close" onPress={onClose} /></View></View></View></Modal><ConfirmDialog visible={confirm} title="Delete calendar event?" message="This event will be archived and removed from the calendar." loading={busy} onCancel={() => setConfirm(false)} onConfirm={() => { void remove(); }} /></>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 14 }, modal: { width: '100%', maxWidth: 560, maxHeight: '88%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' }, header: { backgroundColor: colors.primary, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.primaryText, fontSize: 16, fontWeight: '800' }, body: { padding: 16, gap: 13 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 10, height: 10, borderRadius: 5 }, eventTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800' }, detail: { gap: 4 }, label: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, value: { color: colors.text, fontSize: 13 }, error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 9, borderRadius: 6, fontSize: 12 }, footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 9, flexWrap: 'wrap' } });
