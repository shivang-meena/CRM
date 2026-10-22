import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import { DashboardEntry } from './model';
import { dashboardColors as palette } from './DashboardPanel';

type Props = {
  kind: DashboardEntry['kind'];
  entry?: DashboardEntry;
  defaultDate: Date;
  onSave: (entry: DashboardEntry) => Promise<boolean>;
  onClose: () => void;
};

export default function DashboardComposer({ kind, entry, defaultDate, onSave, onClose }: Props) {
  const [text, setText] = useState(entry?.text ?? '');
  const [date, setDate] = useState(formatDateTime(entry?.date ?? defaultDate.toISOString()));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const label = kind === 'note' ? 'Note' : kind === 'task' ? 'Task' : kind === 'Events' ? 'Event' : kind;

  async function submit() {
    if (!text.trim()) { setError(`Enter your ${label.toLowerCase()}.`); return; }
    const parsed = parseDateTimeInput(date);
    if (kind !== 'note' && (!parsed.ok || !parsed.value || formatDateTime(parsed.value) !== date.trim())) {
      setError('Enter a valid date and time: DD-MM-YYYY HH:mm.'); return;
    }
    setSaving(true);
    const saved = await onSave({ id: entry?.id ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      kind, text: text.trim(), date: kind === 'note' ? null : parsed.value, completed: entry?.completed ?? false });
    if (saved) onClose();
    else { setError('Could not save. Check device storage and try again.'); setSaving(false); }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => { if (!saving) onClose(); }}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.heading}>{entry ? 'Edit' : 'Add'} {label}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" disabled={saving} onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close-outline" size={23} color={palette.purple} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{label}</Text>
            <TextInput accessibilityLabel={label} autoFocus multiline={kind === 'note'} value={text} onChangeText={setText}
              editable={!saving} maxLength={kind === 'note' ? 1000 : 160} placeholder={kind === 'note' ? 'Write your note...' : `Enter ${label.toLowerCase()} details`}
              placeholderTextColor={palette.muted} style={[styles.input, kind === 'note' && styles.noteInput]} />
            {kind !== 'note' ? <>
              <Text style={styles.label}>Date & time</Text>
              <TextInput accessibilityLabel="Date and time" value={date} onChangeText={setDate} editable={!saving} style={styles.input} placeholder="DD-MM-YYYY HH:mm" />
              <Text style={styles.hint}>DD-MM-YYYY HH:mm (24-hour time)</Text>
            </> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <View style={styles.buttons}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Save ${label.toLowerCase()}`} disabled={saving} onPress={submit} style={styles.save}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save {label}</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,47,69,0.45)', padding: 20, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  header: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.border },
  heading: { fontSize: 18, fontWeight: '600', color: palette.text },
  iconButton: { padding: 6 },
  form: { padding: 20, gap: 10 },
  label: { color: palette.text, fontSize: 13, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#E3E0ED', borderRadius: 7, padding: 12, fontSize: 14, color: palette.text },
  noteInput: { minHeight: 130, textAlignVertical: 'top' },
  hint: { color: palette.muted, fontSize: 11 },
  error: { fontSize: 12, color: '#B3261E' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancel: { padding: 12, borderWidth: 1, borderColor: '#E3E0ED', borderRadius: 6 },
  cancelText: { color: palette.purple, fontSize: 13 },
  save: { padding: 12, backgroundColor: palette.purple, borderRadius: 6, minWidth: 100, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
