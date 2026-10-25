import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { fieldStyles } from '@/settings/ProfileFields';
import Button from '@/components/Button';

type Assignee = { id: string; name: string; role: 'admin' | 'staff'; email: string | null; employeeCode: string | null };
type Props = {
  value: string;
  assigneeId?: string | null;
  onChange: (name: string, id: string) => void;
  label?: string;
};

export default function AssigneeSelect({ value, assigneeId, onChange, label = 'Assign To' }: Props) {
  const { token, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const allowed = !!token && (role === 'admin' || role === 'staff');
  const query = useQuery({
    queryKey: ['assignees', token],
    queryFn: async () => (await api.get<Assignee[]>('/assignees')).data,
    enabled: allowed && open,
    retry: false,
  });
  const term = search.trim().toLowerCase();
  const options = allowed ? (query.data ?? []).filter(option =>
    [option.name, option.role, option.email, option.employeeCode]
      .some(text => text?.toLowerCase().includes(term))) : [];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Select Admin or staff'}`}
        accessibilityState={{ expanded: open }}
        style={[fieldStyles.input, fieldStyles.select]}
        onPress={() => { setSearch(''); setOpen(true); }}
      >
        <Text numberOfLines={1} style={[fieldStyles.value, !value && fieldStyles.placeholder]}>
          {value || 'Select Admin or staff'}
        </Text>
        <Ionicons name="chevron-down" size={15} color="#68616E" />
      </Pressable>
      {open && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={fieldStyles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close assignment selection" onPress={() => setOpen(false)} />
            <View style={fieldStyles.dialog} accessibilityViewIsModal>
              <View style={fieldStyles.dialogHeader}>
                <Text accessibilityRole="header" style={fieldStyles.dialogTitle}>{label}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Close assignment selection" hitSlop={12} onPress={() => setOpen(false)}>
                  <Ionicons name="close" size={22} color="#514759" />
                </Pressable>
              </View>
              <TextInput accessibilityLabel="Search Admin or staff" style={fieldStyles.input} placeholder="Search..." value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} autoFocus />
              {query.isPending ? <ActivityIndicator color="#0B2F7D" /> : query.isError ? (
                <View accessibilityRole="alert" style={styles.field}>
                  <Text style={fieldStyles.error}>{errorMessage(query.error)}</Text>
                  <Button title="Retry" variant="outline" onPress={() => { if (allowed) void query.refetch(); }} />
                </View>
              ) : (
                <ScrollView style={fieldStyles.options} keyboardShouldPersistTaps="handled">
                  {options.map(option => {
                    const selected = assigneeId ? assigneeId === option.id : value === option.name;
                    return (
                      <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} style={[fieldStyles.option, selected && fieldStyles.selected]} onPress={() => { onChange(option.name, option.id); setOpen(false); }}>
                        <View style={styles.optionText}>
                          <Text style={fieldStyles.value}>{option.name}{option.role === 'admin' ? ' (Admin)' : ''}</Text>
                          {option.role === 'staff' && (option.employeeCode || option.email) ? <Text style={styles.detail}>{[option.employeeCode, option.email].filter(Boolean).join(' · ')}</Text> : null}
                        </View>
                        {selected ? <Ionicons name="checkmark" size={18} color="#0B2F7D" /> : null}
                      </Pressable>
                    );
                  })}
                  {!options.length ? <Text style={fieldStyles.hint}>No matching Admin or staff found.</Text> : null}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  optionText: { flex: 1, gap: 3 },
  detail: { color: '#77707E', fontSize: 11 },
});
