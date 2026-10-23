// import React, { useState } from 'react';
// import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Href, useRouter } from 'expo-router';
// import { useAuth } from '@/context/AuthContext';
// import { useNotifications } from '@/hooks/useNotifications';
// import { usePermissions } from '@/hooks/usePermissions';
// import { colors } from '@/theme/colors';
// import NavbarNotificationsModal from './navbar/NavbarNotificationsModal';
// import NavbarCreateModals, { CreateAction } from './navbar/NavbarCreateModals';
// import NavbarSearchModal from './navbar/NavbarSearchModal';

// type Shortcut = { label: string; action: CreateAction; icon: React.ComponentProps<typeof Ionicons>['name']; color: string };

// const shortcuts: Shortcut[] = [
//   { label: 'Lead', action: 'lead', icon: 'funnel-outline', color: '#F28A24' },
//   { label: 'Task', action: 'task', icon: 'calendar-outline', color: '#D84B63' },
//   { label: 'Reminder', action: 'reminder', icon: 'alarm-outline', color: '#D84B63' },
//   { label: 'Meeting', action: 'meeting', icon: 'headset-outline', color: '#F28A24' },
//   { label: 'Note', action: 'note', icon: 'bookmark', color: '#D84B63' },
// ];

// export default function AppNavbar() {
//   const router = useRouter();
//   const { userName, role, logout } = useAuth();
//   const { canAccess: hasAccess } = usePermissions();
//   const notifications = useNotifications(1);
//   const [createAction, setCreateAction] = useState<CreateAction | null>(null);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [notificationsOpen, setNotificationsOpen] = useState(false);
//   const [accountOpen, setAccountOpen] = useState(false);
//   const unread = notifications.data?.unread ?? 0;
//   const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';


//   const visibleShortcuts = shortcuts.filter(s => hasAccess(s.action));
//   const showInvoiceShortcut = hasAccess('invoice');

//   function openCreate(action: CreateAction) { setSearchOpen(false); setNotificationsOpen(false); setAccountOpen(false); setCreateAction(action); }

//   function openSearch() {
//     if (createAction) return;
//     setAccountOpen(false);
//     setNotificationsOpen(false);
//     setSearchOpen(true);
//   }

//   function openNotifications() {
//     if (createAction) return;
//     setAccountOpen(false);
//     setSearchOpen(false);
//     setNotificationsOpen(true);
//   }

//   function openAccount() {
//     if (createAction) return;
//     setSearchOpen(false);
//     setNotificationsOpen(false);
//     setAccountOpen(true);
//   }

//   return <>
//     <View style={styles.navbar}>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcuts} style={styles.shortcutScroll}>
//         {visibleShortcuts.map((shortcut) => <React.Fragment key={shortcut.action}><Pressable accessibilityRole="button" accessibilityLabel={`Create ${shortcut.label}`} onPress={() => openCreate(shortcut.action)} style={({ pressed }) => [styles.shortcut, createAction === shortcut.action && styles.activeShortcut, pressed && styles.pressed]}><Ionicons name={shortcut.icon} size={15} color={shortcut.color} /><Text style={styles.shortcutText}>{shortcut.label}</Text></Pressable><View style={styles.divider} /></React.Fragment>)}
//         {showInvoiceShortcut && (
//           <Pressable accessibilityRole="button" accessibilityLabel="Invoices" onPress={() => router.push('/invoice' as Href)} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Ionicons name="receipt-outline" size={15} color="#2BB5F5" /><Text style={styles.shortcutText}>Invoice</Text></Pressable>
//         )}
//       </ScrollView>
//       <View style={styles.utilities}>
//         <Pressable accessibilityRole="button" accessibilityLabel="Document utility not configured" disabled style={styles.utility}><Ionicons name="document-text-outline" size={16} color={colors.purple} /></Pressable>
//         <Pressable accessibilityRole="button" accessibilityLabel="Window utility not configured" disabled style={styles.utility}><Ionicons name="copy-outline" size={16} color="#F28A24" /></Pressable>
//         <Pressable accessibilityRole="button" accessibilityLabel="Search pages" onPress={openSearch} style={styles.utility}><Ionicons name="search-outline" size={17} color={colors.primary} /></Pressable>
//         {hasAccess('reminder') ? <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`} onPress={openNotifications} style={styles.utility}><Ionicons name="notifications-outline" size={18} color={colors.navy} />{unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null}</Pressable> : null}
//         <Pressable accessibilityRole="button" accessibilityLabel="Open account menu" onPress={openAccount} style={styles.account}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><Text style={styles.userName} numberOfLines={1}>{userName || 'Account'}</Text><Ionicons name="chevron-down-outline" size={13} color={colors.muted} /></Pressable>
//       </View>
//     </View>
//     <NavbarSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
//     {hasAccess('reminder') ? <NavbarNotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} /> : null}
//     <NavbarCreateModals action={createAction} onClose={() => setCreateAction(null)} />
//     <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
//       <View style={styles.accountOverlay}><View style={styles.accountMenu} accessibilityViewIsModal><View style={styles.accountHeader}><View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{initials}</Text></View><View style={styles.accountInfo}><Text style={styles.accountName}>{userName || 'Account'}</Text><Text style={styles.accountSession}>{role === 'staff' ? 'Staff Session' : 'Admin Session'}</Text></View></View><Pressable accessibilityRole="button" onPress={async () => { await logout(); setAccountOpen(false); }} style={styles.signOut}><Ionicons name="log-out-outline" size={17} color={colors.danger} /><Text style={styles.signOutText}>Sign Out</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setAccountOpen(false)} style={styles.accountClose}><Text style={styles.accountCloseText}>Close</Text></Pressable></View></View>
//     </Modal>

//   </>;
// }

// const styles = StyleSheet.create({
//   navbar: { minHeight: 48, paddingHorizontal: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.headerBorder, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: '0 1px 4px rgba(14,27,61,0.08)' },
//   shortcutScroll: { flex: 1 }, shortcuts: { alignItems: 'center', gap: 2, paddingVertical: 5 }, shortcut: { minHeight: 34, paddingHorizontal: 9, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, activeShortcut: { backgroundColor: '#F3F4F8' }, pressed: { opacity: 0.7 }, shortcutText: { color: colors.text, fontSize: 11, fontWeight: '600' }, divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
//   utilities: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3 }, utility: { width: 31, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, account: { maxWidth: 165, minHeight: 36, paddingLeft: 4, paddingRight: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }, avatar: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.purple }, avatarText: { color: colors.primaryText, fontSize: 10, fontWeight: '800' }, userName: { flexShrink: 1, color: colors.text, fontSize: 11, fontWeight: '700' }, badge: { position: 'absolute', top: 1, right: 0, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },
//   accountOverlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 52, paddingRight: 10 }, accountMenu: { width: 220, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 12, gap: 9, boxShadow: '0 2px 8px rgba(14,27,61,0.16)' }, accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 5 }, avatarLarge: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, avatarLargeText: { color: colors.primaryText, fontWeight: '800' }, accountInfo: { flex: 1 }, accountName: { color: colors.text, fontSize: 13, fontWeight: '800' }, accountSession: { color: colors.muted, fontSize: 10, marginTop: 2 }, signOut: { minHeight: 38, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, flexDirection: 'row', alignItems: 'center', gap: 7 }, signOutText: { color: colors.danger, fontSize: 12, fontWeight: '700' }, accountClose: { minHeight: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, accountCloseText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
// });


import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import { colors } from '@/theme/colors';
import NavbarNotificationsModal from './navbar/NavbarNotificationsModal';
import NavbarCreateModals, { CreateAction } from './navbar/NavbarCreateModals';
import NavbarSearchModal from './navbar/NavbarSearchModal';

type Shortcut = { label: string; action: CreateAction; icon: React.ComponentProps<typeof Ionicons>['name']; color: string };

const shortcuts: Shortcut[] = [
  { label: 'Lead', action: 'lead', icon: 'funnel-outline', color: '#F28A24' },
  { label: 'Reminder', action: 'reminder', icon: 'alarm-outline', color: '#D84B63' },
  { label: 'Meeting', action: 'meeting', icon: 'headset-outline', color: '#F28A24' },
  { label: 'Note', action: 'note', icon: 'bookmark', color: '#D84B63' },
];

const NAVBAR_HEIGHT = 58;
const MENU_TOP = NAVBAR_HEIGHT + 4; // account menu sits just under the navbar; tune if your layout adds a safe-area inset
const NAME_BREAKPOINT = 520; // below this width the account chip shows only the avatar
const SOFT_HOVER = '#F3F4F8';
const DANGER_SOFT = '#FFF1F0';

// The two disabled placeholder buttons did nothing; flip this to true when they get real actions.
const SHOW_PLACEHOLDER_UTILITIES = false;

// Appends an alpha byte to a 6-digit hex colour so we can tint with the existing brand colours.
const tint = (hex: string, alpha: string) => `${hex}${alpha}`;

export default function AppNavbar() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { userName, role, logout } = useAuth();
  const { canAccess: hasAccess } = usePermissions();
  const notifications = useNotifications(1);
  const [createAction, setCreateAction] = useState<CreateAction | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const unread = notifications.data?.unread ?? 0;
  const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  const showName = width >= NAME_BREAKPOINT;

  const visibleShortcuts = shortcuts.filter(s => hasAccess(s.action));
  const showInvoiceShortcut = hasAccess('invoice');

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
      {/* Quick-create shortcuts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcuts} style={styles.shortcutScroll}>
        {visibleShortcuts.map((shortcut) => {
          const active = createAction === shortcut.action;
          return (
            <Pressable
              key={shortcut.action}
              accessibilityRole="button"
              accessibilityLabel={`Create ${shortcut.label}`}
              onPress={() => openCreate(shortcut.action)}
              style={({ pressed }) => [
                styles.chip,
                active && { backgroundColor: tint(shortcut.color, '14'), borderColor: tint(shortcut.color, '59') },
                pressed && styles.chipPressed,
              ]}
            >
              <View style={[styles.chipIcon, { backgroundColor: tint(shortcut.color, '1F') }]}>
                <Ionicons name={shortcut.icon} size={15} color={shortcut.color} />
              </View>
              <Text style={styles.chipText}>{shortcut.label}</Text>
            </Pressable>
          );
        })}

        {/* Invoice opens a page instead of a create form, so it is set apart by a divider */}
        {showInvoiceShortcut ? (
          <>
            {visibleShortcuts.length > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Invoices"
              onPress={() => router.push('/invoice' as Href)}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <View style={[styles.chipIcon, { backgroundColor: tint('#2BB5F5', '1F') }]}>
                <Ionicons name="receipt-outline" size={15} color="#2BB5F5" />
              </View>
              <Text style={styles.chipText}>Invoice</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {/* Utilities */}
      <View style={styles.utilities}>
        {SHOW_PLACEHOLDER_UTILITIES ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="Document utility not configured" disabled style={styles.utility}><Ionicons name="document-text-outline" size={18} color={colors.purple} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Window utility not configured" disabled style={styles.utility}><Ionicons name="copy-outline" size={18} color="#F28A24" /></Pressable>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search pages"
          onPress={openSearch}
          style={({ pressed }) => [styles.utility, pressed && styles.utilityPressed]}
        >
          <Ionicons name="search-outline" size={19} color={colors.primary} />
        </Pressable>

        {hasAccess('reminder') ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`}
            onPress={openNotifications}
            style={({ pressed }) => [styles.utility, pressed && styles.utilityPressed]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.navy} />
            {unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null}
          </Pressable>
        ) : null}

        <View style={styles.utilityDivider} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account menu"
          accessibilityState={{ expanded: accountOpen }}
          onPress={openAccount}
          style={({ pressed }) => [styles.account, !showName && styles.accountCompact, pressed && styles.utilityPressed]}
        >
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          {showName ? <Text style={styles.userName} numberOfLines={1}>{userName || 'Account'}</Text> : null}
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
      </View>
    </View>

    <NavbarSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    {hasAccess('reminder') ? <NavbarNotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} /> : null}
    <NavbarCreateModals action={createAction} onClose={() => setCreateAction(null)} />

    {/* Account menu */}
    <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
      <View style={styles.accountOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" style={StyleSheet.absoluteFill} onPress={() => setAccountOpen(false)} />
        <View style={styles.accountMenu} accessibilityViewIsModal>
          <View style={styles.accountHeader}>
            <View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{initials}</Text></View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName} numberOfLines={1}>{userName || 'Account'}</Text>
              <View style={styles.sessionPill}>
                <Text style={styles.accountSession}>{role === 'staff' ? 'Staff Session' : 'Admin Session'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            onPress={async () => { await logout(); setAccountOpen(false); }}
            style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
          >
            <View style={styles.signOutIcon}><Ionicons name="log-out-outline" size={17} color={colors.danger} /></View>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => setAccountOpen(false)} style={({ pressed }) => [styles.accountClose, pressed && styles.utilityPressed]}>
            <Text style={styles.accountCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  /* Bar */
  navbar: { height: NAVBAR_HEIGHT, paddingLeft: 12, paddingRight: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.headerBorder, flexDirection: 'row', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(14,27,61,0.08)' },

  /* Shortcuts */
  shortcutScroll: { flex: 1 },
  shortcuts: { alignItems: 'center', gap: 8, paddingRight: 8 },
  chip: { height: 38, paddingLeft: 6, paddingRight: 13, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipPressed: { backgroundColor: SOFT_HOVER },
  chipIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  divider: { width: 1, height: 22, backgroundColor: colors.border, marginHorizontal: 4 },

  /* Utilities */
  utilities: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  utility: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  utilityPressed: { backgroundColor: SOFT_HOVER },
  utilityDivider: { width: 1, height: 22, backgroundColor: colors.border, marginHorizontal: 6 },
  badge: { position: 'absolute', top: 3, right: 2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  /* Account chip */
  account: { maxWidth: 190, height: 42, paddingLeft: 4, paddingRight: 10, borderRadius: 21, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountCompact: { paddingRight: 8, gap: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.purple },
  avatarText: { color: colors.primaryText, fontSize: 11, fontWeight: '800' },
  userName: { flexShrink: 1, color: colors.text, fontSize: 12.5, fontWeight: '700' },

  /* Account menu */
  accountOverlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: MENU_TOP, paddingRight: 10 },
  accountMenu: { width: 248, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, gap: 12, boxShadow: '0 10px 28px rgba(14,27,61,0.18)' },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarLarge: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { color: colors.primaryText, fontSize: 16, fontWeight: '800' },
  accountInfo: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  accountName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  sessionPill: { marginTop: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.primarySoft },
  accountSession: { color: colors.primaryText, fontSize: 10.5, fontWeight: '700' },
  menuDivider: { height: 1, backgroundColor: colors.border },
  signOut: { minHeight: 44, paddingHorizontal: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  signOutPressed: { backgroundColor: DANGER_SOFT },
  signOutIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: DANGER_SOFT, alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  accountClose: { minHeight: 38, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accountCloseText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
});
