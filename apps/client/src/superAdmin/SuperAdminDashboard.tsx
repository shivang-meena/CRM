// import React, { useState } from 'react';
// import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { colors } from '@/theme/colors';
// import { errorMessage } from '@/api/client';
// import { useAuth } from '@/context/AuthContext';
// import Button from '@/components/Button';
// import { useErrorToast } from '@/components/FeedbackToast';
// import { createAdmin, listAdmins, updateAdminStatus } from '@/api/superAdmin';
// import { ALL_FEATURES_ON, AdminRecord, FEATURE_LIST, FeatureMap } from '@/types/superAdmin';
// import { FeatureSwitch } from '@/superAdmin/FeatureSwitch';

// const EMPTY_FORM = { businessName: '', name: '', loginId: '', password: '', phone: '', email: '' };

// export default function SuperAdminDashboard() {
//   const router = useRouter();
//   const qc = useQueryClient();
//   const { userName, logout } = useAuth();
//   const [draftSearch, setDraftSearch] = useState('');
//   const [search, setSearch] = useState('');
//   const [createOpen, setCreateOpen] = useState(false);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [features, setFeatures] = useState<FeatureMap>(ALL_FEATURES_ON);
//   const [formError, setFormError] = useState('');
//   useErrorToast(formError, 'Account details need attention');
//   const [notice, setNotice] = useState('');
//   const [statusTarget, setStatusTarget] = useState<AdminRecord | null>(null);

//   const listQuery = useQuery({
//     queryKey: ['super-admin', 'admins', search],
//     queryFn: () => listAdmins(search || undefined),
//   });

//   const createMutation = useMutation({
//     mutationFn: createAdmin,
//     onSuccess: (created) => {
//       qc.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
//       setCreateOpen(false);
//       setForm(EMPTY_FORM);
//       setFeatures(ALL_FEATURES_ON);
//       setNotice(`Admin "${created.loginId}" created. Share the Login ID and password with your customer.`);
//     },
//     onError: (e) => setFormError(errorMessage(e)),
//   });

//   const statusMutation = useMutation({
//     mutationFn: (v: { id: string; status: 'ACTIVE' | 'BLOCKED' }) => updateAdminStatus(v.id, v.status),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
//       setStatusTarget(null);
//     },
//     onError: (e) => {
//       setStatusTarget(null);
//       setNotice(errorMessage(e));
//     },
//   });

//   function openCreate() {
//     setForm(EMPTY_FORM);
//     setFeatures(ALL_FEATURES_ON);
//     setFormError('');
//     setCreateOpen(true);
//   }

//   function submitCreate() {
//     setFormError('');
//     if (!form.name.trim() || !form.loginId.trim() || !form.password) {
//       setFormError('Contact name, Login ID and Password are required.');
//       return;
//     }
//     if (form.password.length < 8) {
//       setFormError('Password must be at least 8 characters.');
//       return;
//     }
//     createMutation.mutate({
//       loginId: form.loginId.trim(),
//       password: form.password,
//       name: form.name.trim(),
//       ...(form.businessName.trim() ? { businessName: form.businessName.trim() } : {}),
//       ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
//       ...(form.email.trim() ? { email: form.email.trim() } : {}),
//       features,
//     });
//   }

//   const data = listQuery.data;
//   const field = (key: keyof typeof EMPTY_FORM, label: string, opts: { secure?: boolean; keyboard?: 'default' | 'email-address' | 'phone-pad' } = {}) => (
//     <View style={styles.field}>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput
//         style={styles.input}
//         value={form[key]}
//         onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
//         secureTextEntry={opts.secure}
//         keyboardType={opts.keyboard ?? 'default'}
//         autoCapitalize="none"
//         autoCorrect={false}
//       />
//     </View>
//   );

//   return (
//     <View style={styles.page}>
//       <ScrollView contentContainerStyle={styles.content}>
//         <View style={styles.header}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.title}>Super Admin</Text>
//             <Text style={styles.subtitle}>Signed in as {userName || 'Super Admin'}</Text>
//           </View>
//           <Pressable accessibilityRole="button" onPress={() => { void logout(); }} style={styles.signOut}>
//             <Text style={styles.signOutText}>Sign out</Text>
//           </Pressable>
//         </View>

//         <View style={styles.counters}>
//           <View style={styles.counter}><Text style={styles.counterValue}>{data?.summary.totalCount ?? '-'}</Text><Text style={styles.counterLabel}>Total admins</Text></View>
//           <View style={styles.counter}><Text style={[styles.counterValue, { color: colors.success }]}>{data?.summary.activeCount ?? '-'}</Text><Text style={styles.counterLabel}>Active</Text></View>
//           <View style={styles.counter}><Text style={[styles.counterValue, { color: colors.danger }]}>{data?.summary.blockedCount ?? '-'}</Text><Text style={styles.counterLabel}>Blocked</Text></View>
//         </View>

//         <View style={styles.toolbar}>
//           <TextInput
//             style={[styles.input, { flex: 1, minWidth: 180 }]}
//             placeholder="Search by business, name or login ID"
//             placeholderTextColor={colors.muted}
//             value={draftSearch}
//             onChangeText={setDraftSearch}
//             onSubmitEditing={() => setSearch(draftSearch.trim())}
//             autoCapitalize="none"
//           />
//           <Button title="Search" variant="outline" onPress={() => setSearch(draftSearch.trim())} />
//           <Button title="+ New Admin" onPress={openCreate} />
//         </View>

//         {!!notice && (
//           <Pressable onPress={() => setNotice('')} style={styles.notice}>
//             <Text style={styles.noticeText}>{notice} (tap to dismiss)</Text>
//           </Pressable>
//         )}

//         {listQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
//         {listQuery.isError ? <Text style={styles.error}>{errorMessage(listQuery.error)}</Text> : null}
//         {data && data.items.length === 0 ? <Text style={styles.empty}>{'No admins yet. Click "+ New Admin".'}</Text> : null}

//         {data?.items.map((a) => {
//           const blocked = a.status === 'BLOCKED';
//           return (
//             <View key={a.id} style={styles.card}>
//               <View style={{ flex: 1, gap: 4, minWidth: 200 }}>
//                 <Text style={styles.cardTitle}>{a.businessName || a.name}</Text>
//                 <Text style={styles.cardMeta}>{a.name} · login: {a.loginId}</Text>
//                 <Text style={styles.cardMeta}>{a.enabledFeatureCount}/{a.totalFeatureCount} features enabled</Text>
//               </View>
//               <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
//                 <Text style={[styles.badgeText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? 'Blocked' : 'Active'}</Text>
//               </View>
//               <View style={styles.cardActions}>
//                 <Button title="Open" variant="outline" onPress={() => router.push(`/super-admin/${a.id}` as any)} />
//                 <Button title={blocked ? 'Unblock' : 'Block'} variant={blocked ? 'primary' : 'danger'} onPress={() => setStatusTarget(a)} />
//               </View>
//             </View>
//           );
//         })}
//       </ScrollView>

//       <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
//         <View style={styles.overlay}>
//           <View style={styles.modal}>
//             <Text style={styles.modalTitle}>New Admin</Text>
//             <ScrollView contentContainerStyle={{ gap: 12 }}>
//               {field('businessName', 'Business name')}
//               {field('name', 'Contact name *')}
//               {field('loginId', 'Login ID * (letters, numbers, . _ -)')}
//               {field('password', 'Password * (min 8 characters)', { secure: true })}
//               {field('phone', 'Phone', { keyboard: 'phone-pad' })}
//               {field('email', 'Email', { keyboard: 'email-address' })}
//               <Text style={styles.label}>Features this Admin can use</Text>
//               <View style={styles.switchGrid}>
//                 {FEATURE_LIST.map((f) => (
//                   <FeatureSwitch key={f.key} label={f.label} value={features[f.key]} onChange={(v) => setFeatures((cur) => ({ ...cur, [f.key]: v }))} />
//                 ))}
//               </View>
//               {!!formError && <Text style={styles.error}>{formError}</Text>}
//             </ScrollView>
//             <View style={styles.modalActions}>
//               <Button title="Cancel" variant="outline" onPress={() => setCreateOpen(false)} disabled={createMutation.isPending} />
//               <Button title="Create Admin" onPress={submitCreate} loading={createMutation.isPending} />
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <Modal visible={!!statusTarget} transparent animationType="fade" onRequestClose={() => setStatusTarget(null)}>
//         <View style={styles.overlay}>
//           <View style={[styles.modal, { maxWidth: 420 }]}>
//             <Text style={styles.modalTitle}>{statusTarget?.status === 'BLOCKED' ? 'Unblock admin?' : 'Block admin?'}</Text>
//             <Text style={styles.cardMeta}>
//               {statusTarget?.status === 'BLOCKED'
//                 ? `${statusTarget?.businessName || statusTarget?.name} and all of their staff will be able to log in again.`
//                 : `${statusTarget?.businessName || statusTarget?.name} and ALL of their staff will be logged out and cannot log in until you unblock.`}
//             </Text>
//             <View style={styles.modalActions}>
//               <Button title="Cancel" variant="outline" onPress={() => setStatusTarget(null)} disabled={statusMutation.isPending} />
//               <Button
//                 title={statusTarget?.status === 'BLOCKED' ? 'Unblock' : 'Block'}
//                 variant={statusTarget?.status === 'BLOCKED' ? 'primary' : 'danger'}
//                 loading={statusMutation.isPending}
//                 onPress={() => statusTarget && statusMutation.mutate({ id: statusTarget.id, status: statusTarget.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })}
//               />
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: colors.canvas },
//   content: { padding: 16, gap: 14, width: '100%', maxWidth: 960, alignSelf: 'center' },
//   header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   title: { fontSize: 24, fontWeight: '800', color: colors.text },
//   subtitle: { fontSize: 13, color: colors.muted },
//   signOut: { borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
//   signOutText: { color: colors.danger, fontWeight: '700' },
//   counters: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
//   counter: { flexGrow: 1, flexBasis: 140, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 },
//   counterValue: { fontSize: 26, fontWeight: '800', color: colors.text },
//   counterLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
//   toolbar: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
//   notice: { backgroundColor: colors.successSoft, borderRadius: 8, padding: 12 },
//   noticeText: { color: colors.success, fontSize: 13, fontWeight: '600' },
//   empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
//   error: { color: colors.danger, fontSize: 13 },
//   card: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 },
//   cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
//   cardMeta: { fontSize: 13, color: colors.muted },
//   cardActions: { flexDirection: 'row', gap: 8 },
//   badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
//   badgeActive: { backgroundColor: colors.successSoft },
//   badgeBlocked: { backgroundColor: colors.dangerSoft },
//   badgeText: { fontSize: 12, fontWeight: '800' },
//   overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
//   modal: { width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 10, padding: 18, gap: 12 },
//   modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
//   modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
//   field: { gap: 6 },
//   label: { fontSize: 13, fontWeight: '700', color: colors.text },
//   input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.white },
//   switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
// });


import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import { useErrorToast } from '@/components/FeedbackToast';
import { createAdmin, listAdmins, updateAdminStatus } from '@/api/superAdmin';
import { ALL_FEATURES_ON, AdminRecord, FEATURE_LIST, FeatureMap } from '@/types/superAdmin';
import { FeatureSwitch } from '@/superAdmin/FeatureSwitch';

const EMPTY_FORM = { businessName: '', name: '', loginId: '', password: '', phone: '', email: '' };

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  hint?: string;
  secure?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad';
  style?: object;
};

function Field({ label, value, onChangeText, required, hint, secure, keyboard = 'default', style }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          keyboardType={keyboard}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure ? (
          <Pressable accessibilityRole="button" onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { userName, logout } = useAuth();
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [features, setFeatures] = useState<FeatureMap>(ALL_FEATURES_ON);
  const [formError, setFormError] = useState('');
  useErrorToast(formError, 'Account details need attention');
  const [notice, setNotice] = useState('');
  const [statusTarget, setStatusTarget] = useState<AdminRecord | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const listQuery = useQuery({
    queryKey: ['super-admin', 'admins', search],
    queryFn: () => listAdmins(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFeatures(ALL_FEATURES_ON);
      setNotice(`Admin "${created.loginId}" created. Share the Login ID and password with your customer.`);
    },
    onError: (e) => setFormError(errorMessage(e)),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: 'ACTIVE' | 'BLOCKED' }) => updateAdminStatus(v.id, v.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
      setStatusTarget(null);
    },
    onError: (e) => {
      setStatusTarget(null);
      setNotice(errorMessage(e));
    },
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setFeatures(ALL_FEATURES_ON);
    setFormError('');
    setCreateOpen(true);
  }

  function submitCreate() {
    setFormError('');
    if (!form.name.trim() || !form.loginId.trim() || !form.password) {
      setFormError('Contact name, Login ID and Password are required.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    createMutation.mutate({
      loginId: form.loginId.trim(),
      password: form.password,
      name: form.name.trim(),
      ...(form.businessName.trim() ? { businessName: form.businessName.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      features,
    });
  }

  const data = listQuery.data;
  const setField = (key: keyof typeof EMPTY_FORM) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const adminInitial = (userName || 'S').trim().charAt(0).toUpperCase();
  const isUnblocking = statusTarget?.status === 'BLOCKED';

  return (
    <View style={styles.page}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <View style={styles.topAvatar}>
            <Text style={styles.topAvatarText}>{adminInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Super Admin</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Signed in as {userName || 'Super Admin'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { void logout(); }} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats strip */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data?.summary.totalCount ?? '-'}</Text>
            <Text style={styles.statLabel}>Total admins</Text>
          </View>
          <View style={[styles.stat, styles.statDivider]}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.success }]}>{data?.summary.activeCount ?? '-'}</Text>
          </View>
          <View style={[styles.stat, styles.statDivider]}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.danger }]}>{data?.summary.blockedCount ?? '-'}</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Admin accounts</Text>
            <Text style={styles.sectionSub}>Create, manage and block your customers' admin logins.</Text>
          </View>
          <Button title="+ New Admin" onPress={openCreate} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by business, name or login ID"
              placeholderTextColor={colors.muted}
              value={draftSearch}
              onChangeText={setDraftSearch}
              onSubmitEditing={() => setSearch(draftSearch.trim())}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoCapitalize="none"
            />
          </View>
          <Button title="Search" variant="outline" onPress={() => setSearch(draftSearch.trim())} />
        </View>

        {!!notice && (
          <Pressable onPress={() => setNotice('')} style={styles.notice}>
            <View style={styles.noticeBar} />
            <Text style={styles.noticeText}>{notice} (tap to dismiss)</Text>
          </Pressable>
        )}

        {listQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {listQuery.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{errorMessage(listQuery.error)}</Text>
          </View>
        ) : null}

        {data && data.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>No admins yet</Text>
            <Text style={styles.empty}>{'No admins yet. Click "+ New Admin".'}</Text>
          </View>
        ) : null}

        {/* Admin list */}
        {data?.items.map((a) => {
          const blocked = a.status === 'BLOCKED';
          const total = a.totalFeatureCount || 0;
          const pct = total > 0 ? Math.min(100, Math.round((a.enabledFeatureCount / total) * 100)) : 0;
          const displayName = a.businessName || a.name;
          return (
            <View key={a.id} style={[styles.card, blocked && styles.cardBlocked]}>
              <View style={[styles.cardAccent, { backgroundColor: blocked ? colors.danger : colors.success }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: blocked ? colors.muted : colors.primary }]}>
                    <Text style={styles.avatarText}>{displayName.trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{displayName}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>{a.name}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>login: {a.loginId}</Text>
                  </View>
                  <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
                    <View style={[styles.dot, { backgroundColor: blocked ? colors.danger : colors.success }]} />
                    <Text style={[styles.badgeText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? 'Blocked' : 'Active'}</Text>
                  </View>
                </View>

                <View style={styles.progressBlock}>
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>Features enabled</Text>
                    <Text style={styles.progressValue}>{a.enabledFeatureCount}/{a.totalFeatureCount}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: blocked ? colors.muted : colors.primary }]} />
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Button title="Open" variant="outline" onPress={() => router.push(`/super-admin/${a.id}` as any)} />
                  <Button title={blocked ? 'Unblock' : 'Block'} variant={blocked ? 'primary' : 'danger'} onPress={() => setStatusTarget(a)} />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Create admin modal */}
      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>New Admin</Text>
                <Text style={styles.modalSub}>Set up a login for your customer and choose what they can use.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
                style={styles.closeBtn}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>Business</Text>
                <Field label="Business name" value={form.businessName} onChangeText={setField('businessName')} />
                <Field label="Contact name" required value={form.name} onChangeText={setField('name')} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>Login details</Text>
                <Field
                  label="Login ID"
                  required
                  hint="Letters, numbers, . _ -"
                  value={form.loginId}
                  onChangeText={setField('loginId')}
                />
                <Field
                  label="Password"
                  required
                  hint="Minimum 8 characters"
                  secure
                  value={form.password}
                  onChangeText={setField('password')}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>Contact</Text>
                <View style={styles.row}>
                  <Field style={styles.half} label="Phone" keyboard="phone-pad" value={form.phone} onChangeText={setField('phone')} />
                  <Field style={styles.half} label="Email" keyboard="email-address" value={form.email} onChangeText={setField('email')} />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>Features this Admin can use</Text>
                <View style={styles.switchGrid}>
                  {FEATURE_LIST.map((f) => (
                    <FeatureSwitch key={f.key} label={f.label} value={features[f.key]} onChange={(v) => setFeatures((cur) => ({ ...cur, [f.key]: v }))} />
                  ))}
                </View>
              </View>

              {!!formError && (
                <View style={styles.errorBox}>
                  <Text style={styles.error}>{formError}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" onPress={() => setCreateOpen(false)} disabled={createMutation.isPending} />
              <Button title="Create Admin" onPress={submitCreate} loading={createMutation.isPending} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Block / Unblock confirm modal */}
      <Modal visible={!!statusTarget} transparent animationType="fade" onRequestClose={() => setStatusTarget(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, styles.confirmModal]}>
            <View style={[styles.confirmIcon, { backgroundColor: isUnblocking ? colors.successSoft : colors.dangerSoft }]}>
              <Text style={[styles.confirmIconText, { color: isUnblocking ? colors.success : colors.danger }]}>{isUnblocking ? '✓' : '!'}</Text>
            </View>
            <Text style={styles.confirmTitle}>{isUnblocking ? 'Unblock admin?' : 'Block admin?'}</Text>
            <Text style={styles.confirmText}>
              {isUnblocking
                ? `${statusTarget?.businessName || statusTarget?.name} and all of their staff will be able to log in again.`
                : `${statusTarget?.businessName || statusTarget?.name} and ALL of their staff will be logged out and cannot log in until you unblock.`}
            </Text>
            <View style={styles.confirmActions}>
              <Button title="Cancel" variant="outline" onPress={() => setStatusTarget(null)} disabled={statusMutation.isPending} />
              <Button
                title={isUnblocking ? 'Unblock' : 'Block'}
                variant={isUnblocking ? 'primary' : 'danger'}
                loading={statusMutation.isPending}
                onPress={() => statusTarget && statusMutation.mutate({ id: statusTarget.id, status: statusTarget.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },

  // Top bar
  topBar: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBarInner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, width: '100%', maxWidth: 960, alignSelf: 'center' },
  topAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  topAvatarText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
  signOut: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  signOutText: { color: colors.danger, fontWeight: '700', fontSize: 13 },

  content: { padding: 16, gap: 16, width: '100%', maxWidth: 960, alignSelf: 'center', paddingBottom: 40 },

  // Stats
  stats: { flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
  stat: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Section header + search
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: { flex: 1, minWidth: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14 },
  searchBoxFocused: { borderColor: colors.primary },
  searchInput: { paddingVertical: 11, fontSize: 15, color: colors.text, ...noOutline },

  // Notice / states
  notice: { flexDirection: 'row', backgroundColor: colors.successSoft, borderRadius: 12, overflow: 'hidden' },
  noticeBar: { width: 4, backgroundColor: colors.success },
  noticeText: { flex: 1, color: colors.success, fontSize: 13, fontWeight: '600', padding: 12 },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 12 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  emptyBox: { alignItems: 'center', gap: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 36, paddingHorizontal: 20 },
  emptyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIconText: { fontSize: 22, color: colors.muted, fontWeight: '700' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 13 },

  // Admin card
  card: { flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
  cardBlocked: { backgroundColor: colors.canvas },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 14, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeActive: { backgroundColor: colors.successSoft },
  badgeBlocked: { backgroundColor: colors.dangerSoft },
  badgeText: { fontSize: 12, fontWeight: '800' },
  progressBlock: { gap: 6 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  progressValue: { fontSize: 12, color: colors.text, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },

  // Modals
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 13, color: colors.muted, fontWeight: '700' },
  modalBody: { padding: 18, gap: 16 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },

  formSection: { gap: 12, backgroundColor: colors.canvas, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { flexGrow: 1, flexBasis: 200 },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  required: { color: colors.danger },
  hint: { fontSize: 12, color: colors.muted },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.white },
  inputWrapFocused: { borderColor: colors.primary },
  fieldInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 15, color: colors.text, ...noOutline },
  toggleText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Confirm modal
  confirmModal: { maxWidth: 420, padding: 22, alignItems: 'center', gap: 10 },
  confirmIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  confirmIconText: { fontSize: 24, fontWeight: '800' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  confirmText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  confirmActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 },
});