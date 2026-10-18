import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import Button from './Button';

type Props = {
  visible: boolean;
  title: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function ActionMenu({ visible, title, onEdit, onDelete, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Button title="Edit" onPress={onEdit} />
          <Button title="Delete" variant="danger" onPress={onDelete} />
          <Button title="Cancel" variant="outline" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 300, backgroundColor: colors.white, borderRadius: 8, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
});
