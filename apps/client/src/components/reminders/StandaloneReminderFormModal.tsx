import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { ActivityRecord } from '@/types/leadActivities';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import Button from '../Button';
import DateTimePickerModal from '../DateTimePickerModal';

type Props = { visible: boolean; record: ActivityRecord | null; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void> };
const requestKey = () => 'crm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);

export default function StandaloneReminderFormModal({ visible, record, onClose, onSave }: Props) {
  const [title, setTitle] = useState(record?.title ?? '');
  const [message, setMessage] = useState(record?.message ?? '');
  const [remindAt, setRemindAt] = useState(record?.remindAt ? formatDateTime(record.remindAt) : formatDateTime(new Date(Date.now() + 60 * 60000).toISOString()));
  const [picker, setPicker] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) { setTitle(record?.title ?? ''); setMessage(record?.message ?? ''); setRemindAt(record?.remindAt ? formatDateTime(record.remindAt) : formatDateTime(new Date(Date.now() + 60 * 60000).toISOString())); setPicker(false); setError(''); } }, [visible, record]);
  async function save() {
    if (!title.trim()) return setError('Title is required.');
    const parsed = parseDateTimeInput(remindAt); if (!parsed.ok || !parsed.value) return setError('Enter a valid reminder date like 25-12-2026 18:30.');
    setSaving(true); setError('');
    try { await onSave({ title: title.trim(), message: message.trim(), remindAt: parsed.value, ...(!record ? { requestKey: requestKey() } : {}) }); onClose(); } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onClose()}><View style={styles.overlay}><View style={styles.box}>
    <View style={styles.header}><Text style={styles.title}>{record ? 'Edit Reminder' : 'Add Reminder'}</Text></View>
    <ScrollView contentContainerStyle={styles.body}><Field label="Title *" value={title} onChangeText={setTitle} /><Field label="Message" value={message} onChangeText={setMessage} multiline /><View style={styles.field}><Text style={styles.label}>Remind At *</Text><Pressable style={styles.date} onPress={() => setPicker(true)}><Ionicons name="calendar-outline" size={18} color={colors.primaryText} /><Text style={styles.dateText}>{remindAt || 'Choose Date & Time'}</Text><Ionicons name="time-outline" size={18} color={colors.muted} /></Pressable></View></ScrollView>
    <View style={styles.footer}>{!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.buttons}><Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} /><Button title={record ? 'Save Reminder' : 'Add Reminder'} onPress={save} loading={saving} /></View></View>
  </View></View><DateTimePickerModal visible={picker} value={remindAt} onSelect={setRemindAt} onClose={() => setPicker(false)} /></Modal>;
}

function Field({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline]} value={value} onChangeText={onChangeText} multiline={multiline} placeholderTextColor={colors.muted} /></View>; }
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 12 }, box: { width: '100%', maxWidth: 560, maxHeight: '90%', backgroundColor: colors.white, borderRadius: 8, overflow: 'hidden' }, header: { backgroundColor: colors.navy, padding: 16 }, title: { color: colors.white, fontWeight: '800', fontSize: 16 }, body: { padding: 16, gap: 14 }, field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700', color: colors.text }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text }, multiline: { minHeight: 90, textAlignVertical: 'top' }, date: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10 }, dateText: { flex: 1, color: colors.text, fontWeight: '600' }, footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }, error: { color: colors.danger, fontSize: 13 }, buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 } });
