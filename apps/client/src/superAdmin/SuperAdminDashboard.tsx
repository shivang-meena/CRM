import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import { createAdmin, listAdmins, updateAdminStatus } from '@/api/superAdmin';
import { ALL_FEATURES_ON, AdminRecord, FEATURE_LIST, FeatureMap } from '@/types/superAdmin';
import { FeatureSwitch } from '@/superAdmin/FeatureSwitch';

const EMPTY_FORM = { businessName: '', name: '', loginId: '', password: '', phone: '', email: '' };

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
  const [notice, setNotice] = useState('');
  const [statusTarget, setStatusTarget] = useState<AdminRecord | null>(null);

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
  const field = (key: keyof typeof EMPTY_FORM, label: string, opts: { secure?: boolean; keyboard?: 'default' | 'email-address' | 'phone-pad' } = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        secureTextEntry={opts.secure}
        keyboardType={opts.keyboard ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Super Admin</Text>
            <Text style={styles.subtitle}>Signed in as {userName || 'Super Admin'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { void logout(); }} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.counters}>
          <View style={styles.counter}><Text style={styles.counterValue}>{data?.summary.totalCount ?? '-'}</Text><Text style={styles.counterLabel}>Total admins</Text></View>
          <View style={styles.counter}><Text style={[styles.counterValue, { color: colors.success }]}>{data?.summary.activeCount ?? '-'}</Text><Text style={styles.counterLabel}>Active</Text></View>
          <View style={styles.counter}><Text style={[styles.counterValue, { color: colors.danger }]}>{data?.summary.blockedCount ?? '-'}</Text><Text style={styles.counterLabel}>Blocked</Text></View>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            style={[styles.input, { flex: 1, minWidth: 180 }]}
            placeholder="Search by business, name or login ID"
            placeholderTextColor={colors.muted}
            value={draftSearch}
            onChangeText={setDraftSearch}
            onSubmitEditing={() => setSearch(draftSearch.trim())}
            autoCapitalize="none"
          />
          <Button title="Search" variant="outline" onPress={() => setSearch(draftSearch.trim())} />
          <Button title="+ New Admin" onPress={openCreate} />
        </View>

        {!!notice && (
          <Pressable onPress={() => setNotice('')} style={styles.notice}>
            <Text style={styles.noticeText}>{notice} (tap to dismiss)</Text>
          </Pressable>
        )}

        {listQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {listQuery.isError ? <Text style={styles.error}>{errorMessage(listQuery.error)}</Text> : null}
        {data && data.items.length === 0 ? <Text style={styles.empty}>{'No admins yet. Click "+ New Admin".'}</Text> : null}

        {data?.items.map((a) => {
          const blocked = a.status === 'BLOCKED';
          return (
            <View key={a.id} style={styles.card}>
              <View style={{ flex: 1, gap: 4, minWidth: 200 }}>
                <Text style={styles.cardTitle}>{a.businessName || a.name}</Text>
                <Text style={styles.cardMeta}>{a.name} · login: {a.loginId}</Text>
                <Text style={styles.cardMeta}>{a.enabledFeatureCount}/{a.totalFeatureCount} features enabled</Text>
              </View>
              <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
                <Text style={[styles.badgeText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? 'Blocked' : 'Active'}</Text>
              </View>
              <View style={styles.cardActions}>
                <Button title="Open" variant="outline" onPress={() => router.push(`/super-admin/${a.id}` as any)} />
                <Button title={blocked ? 'Unblock' : 'Block'} variant={blocked ? 'primary' : 'danger'} onPress={() => setStatusTarget(a)} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Admin</Text>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {field('businessName', 'Business name')}
              {field('name', 'Contact name *')}
              {field('loginId', 'Login ID * (letters, numbers, . _ -)')}
              {field('password', 'Password * (min 8 characters)', { secure: true })}
              {field('phone', 'Phone', { keyboard: 'phone-pad' })}
              {field('email', 'Email', { keyboard: 'email-address' })}
              <Text style={styles.label}>Features this Admin can use</Text>
              <View style={styles.switchGrid}>
                {FEATURE_LIST.map((f) => (
                  <FeatureSwitch key={f.key} label={f.label} value={features[f.key]} onChange={(v) => setFeatures((cur) => ({ ...cur, [f.key]: v }))} />
                ))}
              </View>
              {!!formError && <Text style={styles.error}>{formError}</Text>}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setCreateOpen(false)} disabled={createMutation.isPending} />
              <Button title="Create Admin" onPress={submitCreate} loading={createMutation.isPending} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!statusTarget} transparent animationType="fade" onRequestClose={() => setStatusTarget(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { maxWidth: 420 }]}>
            <Text style={styles.modalTitle}>{statusTarget?.status === 'BLOCKED' ? 'Unblock admin?' : 'Block admin?'}</Text>
            <Text style={styles.cardMeta}>
              {statusTarget?.status === 'BLOCKED'
                ? `${statusTarget?.businessName || statusTarget?.name} and all of their staff will be able to log in again.`
                : `${statusTarget?.businessName || statusTarget?.name} and ALL of their staff will be logged out and cannot log in until you unblock.`}
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setStatusTarget(null)} disabled={statusMutation.isPending} />
              <Button
                title={statusTarget?.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                variant={statusTarget?.status === 'BLOCKED' ? 'primary' : 'danger'}
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, gap: 14, width: '100%', maxWidth: 960, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
  signOut: { borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  signOutText: { color: colors.danger, fontWeight: '700' },
  counters: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  counter: { flexGrow: 1, flexBasis: 140, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 },
  counterValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  counterLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  toolbar: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  notice: { backgroundColor: colors.successSoft, borderRadius: 8, padding: 12 },
  noticeText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  error: { color: colors.danger, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted },
  cardActions: { flexDirection: 'row', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: colors.successSoft },
  badgeBlocked: { backgroundColor: colors.dangerSoft },
  badgeText: { fontSize: 12, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 10, padding: 18, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.white },
  switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
