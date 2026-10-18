import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '@/components/Button';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import { colors } from '@/theme/colors';

export const labelFor = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, x => x.toUpperCase());
export function Field({ label, value, onChange, multiline, numeric, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; numeric?: boolean; placeholder?: string }) {
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><TextInput accessibilityLabel={label} style={[ui.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} multiline={multiline} keyboardType={numeric ? 'decimal-pad' : 'default'} placeholder={placeholder} placeholderTextColor={colors.muted} /></View>;
}
export function Choices({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><View style={ui.row}>{options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityLabel={labelFor(option)} accessibilityState={{ selected: value === option }} style={[ui.choice, value === option && ui.choiceOn]} onPress={() => onChange(option)}><Text style={ui.text}>{option === '' ? 'All' : labelFor(option)}</Text></Pressable>)}</View></View>;
}
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={ui.field}><Text style={ui.label}>{label} · IST</Text><View style={ui.row}><Pressable accessibilityRole="button" accessibilityLabel={label} style={[ui.input, { flex: 1 }]} onPress={() => setOpen(true)}><Text style={ui.text}>{value || 'Choose date and time'}</Text></Pressable>{value ? <Button title="Clear" variant="outline" onPress={() => onChange('')} /> : null}</View><DateTimePickerModal title={label} visible={open} value={value} onSelect={onChange} onClose={() => setOpen(false)} /></View>;
}
export function FormShell({ title, children, error, busy, onClose, onSave, saveLabel = 'Save' }: { title: string; children: React.ReactNode; error?: string; busy: boolean; onClose: () => void; onSave: () => void; saveLabel?: string }) {
  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}><View style={ui.overlay}><View style={ui.modal}><Text accessibilityRole="header" style={ui.heading}>{title}</Text><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.body}>{children}</ScrollView><View style={ui.footer}>{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<View style={ui.row}><Button title="Cancel" variant="outline" disabled={busy} onPress={onClose} /><Button title={saveLabel} loading={busy} onPress={onSave} /></View></View></View></View></Modal>;
}
export function Pager({ page, total, pageSize = 20, onChange }: { page: number; total: number; pageSize?: number; onChange: (page: number) => void }) {
  return <View style={ui.row}><Button title="Previous" variant="outline" disabled={page <= 1} onPress={() => onChange(page - 1)} /><Text style={ui.text}>Page {page} · {total} records</Text><Button title="Next" variant="outline" disabled={page * pageSize >= total} onPress={() => onChange(page + 1)} /></View>;
}
export const ui = StyleSheet.create({
  field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700', color: colors.text }, text: { color: colors.text, fontSize: 13 }, muted: { color: colors.muted, fontSize: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, color: colors.text, backgroundColor: colors.white, minHeight: 44 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  choice: { padding: 10, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }, choiceOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  overlay: { flex: 1, padding: 12, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modal: { width: '100%', maxWidth: 820, maxHeight: '94%', borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden' },
  heading: { padding: 16, fontWeight: '800', color: colors.primaryText, backgroundColor: colors.primary, fontSize: 17 },
  body: { padding: 16, gap: 14 }, footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  error: { color: colors.danger, fontSize: 13 }, panel: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, gap: 10, backgroundColor: colors.white },
});
