import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import Button from './Button';

export type SelectionOption = { id: string; name: string; isActive: boolean };

export default function SearchableMultiSelect({
  label, options, selectedIds, onChange, disabled, loading, error, onRetry,
}: {
  label: string; options: SelectionOption[]; selectedIds: string[]; onChange: (ids: string[]) => void;
  disabled?: boolean; loading?: boolean; error?: string; onRetry?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  useEffect(() => { if (!open) setSearch(''); }, [open]);
  const selected = useMemo(() => selectedIds.map(id => options.find(row => row.id === id)).filter((row): row is SelectionOption => Boolean(row)), [selectedIds, options]);
  const visible = options.filter(row => row.name.toLowerCase().includes(search.trim().toLowerCase()));
  const begin = () => { setDraft([...selectedIds]); setSearch(''); setOpen(true); };
  const toggle = (option: SelectionOption) => {
    if (!option.isActive && !draft.includes(option.id)) return;
    setDraft(current => current.includes(option.id) ? current.filter(id => id !== option.id) : [...current, option.id]);
  };
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Select ${label}`} accessibilityState={{ disabled, expanded: open }} disabled={disabled} onPress={begin} style={[styles.trigger, disabled && styles.disabled]}>
        <Text style={selectedIds.length ? styles.value : styles.placeholder}>{selectedIds.length ? `${selectedIds.length} selected` : `Select ${label.toLowerCase()}...`}</Text>
        <Ionicons name="chevron-down" size={17} color={colors.muted} />
      </Pressable>
      {selected.length ? <View style={styles.chips}>{selected.map(row => (
        <View key={row.id} style={styles.chip}>
          <Text style={styles.chipText}>{row.name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${row.name}`} disabled={disabled} onPress={() => onChange(selectedIds.filter(id => id !== row.id))}><Ionicons name="close-circle" size={17} color={colors.muted} /></Pressable>
        </View>
      ))}</View> : null}
      {loading ? <Text style={styles.hint}>Loading {label.toLowerCase()}...</Text> : null}
      {error ? <View style={styles.errorRow}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>{onRetry ? <Button title="Retry" variant="outline" onPress={onRetry} /> : null}</View> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Select {label}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
            <TextInput accessibilityLabel={`Search ${label}`} value={search} onChangeText={setSearch} placeholder={`Search ${label.toLowerCase()}...`} style={styles.search} />
            <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
              {loading ? <Text style={styles.hint}>Loading...</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {!loading && !error && visible.map(row => {
                const checked = draft.includes(row.id);
                return <Pressable key={row.id} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: !row.isActive }} disabled={!row.isActive && !checked} onPress={() => toggle(row)} style={styles.option}>
                  <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={21} color={checked ? colors.primary : colors.muted} />
                  <Text style={[styles.value, !row.isActive && styles.inactive]}>{row.name}{row.isActive ? '' : ' (Inactive)'}</Text>
                </Pressable>;
              })}
              {!loading && !error && visible.length === 0 ? <Text style={styles.hint}>{search.trim() ? 'No matching items.' : `No ${label.toLowerCase()} available. Add them in General Settings.`}</Text> : null}
            </ScrollView>
            <View style={styles.actions}><Button title="Clear All" variant="outline" disabled={!draft.length} onPress={() => setDraft([])} /><Button title="Cancel" variant="outline" onPress={() => setOpen(false)} /><Button title="Done" onPress={() => { onChange(draft); setOpen(false); }} /></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700', color: colors.text },
  trigger: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white },
  disabled: { opacity: 0.6 }, value: { color: colors.text, fontSize: 14 }, placeholder: { color: colors.muted, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5 }, chipText: { color: colors.text, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12, padding: 10 }, error: { color: colors.danger, fontSize: 12 }, errorRow: { gap: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(16, 24, 40, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 480, maxHeight: '82%', backgroundColor: colors.white, borderRadius: 12, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.text },
  options: { minHeight: 80 }, option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 }, inactive: { color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
});
