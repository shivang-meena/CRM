import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import { errorMessage } from '@/api/client';
import { Task, TaskLabel, TaskPriority, TaskStatus, TaskRecurrenceFrequency } from '@/types/task';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import { colors } from '@/theme/colors';
import TaskStatusControl from './TaskStatusControl';

type FormData = { subject: string; description: string; priority: TaskPriority; status: TaskStatus; labelId: string; assignedTo: string; startAt: string; endAt: string; recursive: boolean; frequency: TaskRecurrenceFrequency; interval: string; recurrenceEndsAt: string };
const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const frequencies: { value: TaskRecurrenceFrequency; label: string }[] = [{ value: 'DAILY', label: 'Daily' }, { value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }];
const isoPlus = (base: Date, days: number) => new Date(base.getTime() + days * 86400000).toISOString();
const initial = (userName: string): FormData => { const now = new Date(); return { subject: '', description: '', priority: 'LOW', status: 'NEW', labelId: '', assignedTo: userName, startAt: now.toISOString(), endAt: isoPlus(now, 1), recursive: false, frequency: 'DAILY', interval: '1', recurrenceEndsAt: '' }; };

export default function TaskFormModal({ visible, task, userName, labels, onClose, onSave, onCreateLabel }: { visible: boolean; task: Task | null; userName: string; labels: TaskLabel[]; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void>; onCreateLabel?: (name: string, colour: string) => Promise<TaskLabel | undefined> }) {
  const [form, setForm] = useState<FormData>(() => initial(userName));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<'startAt' | 'endAt' | 'recurrenceEndsAt' | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [labelBusy, setLabelBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!task) { setForm(initial(userName)); setErrors({}); setNewLabel(''); return; }
    setForm({ subject: task.subject, description: task.description ?? '', priority: task.priority, status: task.status, labelId: task.labelId ?? '', assignedTo: task.assignedTo, startAt: task.startAt, endAt: task.endAt, recursive: !!task.recurrenceSeriesId, frequency: task.recurrenceSeries?.frequency ?? 'DAILY', interval: String(task.recurrenceSeries?.interval ?? 1), recurrenceEndsAt: task.recurrenceSeries?.recurrenceEndsAt ?? '' });
    setErrors({});
  }, [visible, task, userName]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm(current => ({ ...current, [key]: value }));
  const displayDate = (iso: string) => formatDateTime(iso);
  const label = useMemo(() => labels.find(item => item.id === form.labelId), [labels, form.labelId]);

  async function addLabel() {
    if (!onCreateLabel || !newLabel.trim()) return;
    setLabelBusy(true);
    try { const created = await onCreateLabel(newLabel.trim(), '#6D4AC4'); if (created) { set('labelId', created.id); setNewLabel(''); } }
    catch (error) { setErrors(current => ({ ...current, label: errorMessage(error) })); }
    finally { setLabelBusy(false); }
  }

  async function save() {
    const nextErrors: Record<string, string> = {};
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    const start = parseDateTimeInput(displayDate(form.startAt));
    const end = parseDateTimeInput(displayDate(form.endAt));
    if (!start.ok) nextErrors.startAt = 'Choose a valid start date and time.';
    if (!end.ok) nextErrors.endAt = 'Choose a valid end date and time.';
    if (start.value && end.value && new Date(end.value) <= new Date(start.value)) nextErrors.endAt = 'End Date must be after Start Date.';
    if (form.recursive && !form.interval.trim().match(/^\d+$/)) nextErrors.interval = 'Interval must be a positive integer.';
    if (form.recursive && Number(form.interval) < 1) nextErrors.interval = 'Interval must be at least 1.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = { subject: form.subject.trim(), description: form.description.trim() || null, priority: form.priority, status: form.status, labelId: form.labelId || null, assignedTo: form.assignedTo.trim() || userName, startAt: start.value, endAt: end.value, recursive: form.recursive, ...(form.recursive ? { frequency: form.frequency, interval: Number(form.interval), recurrenceEndsAt: form.recurrenceEndsAt ? parseDateTimeInput(displayDate(form.recurrenceEndsAt)).value : null } : {}) };
      if (task) data.version = task.version;
      else data.requestKey = `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      await onSave(data);
    } catch (error) { setErrors(current => ({ ...current, form: errorMessage(error) })); }
    finally { setSaving(false); }
  }

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.modal}>
      <View style={styles.header}><View style={styles.headerTitle}><Ionicons name="checkbox-outline" size={20} color={colors.primaryText} /><Text style={styles.title}>{task ? 'Edit Task' : 'Add Task'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close task form" onPress={onClose}><Ionicons name="close" size={22} color={colors.primaryText} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {errors.form ? <Text accessibilityRole="alert" style={styles.formError}>{errors.form}</Text> : null}
        <Field label="Subject *" error={errors.subject}><TextInput value={form.subject} onChangeText={value => set('subject', value)} placeholder="Task subject" placeholderTextColor={colors.muted} style={styles.input} maxLength={200} /></Field>
        <View style={styles.row}><Field label="Priority" half><View style={styles.chips}>{priorities.map(value => <Chip key={value} label={value[0] + value.slice(1).toLowerCase()} selected={form.priority === value} onPress={() => set('priority', value)} />)}</View></Field><Field label="Status" half><Text style={styles.statusHint}>{form.status === 'NEW' ? 'New' : form.status.replace('_', ' ')}</Text><TaskStatusControl value={form.status} onChange={value => set('status', value)} /></Field></View>
        <Field label="Label (Optional)"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><Chip label="None" selected={!form.labelId} onPress={() => set('labelId', '')} />{labels.map(item => <Chip key={item.id} label={item.name} selected={item.id === form.labelId} onPress={() => set('labelId', item.id)} colour={item.colour} />)}</ScrollView>{label ? <Text style={styles.selectedLabel}>Selected: {label.name}</Text> : null}{onCreateLabel ? <View style={styles.newLabelRow}><TextInput value={newLabel} onChangeText={setNewLabel} placeholder="New label name" placeholderTextColor={colors.muted} style={[styles.input, styles.newLabelInput]} /><Button title="Add" onPress={() => { void addLabel(); }} loading={labelBusy} disabled={!newLabel.trim()} /></View> : null}{errors.label ? <Text style={styles.fieldError}>{errors.label}</Text> : null}</Field>
        <View style={styles.toggleRow}><Pressable accessibilityRole="switch" accessibilityLabel="Recursive task" accessibilityState={{ checked: form.recursive }} onPress={() => set('recursive', !form.recursive)} style={[styles.toggle, form.recursive && styles.toggleOn]}><View style={[styles.knob, form.recursive && styles.knobOn]} /></Pressable><View><Text style={styles.toggleTitle}>Recursive</Text><Text style={styles.helper}>Repeat this task on an explicit schedule.</Text></View></View>
        <View style={styles.row}><Field label="Start Date" half error={errors.startAt}><Pressable accessibilityRole="button" accessibilityLabel="Choose start date and time" onPress={() => setPicker('startAt')} style={styles.dateButton}><Text style={styles.dateText}>{displayDate(form.startAt)}</Text><Ionicons name="calendar-outline" size={16} color={colors.primaryText} /></Pressable></Field><Field label="End Date" half error={errors.endAt}><Pressable accessibilityRole="button" accessibilityLabel="Choose end date and time" onPress={() => setPicker('endAt')} style={styles.dateButton}><Text style={styles.dateText}>{displayDate(form.endAt)}</Text><Ionicons name="calendar-outline" size={16} color={colors.primaryText} /></Pressable></Field></View>
        {form.recursive ? <View style={styles.recurrence}><Text style={styles.labelText}>Frequency</Text><View style={styles.chips}>{frequencies.map(item => <Chip key={item.value} label={item.label} selected={form.frequency === item.value} onPress={() => set('frequency', item.value)} />)}</View><Field label="Interval" error={errors.interval}><TextInput value={form.interval} onChangeText={value => set('interval', value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={styles.input} /></Field><Field label="Recurrence End Date (Optional)"><Pressable accessibilityRole="button" accessibilityLabel="Choose recurrence end date" onPress={() => setPicker('recurrenceEndsAt')} style={styles.dateButton}><Text style={styles.dateText}>{form.recurrenceEndsAt ? displayDate(form.recurrenceEndsAt) : 'No end date'}</Text><Ionicons name="calendar-outline" size={16} color={colors.primaryText} /></Pressable></Field></View> : null}
        <Field label="Assignee"><TextInput value={form.assignedTo} onChangeText={value => set('assignedTo', value)} placeholder="Current user" placeholderTextColor={colors.muted} style={styles.input} /></Field>
        <Field label="Description (Optional)"><TextInput value={form.description} onChangeText={value => set('description', value)} placeholder="Add more detail" placeholderTextColor={colors.muted} style={[styles.input, styles.description]} multiline maxLength={4000} /></Field>
      </ScrollView>
      <View style={styles.footer}><Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} /><Button title={task ? 'Save Changes' : 'Save Task'} onPress={() => { void save(); }} loading={saving} /></View>
    </View></View>
    <DateTimePickerModal visible={!!picker} value={picker ? displayDate(form[picker]) : ''} title={picker === 'endAt' ? 'Choose End Date' : picker === 'recurrenceEndsAt' ? 'Choose Recurrence End Date' : 'Choose Start Date'} onSelect={value => { if (!picker) return; if (!value) { set(picker, ''); return; } const parsed = parseDateTimeInput(value); if (parsed.value) set(picker, parsed.value); }} onClose={() => setPicker(null)} />
  </Modal>;
}

function Field({ label, children, error, half }: { label: string; children: React.ReactNode; error?: string; half?: boolean }) { return <View style={[styles.field, half && styles.half]}><Text style={styles.labelText}>{label}</Text>{children}{error ? <Text style={styles.fieldError}>{error}</Text> : null}</View>; }
function Chip({ label, selected, onPress, colour }: { label: string; selected: boolean; onPress: () => void; colour?: string }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected, colour ? { borderColor: colour } : null]}><Text style={[styles.chipText, selected && styles.chipTextSelected, colour ? { color: colour } : null]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 12 }, modal: { width: '100%', maxWidth: 720, maxHeight: '94%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.primary }, headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: colors.primaryText, fontWeight: '800', fontSize: 17 }, body: { padding: 16, gap: 13 }, row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }, field: { gap: 5 }, half: { flex: 1, minWidth: 230 }, labelText: { color: colors.text, fontSize: 12, fontWeight: '800' }, input: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, paddingVertical: 9, color: colors.text, backgroundColor: colors.white }, description: { minHeight: 86, textAlignVertical: 'top' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.white }, chipSelected: { borderColor: colors.accent, backgroundColor: colors.primarySoft }, chipText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, chipTextSelected: { color: colors.primaryText }, statusHint: { display: 'none' }, dateButton: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }, dateText: { flex: 1, color: colors.text, fontSize: 11 }, fieldError: { color: colors.danger, fontSize: 11 }, formError: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 9, borderRadius: 6, fontSize: 12 }, footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 }, toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, toggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: '#DCE3F0', padding: 3, justifyContent: 'center' }, toggleOn: { backgroundColor: colors.accent }, knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white }, knobOn: { alignSelf: 'flex-end' }, toggleTitle: { color: colors.text, fontWeight: '800', fontSize: 12 }, helper: { color: colors.muted, fontSize: 11, marginTop: 2 }, recurrence: { gap: 10, padding: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: '#FAFBFF' }, newLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 }, newLabelInput: { flex: 1, minHeight: 38 }, selectedLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
