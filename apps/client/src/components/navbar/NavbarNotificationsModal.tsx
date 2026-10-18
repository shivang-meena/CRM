import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useNotifications, useReadNotification } from '@/hooks/useNotifications';
import { CrmNotification } from '@/types/leadActivities';
import { formatDateTime } from '@/utils/format';
import { colors } from '@/theme/colors';

export default function NavbarNotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const query = useNotifications(page);
  const read = useReadNotification();
  const data = query.data;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));

  useEffect(() => {
    if (visible) setActionError('');
  }, [visible]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function select(notification: CrmNotification) {
    setActionError('');
    try {
      if (!notification.readAt) await read.mutateAsync(notification.id);
      onClose();
      if (notification.leadId?.trim()) router.replace({ pathname: '/lead/[id]', params: { id: notification.leadId } });
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.modal} accessibilityViewIsModal>
      <View style={styles.header}><View style={styles.titleRow}><Ionicons name="notifications-outline" size={18} color={colors.purple} /><Text style={styles.title}>Notifications</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close notifications" onPress={onClose} style={styles.close}><Ionicons name="close-outline" size={22} color={colors.primaryText} /></Pressable></View>
      {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
      {query.isLoading && !data ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading notifications…</Text></View> : query.isError && !data ? <View style={styles.state}><Text style={styles.error}>{errorMessage(query.error)}</Text></View> : <ScrollView contentContainerStyle={styles.list}>
        {!data?.items.length ? <View style={styles.state}><Text style={styles.muted}>No notifications.</Text></View> : data.items.map(notification => <Pressable key={notification.id} accessibilityRole="button" accessibilityLabel={`Open notification ${notification.title}`} onPress={() => { void select(notification); }} style={[styles.item, !notification.readAt && styles.unreadItem]}><View style={[styles.dot, !notification.readAt && styles.unreadDot]} /><View style={styles.itemBody}><Text style={[styles.itemTitle, !notification.readAt && styles.unreadText]}>{notification.title}</Text>{notification.message ? <Text style={styles.message} numberOfLines={2}>{notification.message}</Text> : null}<Text style={styles.time}>{formatDateTime(notification.createdAt)}</Text></View><Ionicons name="chevron-forward-outline" size={15} color={colors.muted} /></Pressable>)}
      </ScrollView>}
      <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityLabel="Previous notifications page" disabled={page <= 1 || query.isFetching} onPress={() => setPage(current => Math.max(1, current - 1))} style={styles.pageButton}><Ionicons name="chevron-back-outline" size={16} color={page <= 1 ? colors.border : colors.muted} /></Pressable><Text style={styles.pageText}>Page {page} of {totalPages}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next notifications page" disabled={page >= totalPages || query.isFetching} onPress={() => setPage(current => Math.min(totalPages, current + 1))} style={styles.pageButton}><Ionicons name="chevron-forward-outline" size={16} color={page >= totalPages ? colors.border : colors.muted} /></Pressable><Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>Close</Text></Pressable></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 54, paddingHorizontal: 12 },
  modal: { width: '100%', maxWidth: 390, maxHeight: '76%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  header: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: colors.text, fontSize: 16, fontWeight: '800' }, close: { padding: 4 },
  list: { padding: 9, gap: 5 },
  item: { minHeight: 62, borderRadius: 7, padding: 9, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, unreadItem: { backgroundColor: colors.primarySoft }, dot: { width: 7, height: 7, marginTop: 5, borderRadius: 4, backgroundColor: colors.border }, unreadDot: { backgroundColor: colors.purple }, itemBody: { flex: 1, gap: 3 }, itemTitle: { color: colors.text, fontSize: 12, fontWeight: '700' }, unreadText: { color: colors.primaryText, fontWeight: '800' }, message: { color: colors.muted, fontSize: 11 }, time: { color: colors.muted, fontSize: 10 },
  state: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }, muted: { color: colors.muted, fontSize: 12 }, error: { color: colors.danger, fontSize: 12, padding: 10 },
  footer: { padding: 10, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }, pageButton: { width: 30, height: 30, borderWidth: 1, borderColor: colors.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, pageText: { color: colors.muted, fontSize: 11, marginHorizontal: 3 }, closeButton: { minHeight: 34, borderWidth: 1, borderColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 5 }, closeText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
});
