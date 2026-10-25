import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { ActivityRecord } from '@/types/leadActivities';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import Button from '../Button';
import DateTimePickerModal from '../DateTimePickerModal';
import AssigneeSelect from '../AssigneeSelect';
import { useErrorToast } from '../FeedbackToast';

type Props = { visible: boolean; record: ActivityRecord | null; userName: string; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void> };
type MeetingMode = 'ONLINE' | 'PHONE' | 'IN_PERSON';
type FormState = { title: string; agenda: string; startAt: string; endAt: string; mode: MeetingMode; location: string; meetingUrl: string; assignedTo: string; assignedToId: string };

const requestKey = () => 'crm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
const initial = (record: ActivityRecord | null, userName: string): FormState => {
  const start = record?.startAt ? new Date(record.startAt) : new Date(Date.now() + 30 * 60000);
  const end = record?.endAt ? new Date(record.endAt) : new Date(start.getTime() + 60 * 60000);
  return {
    title: record?.title ?? '', agenda: record?.agenda ?? '', startAt: formatDateTime(start.toISOString()), endAt: formatDateTime(end.toISOString()),
    mode: (record?.mode as MeetingMode) ?? 'ONLINE', location: record?.location ?? '', meetingUrl: record?.meetingUrl ?? '', assignedTo: record?.assignedTo ?? userName, assignedToId: record?.assignedToId ?? '',
  };
};

function Field({ label, value, onChangeText, multiline = false, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline]} value={value} onChangeText={onChangeText} multiline={multiline} placeholder={placeholder} placeholderTextColor={colors.muted} /></View>;
}

export default function StandaloneMeetingFormModal({ visible, record, userName, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => initial(record, userName));
  const [picker, setPicker] = useState<'startAt' | 'endAt' | null>(null);
  const [error, setError] = useState('');
  useErrorToast(error, 'Meeting needs attention');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) { setForm(initial(record, userName)); setPicker(null); setError(''); } }, [visible, record, userName]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((old) => ({ ...old, [key]: value }));

  async function save() {
    if (!form.title.trim()) return setError('Title is required.');
    const start = parseDateTimeInput(form.startAt), end = parseDateTimeInput(form.endAt);
    if (!start.ok || !end.ok || !start.value || !end.value) return setError('Enter valid start and end dates like 25-12-2026 18:30.');
    if (new Date(end.value) <= new Date(start.value)) return setError('Meeting end must be after its start.');
    if (form.mode === 'IN_PERSON' && !form.location.trim()) return setError('Location is required for an in-person meeting.');
    if (form.mode === 'ONLINE' && form.meetingUrl.trim() && !/^https?:\/\//i.test(form.meetingUrl.trim())) return setError('Meeting URL must start with http:// or https://.');
    setSaving(true); setError('');
    try {
      await onSave({ title: form.title.trim(), agenda: form.agenda.trim(), startAt: start.value, endAt: end.value, timezone: 'Asia/Kolkata', mode: form.mode, location: form.location.trim(), meetingUrl: form.meetingUrl.trim(), attendees: [], assignedTo: form.assignedTo.trim() || userName, assignedToId: form.assignedToId || undefined, ...(!record ? { requestKey: requestKey() } : {}) });
      onClose();
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onClose()}>
    <View style={styles.overlay}><View style={styles.box}>
      <View style={styles.header}><Text style={styles.title}>{record ? 'Edit Meeting' : 'Add Meeting'}</Text></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="Title *" value={form.title} onChangeText={(v) => set('title', v)} />
        <Field label="Agenda" value={form.agenda} onChangeText={(v) => set('agenda', v)} multiline />
        <DateField label="Start *" value={form.startAt} onPress={() => setPicker('startAt')} onClear={() => set('startAt', '')} />
        <DateField label="End *" value={form.endAt} onPress={() => setPicker('endAt')} onClear={() => set('endAt', '')} />
        <View style={styles.field}><Text style={styles.label}>Mode</Text><View style={styles.chips}>{(['ONLINE', 'PHONE', 'IN_PERSON'] as MeetingMode[]).map((mode) => <Pressable key={mode} onPress={() => set('mode', mode)} style={[styles.chip, form.mode === mode && styles.chipOn]}><Text style={[styles.chipText, form.mode === mode && styles.chipTextOn]}>{mode.replace('_', ' ')}</Text></Pressable>)}</View></View>
        {form.mode === 'IN_PERSON' ? <Field label="Location *" value={form.location} onChangeText={(v) => set('location', v)} /> : null}
        {form.mode === 'ONLINE' ? <Field label="Meeting URL" value={form.meetingUrl} onChangeText={(v) => set('meetingUrl', v)} placeholder="https://..." /> : null}
        <AssigneeSelect value={form.assignedTo} assigneeId={form.assignedToId} onChange={(name, id) => setForm(current => ({ ...current, assignedTo: name, assignedToId: id }))} />
      </ScrollView>
      <View style={styles.footer}>{!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.buttons}><Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} /><Button title={record ? 'Save Meeting' : 'Add Meeting'} onPress={save} loading={saving} /></View></View>
    </View></View>
    <DateTimePickerModal visible={!!picker} value={picker ? form[picker] : ''} onSelect={(value) => picker && set(picker, value)} onClose={() => setPicker(null)} />
  </Modal>;
}

function DateField({ label, value, onPress, onClear }: { label: string; value: string; onPress: () => void; onClear: () => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable style={styles.date} onPress={onPress}><Ionicons name="calendar-outline" size={18} color={colors.primaryText} /><Text style={[styles.dateText, !value && styles.placeholder]}>{value || 'Choose Date & Time'}</Text>{value ? <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); onClear(); }}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : <Ionicons name="time-outline" size={18} color={colors.muted} />}</Pressable></View>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 12 }, box: { width: '100%', maxWidth: 640, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 8, overflow: 'hidden' }, header: { backgroundColor: colors.navy, padding: 16 }, title: { color: colors.white, fontWeight: '800', fontSize: 16 }, body: { padding: 16, gap: 14 }, field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700', color: colors.text }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text }, multiline: { minHeight: 72, textAlignVertical: 'top' }, date: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10 }, dateText: { flex: 1, color: colors.text, fontWeight: '600' }, placeholder: { color: colors.muted, fontWeight: '400' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 }, chipOn: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.text, fontSize: 13 }, chipTextOn: { color: colors.white, fontWeight: '700' }, footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }, error: { color: colors.danger, fontSize: 13 }, buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 } });
