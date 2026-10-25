import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { Note } from '@/types/note';
import { colors } from '@/theme/colors';
import { useErrorToast } from '@/components/FeedbackToast';

export default function NoteFormModal({ visible, note, onClose, onSave }: {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  useErrorToast(error, 'Note needs attention');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setContent(note?.content ?? '');
      setError('');
    }
  }, [visible, note]);

  async function save() {
    if (!content.trim()) {
      setError('Note content is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(content);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!saving) onClose(); }}>
    <View style={styles.overlay}><View style={styles.modal} accessibilityViewIsModal>
      <View style={styles.header}><Text style={styles.title}>{note ? 'Edit Note' : 'Add Note'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close note form" disabled={saving} onPress={onClose}><Ionicons name="close-outline" size={23} color={colors.primaryText} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Note *</Text>
        <TextInput accessibilityLabel="Note" autoFocus multiline value={content} onChangeText={setContent} editable={!saving} maxLength={10000} placeholder="Write your note..." placeholderTextColor={colors.muted} style={styles.input} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.footer}><Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Save note" disabled={saving} onPress={() => { void save(); }} style={styles.save}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save Note</Text>}</Pressable></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '90%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' },
  header: { padding: 16, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  body: { padding: 16, gap: 8 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800' },
  input: { minHeight: 170, borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 12, color: colors.text, textAlignVertical: 'top', fontSize: 14 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 9, borderRadius: 6, fontSize: 12 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  cancel: { minHeight: 40, borderWidth: 1, borderColor: colors.primary, borderRadius: 7, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.primaryText, fontWeight: '700' },
  save: { minHeight: 40, minWidth: 105, borderRadius: 7, paddingHorizontal: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.white, fontWeight: '700' },
});
