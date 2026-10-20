import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import { colors } from '@/theme/colors';
import { ApplyLeavePayload, LeaveType } from '@/types/leave';

export interface LeaveFormValues {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  leaveDetail: string;
}

interface Props {
  visible: boolean;
  mode: 'apply' | 'edit';
  values: LeaveFormValues;
  error: string | null;
  pending: boolean;
  onChange: <K extends keyof LeaveFormValues>(key: K, value: LeaveFormValues[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'SICK', label: 'Sick' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'EARNED', label: 'Earned' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'PATERNITY', label: 'Paternity' },
  { value: 'BEREAVEMENT', label: 'Bereavement' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'OTHER', label: 'Other' },
];

const REASONS = [
  'Sick Leave',
  'Personal',
  'Family Emergency',
  'Bereavement',
  'Vacation',
  'Medical Appointment',
  'Other',
];

export function LeaveFormModal({ visible, mode, values, error, pending, onChange, onClose, onSubmit }: Props) {
  const edit = mode === 'edit';
  const [picker, setPicker] = useState<'startDate' | 'endDate' | null>(null);

  useEffect(() => {
    if (!visible) setPicker(null);
  }, [visible]);

  // The shared picker uses DD-MM-YYYY; leave values retain YYYY-MM-DD for saving.
  const pickerValue = picker
    ? values[picker].replace(/^(\d{4})-(\d{2})-(\d{2})(.*)$/, '$3-$2-$1$4')
    : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!pending) onClose(); }}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{edit ? 'Edit Leave' : 'Apply for Leave'}</Text>
              <Text style={styles.subtitle}>Fill in the leave details below.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close leave form" disabled={pending} onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            {/* Leave Type */}
            <Text style={styles.section}>Leave details</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Leave Type *</Text>
              <View style={styles.pickerRow}>
                {LEAVE_TYPES.map(lt => {
                  const selected = values.type === lt.value;
                  return (
                    <Pressable key={lt.value} accessibilityRole="button" accessibilityState={{ selected }} disabled={pending} onPress={() => onChange('type', lt.value)} style={[styles.pickerChip, selected && styles.pickerChipActive]}>
                      <Text style={[styles.pickerChipText, selected && styles.pickerChipTextActive]}>{lt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Start / End Date */}
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Start Date *</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose leave start date and time"
                  disabled={pending}
                  onPress={() => setPicker('startDate')}
                  style={[styles.input, styles.dateButton, pending && styles.disabled]}
                >
                  <Text style={[styles.dateText, !values.startDate && styles.placeholder]}>{values.startDate || 'Choose date and time'}</Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
                </Pressable>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>End Date *</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose leave end date and time"
                  disabled={pending}
                  onPress={() => setPicker('endDate')}
                  style={[styles.input, styles.dateButton, pending && styles.disabled]}
                >
                  <Text style={[styles.dateText, !values.endDate && styles.placeholder]}>{values.endDate || 'Choose date and time'}</Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.hint}>Choose the start and end date and time using the calendar. All times are in IST.</Text>

            {/* Reason picker */}
            <View style={styles.field}>
              <Text style={styles.label}>Reason *</Text>
              <View style={styles.pickerRow}>
                {REASONS.map(r => {
                  const selected = values.reason === r;
                  return (
                    <Pressable key={r} accessibilityRole="button" accessibilityState={{ selected }} disabled={pending} onPress={() => onChange('reason', r)} style={[styles.pickerChip, selected && styles.pickerChipActive]}>
                      <Text style={[styles.pickerChipText, selected && styles.pickerChipTextActive]}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Leave Detail */}
            <View style={styles.field}>
              <Text style={styles.label}>Leave Detail</Text>
              <TextInput
                accessibilityLabel="Leave Detail"
                value={values.leaveDetail}
                onChangeText={v => onChange('leaveDetail', v)}
                placeholder="Additional details (optional)"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                editable={!pending}
                style={[styles.input, styles.multiline]}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={pending} onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={pending} onPress={onSubmit} style={[styles.button, styles.saveButton, pending && styles.disabled]}>
              <Text style={styles.saveText}>{pending ? 'Saving…' : edit ? 'Save changes' : 'Apply Leave'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <DateTimePickerModal
        visible={visible && !pending && picker !== null}
        value={pickerValue}
        title={picker === 'endDate' ? 'Choose Leave End Date' : 'Choose Leave Start Date'}
        onSelect={value => {
          if (!picker || pending) return;
          onChange(picker, value.replace(/^(\d{2})-(\d{2})-(\d{4})(.*)$/, '$3-$2-$1$4'));
        }}
        onClose={() => setPicker(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 660, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  closeText: { color: colors.muted, fontSize: 24, lineHeight: 28 },
  body: { padding: 18, gap: 13 },
  section: { color: colors.primaryText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flex: 1, minWidth: 210, gap: 6 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, color: colors.text, backgroundColor: colors.white, fontSize: 14 },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10 },
  dateText: { flex: 1, color: colors.text, fontSize: 14 },
  placeholder: { color: colors.muted },
  multiline: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  hint: { color: colors.muted, fontSize: 11, marginTop: -8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  pickerChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.primaryText },
  pickerChipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  pickerChipTextActive: { color: colors.primaryText },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: 7, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border },
  button: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 7 },
  cancelButton: { borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.text, fontWeight: '600' },
  saveButton: { backgroundColor: colors.primaryText },
  saveText: { color: colors.white, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
