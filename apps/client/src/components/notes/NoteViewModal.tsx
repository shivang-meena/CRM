import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '@/types/note';
import { colors } from '@/theme/colors';

export default function NoteViewModal({ visible, note, loading, onClose }: { visible: boolean; note: Note | null; loading?: boolean; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.modal} accessibilityViewIsModal>
      <View style={styles.header}><Text style={styles.title}>View Note</Text><Pressable accessibilityRole="button" accessibilityLabel="Close note" onPress={onClose}><Ionicons name="close-outline" size={23} color={colors.white} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.body}>{loading ? <Text style={styles.muted}>Loading note…</Text> : <Text selectable style={styles.content}>{note?.content ?? 'Note not found.'}</Text>}</ScrollView>
      <View style={styles.footer}><Pressable accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={styles.closeText}>Close</Text></Pressable></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '82%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' },
  header: { padding: 16, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  body: { padding: 18, minHeight: 180 },
  content: { color: colors.text, fontSize: 14, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  close: { minHeight: 40, borderWidth: 1, borderColor: colors.primary, borderRadius: 7, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.primaryText, fontWeight: '700' },
});
