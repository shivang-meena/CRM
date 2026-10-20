import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModulePermission } from '@/hooks/usePermissions';

type PageShortcut = { permission: ModulePermission; label: string; path: '/leads' | '/tasks' | '/reminders' | '/meetings' | '/notes'; icon: React.ComponentProps<typeof Ionicons>['name'] };

const pages: PageShortcut[] = [
  { permission: 'lead', label: 'Lead', path: '/leads', icon: 'funnel-outline' },
  { permission: 'task', label: 'Task', path: '/tasks', icon: 'calendar-outline' },
  { permission: 'reminder', label: 'Reminder', path: '/reminders', icon: 'alarm-outline' },
  { permission: 'meeting', label: 'Meeting', path: '/meetings', icon: 'headset-outline' },
  { permission: 'note', label: 'Note', path: '/notes', icon: 'bookmark' },
];

export default function NavbarSearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { canAccess } = usePermissions();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    return pages.filter(page => canAccess(page.permission) && (!value || page.label.toLocaleLowerCase().includes(value)));
  }, [query, canAccess]);

  function close() {
    setQuery('');
    onClose();
  }

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <View style={styles.overlay}><View style={styles.modal} accessibilityViewIsModal>
      <View style={styles.header}><Text style={styles.title}>Find a page</Text><Pressable accessibilityRole="button" accessibilityLabel="Close page search" onPress={close} style={styles.close}><Ionicons name="close-outline" size={22} color={colors.primaryText} /></Pressable></View>
      <View style={styles.body}><TextInput accessibilityLabel="Find a page" autoFocus value={query} onChangeText={setQuery} placeholder="Search pages" placeholderTextColor={colors.muted} style={styles.input} /><ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
        {matches.length ? matches.map(page => <Pressable key={page.path} accessibilityRole="button" accessibilityLabel={`Open ${page.label} page`} onPress={() => { router.replace(page.path); close(); }} style={({ pressed }) => [styles.result, pressed && styles.pressed]}><Ionicons name={page.icon} size={17} color={colors.purple} /><Text style={styles.resultText}>{page.label}</Text><Ionicons name="chevron-forward-outline" size={16} color={colors.muted} /></Pressable>) : <Text style={styles.empty}>No matching pages</Text>}
      </ScrollView></View>
      <View style={styles.footer}><Pressable accessibilityRole="button" onPress={close} style={styles.closeButton}><Text style={styles.closeText}>Close</Text></Pressable></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 420, maxHeight: '78%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  close: { padding: 4 },
  body: { padding: 14, gap: 10 },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, color: colors.text, fontSize: 13 },
  results: { gap: 5 },
  result: { minHeight: 42, borderRadius: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  pressed: { backgroundColor: colors.navHover },
  resultText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 12, paddingVertical: 20, textAlign: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 12, alignItems: 'flex-end' },
  closeButton: { minHeight: 38, borderWidth: 1, borderColor: colors.primary, borderRadius: 7, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.primaryText, fontWeight: '700' },
});
