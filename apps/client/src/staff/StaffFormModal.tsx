import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { StaffFormValues, StaffStatus } from '@/types/staff';
import { StaffDatePickerModal } from '@/staff/StaffDatePickerModal';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  values: StaffFormValues;
  error: string | null;
  pending: boolean;
  onChange: <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function StaffFormModal({ visible, mode, values, error, pending, onChange, onClose, onSubmit }: Props) {
  const [datePicker, setDatePicker] = useState<'birthDate' | 'joiningDate' | null>(null);
  const edit = mode === 'edit';
  const field = (key: keyof StaffFormValues, label: string, placeholder: string, options: { keyboardType?: 'default' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences'; required?: boolean } = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{options.required ? ' *' : ''}</Text>
      <TextInput
        accessibilityLabel={label}
        value={String(values[key])}
        onChangeText={value => onChange(key, value as StaffFormValues[typeof key])}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={options.keyboardType ?? 'default'}
        autoCapitalize={options.autoCapitalize ?? 'sentences'}
        editable={!pending}
        style={styles.input}
      />
    </View>
  );

  const dateField = (key: 'birthDate' | 'joiningDate', label: string, required = false) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <View style={styles.dateInputRow}>
        <TextInput
          accessibilityLabel={label}
          value={values[key]}
          onChangeText={value => onChange(key, value)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          editable={!pending}
          style={[styles.input, styles.dateInput]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose ${label.toLowerCase()} from calendar`}
          disabled={pending}
          onPress={() => setDatePicker(key)}
          style={styles.calendarButton}
        >
          <Ionicons name="calendar-outline" size={19} color={colors.primaryText} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!pending) onClose(); }}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{edit ? 'Edit Staff' : 'Add Staff'}</Text>
              <Text style={styles.subtitle}>Enter the employee details below.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close staff form" disabled={pending} onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Text style={styles.section}>Personal details</Text>
            <View style={styles.row}>
              {field('firstName', 'First name', 'Enter first name', { required: true })}
              {field('lastName', 'Last name', 'Enter last name', { required: true })}
            </View>
            {field('email', 'Email address', 'name@company.com', { keyboardType: 'email-address', autoCapitalize: 'none', required: true })}
            <View style={styles.row}>
              {field('phone', 'Phone', 'Phone number', { keyboardType: 'phone-pad' })}
              <View style={styles.field}>
                <Text style={styles.label}>Status *</Text>
                <View style={styles.statusRow}>
                  {(['ACTIVE', 'INACTIVE'] as StaffStatus[]).map(status => {
                    const selected = values.status === status;
                    return (
                      <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected }} disabled={pending} onPress={() => onChange('status', status)} style={[styles.statusChoice, selected && styles.statusSelected]}>
                        <Text style={[styles.statusChoiceText, selected && styles.statusSelectedText]}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={styles.row}>
              {dateField('birthDate', 'Birth date')}
              {dateField('joiningDate', 'Joining date', true)}
            </View>
            <Text style={styles.hint}>Use YYYY-MM-DD for dates, for example 1995-05-12.</Text>
            <Text style={styles.section}>Employment details</Text>
            <View style={styles.row}>
              {field('department', 'Department', 'e.g. Sales, HR')}
              {field('designation', 'Designation', 'e.g. Coordinator')}
            </View>
            {field('employeeCode', 'Employee code', 'Optional unique code')}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={pending} onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={pending} onPress={onSubmit} style={[styles.button, styles.saveButton, pending && styles.disabled]}>
              <Text style={styles.saveText}>{pending ? 'Saving…' : edit ? 'Save changes' : 'Add staff'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    <StaffDatePickerModal
      visible={Boolean(datePicker)}
      value={datePicker ? values[datePicker] : ''}
      title={datePicker === 'birthDate' ? 'Choose birth date' : 'Choose joining date'}
      allowClear={datePicker === 'birthDate'}
      onSelect={date => {
        if (datePicker === 'birthDate') onChange('birthDate', date);
        else if (datePicker === 'joiningDate') onChange('joiningDate', date);
        setDatePicker(null);
      }}
      onClose={() => setDatePicker(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 640, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  closeText: { color: colors.muted, fontSize: 24, lineHeight: 28 },
  body: { padding: 18, gap: 13 },
  section: { color: colors.primaryText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flex: 1, minWidth: 210, gap: 6 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, color: colors.text, backgroundColor: colors.white, fontSize: 14 },
  dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateInput: { flex: 1 },
  calendarButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 7, backgroundColor: colors.accentSoft },
  hint: { color: colors.muted, fontSize: 11, marginTop: -8 },
  statusRow: { minHeight: 42, flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 7, overflow: 'hidden' },
  statusChoice: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  statusSelected: { backgroundColor: colors.accentSoft },
  statusChoiceText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  statusSelectedText: { color: colors.primaryText },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: 7, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border },
  button: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 7 },
  cancelButton: { borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.text, fontWeight: '600' },
  saveButton: { backgroundColor: colors.primaryText },
  saveText: { color: colors.white, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
