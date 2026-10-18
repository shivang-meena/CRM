import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/theme/colors';
import NavbarNotificationsModal from './navbar/NavbarNotificationsModal';
import NavbarCreateModals, { CreateAction } from './navbar/NavbarCreateModals';
import NavbarSearchModal from './navbar/NavbarSearchModal';

type Shortcut = { label: string; action: CreateAction; icon: React.ComponentProps<typeof Ionicons>['name']; color: string };

const shortcuts: Shortcut[] = [
  { label: 'Lead', action: 'lead', icon: 'funnel-outline', color: '#F28A24' },
  { label: 'Task', action: 'task', icon: 'calendar-outline', color: '#D84B63' },
  { label: 'Reminder', action: 'reminder', icon: 'alarm-outline', color: '#D84B63' },
  { label: 'Meeting', action: 'meeting', icon: 'headset-outline', color: '#F28A24' },
  { label: 'Note', action: 'note', icon: 'bookmark', color: '#D84B63' },
];

export default function AppNavbar() {
  const router = useRouter();
  const { userName, logout } = useAuth();
  const notifications = useNotifications(1);
  const [createAction, setCreateAction] = useState<CreateAction | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const unread = notifications.data?.unread ?? 0;
  const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

  function openCreate(action: CreateAction) { setSearchOpen(false); setNotificationsOpen(false); setAccountOpen(false); setCreateAction(action); }

  function openSearch() {
    if (createAction) return;
    setAccountOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(true);
  }

  function openNotifications() {
    if (createAction) return;
    setAccountOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(true);
  }

  function openAccount() {
    if (createAction) return;
    setSearchOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(true);
  }

  return <>
    <View style={styles.navbar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcuts} style={styles.shortcutScroll}>
        {shortcuts.map((shortcut, index) => <React.Fragment key={shortcut.action}><Pressable accessibilityRole="button" accessibilityLabel={`Create ${shortcut.label}`} onPress={() => openCreate(shortcut.action)} style={({ pressed }) => [styles.shortcut, createAction === shortcut.action && styles.activeShortcut, pressed && styles.pressed]}><Ionicons name={shortcut.icon} size={15} color={shortcut.color} /><Text style={styles.shortcutText}>{shortcut.label}</Text></Pressable><View style={styles.divider} /></React.Fragment>)}
        <Pressable accessibilityRole="button" accessibilityLabel="Invoices" onPress={() => router.push('/invoice' as Href)} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Ionicons name="receipt-outline" size={15} color="#2BB5F5" /><Text style={styles.shortcutText}>Invoice</Text></Pressable>
      </ScrollView>
      <View style={styles.utilities}>
        <Pressable accessibilityRole="button" accessibilityLabel="Document utility not configured" disabled style={styles.utility}><Ionicons name="document-text-outline" size={16} color={colors.purple} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Window utility not configured" disabled style={styles.utility}><Ionicons name="copy-outline" size={16} color="#F28A24" /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Search pages" onPress={openSearch} style={styles.utility}><Ionicons name="search-outline" size={17} color="#D33F9C" /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`} onPress={openNotifications} style={styles.utility}><Ionicons name="notifications-outline" size={18} color="#9D87D8" />{unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null}</Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open account menu" onPress={openAccount} style={styles.account}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><Text style={styles.userName} numberOfLines={1}>{userName || 'Account'}</Text><Ionicons name="chevron-down-outline" size={13} color={colors.muted} /></Pressable>
      </View>
    </View>
    <NavbarSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    <NavbarNotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    <NavbarCreateModals action={createAction} onClose={() => setCreateAction(null)} />
    <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
      <View style={styles.accountOverlay}><View style={styles.accountMenu} accessibilityViewIsModal><View style={styles.accountHeader}><View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{initials}</Text></View><View style={styles.accountInfo}><Text style={styles.accountName}>{userName || 'Account'}</Text><Text style={styles.accountSession}>Signed in</Text></View></View><Pressable accessibilityRole="button" onPress={async () => { await logout(); setAccountOpen(false); }} style={styles.signOut}><Ionicons name="log-out-outline" size={17} color={colors.danger} /><Text style={styles.signOutText}>Sign Out</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setAccountOpen(false)} style={styles.accountClose}><Text style={styles.accountCloseText}>Close</Text></Pressable></View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  navbar: { minHeight: 48, paddingHorizontal: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.headerBorder, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px rgba(14,27,61,0.08)' },
  shortcutScroll: { flex: 1 }, shortcuts: { alignItems: 'center', gap: 2, paddingVertical: 5 }, shortcut: { minHeight: 34, paddingHorizontal: 9, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, activeShortcut: { backgroundColor: '#F3F4F8' }, pressed: { opacity: 0.7 }, shortcutText: { color: colors.text, fontSize: 11, fontWeight: '600' }, divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
  utilities: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3 }, utility: { width: 31, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, account: { maxWidth: 165, minHeight: 36, paddingLeft: 4, paddingRight: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }, avatar: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.purple }, avatarText: { color: colors.primaryText, fontSize: 10, fontWeight: '800' }, userName: { flexShrink: 1, color: colors.text, fontSize: 11, fontWeight: '700' }, badge: { position: 'absolute', top: 1, right: 0, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, backgroundColor: '#D33F9C', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },
  accountOverlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 52, paddingRight: 10 }, accountMenu: { width: 220, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 12, gap: 9, boxShadow: '0 2px 8px rgba(14,27,61,0.16)' }, accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 5 }, avatarLarge: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, avatarLargeText: { color: colors.primaryText, fontWeight: '800' }, accountInfo: { flex: 1 }, accountName: { color: colors.text, fontSize: 13, fontWeight: '800' }, accountSession: { color: colors.muted, fontSize: 10, marginTop: 2 }, signOut: { minHeight: 38, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, flexDirection: 'row', alignItems: 'center', gap: 7 }, signOutText: { color: colors.danger, fontSize: 12, fontWeight: '700' }, accountClose: { minHeight: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, accountCloseText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
});
