import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import Button from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible, title, message, confirmText = 'Delete', loading, onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <View style={styles.row}>
            <Button title="Cancel" variant="outline" onPress={onCancel} />
            <Button title={confirmText} variant="danger" onPress={onConfirm} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: 8, padding: 20, gap: 10 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  msg: { color: colors.muted, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
});
