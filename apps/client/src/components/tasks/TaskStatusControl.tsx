import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TaskStatus } from '@/types/task';
import { colors } from '@/theme/colors';

export const TASK_STATUS_ORDER: { value: TaskStatus; label: string }[] = [
  { value: 'NEW', label: 'New' }, { value: 'IN_FEEDBACK', label: 'In Feedback' }, { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' }, { value: 'PROCESSING', label: 'Processing' },
];

export function taskStatusLabel(status: TaskStatus) { return TASK_STATUS_ORDER.find(item => item.value === status)?.label ?? status; }

export default function TaskStatusControl({ value, onChange, disabled }: { value: TaskStatus | undefined; onChange: (value: TaskStatus) => void; disabled?: boolean }) {
  return <View style={styles.row} accessibilityRole="radiogroup">
    {TASK_STATUS_ORDER.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={`Set status ${item.label}`} accessibilityState={{ selected: item.value === value, disabled }} disabled={disabled}
      onPress={() => onChange(item.value)} style={[styles.option, item.value === value && styles.selected]}>
      <Text style={[styles.text, item.value === value && styles.selectedText]}>{item.label}</Text>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.white },
  selected: { borderColor: colors.accent, backgroundColor: colors.primarySoft },
  text: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  selectedText: { color: colors.primaryText },
});
