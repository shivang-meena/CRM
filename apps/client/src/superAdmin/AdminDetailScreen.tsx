import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { getAdmin, resetAdminPassword, updateAdmin, updateAdminFeatures, updateAdminStatus } from '@/api/superAdmin';
import { AdminRecord, FEATURE_LIST, FeatureKey } from '@/types/superAdmin';
import { FeatureSwitch } from '@/superAdmin/FeatureSwitch';

export default function AdminDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [info, setInfo] = useState({ businessName: '', name: '', phone: '', email: '' });
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmStatus, setConfirmStatus] = useState(false);

  const query = useQuery({ queryKey: ['super-admin', 'admin', id], queryFn: () => getAdmin(id), enabled: !!id });
  const admin = query.data;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (admin) setInfo({ businessName: admin.businessName, name: admin.name, phone: admin.phone ?? '', email: admin.email ?? '' });
  }, [admin?.id, admin?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyUpdated(updated: AdminRecord) {
    qc.setQueryData(['super-admin', 'admin', id], updated);
    qc.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
  }

  const featureMutation = useMutation({
    mutationFn: (v: { key: FeatureKey; value: boolean }) => updateAdminFeatures(id, { [v.key]: v.value }),
    onSuccess: (u) => { setError(''); applyUpdated(u); },
    onError: (e) => setError(errorMessage(e)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'BLOCKED') => updateAdminStatus(id, status),
    onSuccess: (u) => { setError(''); setConfirmStatus(false); applyUpdated(u); },
    onError: (e) => { setConfirmStatus(false); setError(errorMessage(e)); },
  });

  const infoMutation = useMutation({
    mutationFn: () => updateAdmin(id, {
      name: info.name.trim(),
      businessName: info.businessName.trim(),
      phone: info.phone.trim(),
      ...(info.email.trim() ? { email: info.email.trim() } : {}),
    }),
    onSuccess: (u) => { setError(''); setMessage('Details saved.'); applyUpdated(u); },
    onError: (e) => { setMessage(''); setError(errorMessage(e)); },
  });

  const passwordMutation = useMutation({
    mutationFn: () => resetAdminPassword(id, newPassword),
    onSuccess: () => { setError(''); setNewPassword(''); setMessage('Password changed. Give the new password to the customer.'); },
    onError: (e) => { setMessage(''); setError(errorMessage(e)); },
  });

  if (query.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (query.isError || !admin) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{query.isError ? errorMessage(query.error) : 'Admin not found'}</Text>
        <Button title="Back" variant="outline" onPress={() => router.replace('/super-admin' as any)} />
      </View>
    );
  }

  const blocked = admin.status === 'BLOCKED';

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Button title="← Back" variant="outline" onPress={() => router.replace('/super-admin' as any)} />
          <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
            <Text style={[styles.badgeText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? 'Blocked' : 'Active'}</Text>
          </View>
        </View>

        <Text style={styles.title}>{admin.businessName || admin.name}</Text>
        <Text style={styles.meta}>Login ID: {admin.loginId} · {admin.enabledFeatureCount}/{admin.totalFeatureCount} features enabled</Text>

        {!!message && <Text style={styles.success}>{message}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features (what this Admin can use)</Text>
          <Text style={styles.meta}>Tap a switch to turn a feature ON or OFF. It is saved immediately. If you turn a feature OFF, the Admin and all of their staff lose it right away.</Text>
          <View style={styles.switchGrid}>
            {FEATURE_LIST.map((f) => (
              <FeatureSwitch
                key={f.key}
                label={f.label}
                value={admin.features[f.key]}
                disabled={featureMutation.isPending}
                onChange={(value) => featureMutation.mutate({ key: f.key, value })}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account status</Text>
          <Text style={styles.meta}>{blocked ? 'This Admin and all staff cannot log in.' : 'This Admin and their staff can log in.'}</Text>
          <View style={{ alignSelf: 'flex-start' }}>
            <Button title={blocked ? 'Unblock admin' : 'Block admin'} variant={blocked ? 'primary' : 'danger'} onPress={() => setConfirmStatus(true)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          {(['businessName', 'name', 'phone', 'email'] as const).map((key) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{key === 'businessName' ? 'Business name' : key === 'name' ? 'Contact name' : key === 'phone' ? 'Phone' : 'Email'}</Text>
              <TextInput style={styles.input} value={info[key]} onChangeText={(v) => setInfo((cur) => ({ ...cur, [key]: v }))} autoCapitalize="none" />
            </View>
          ))}
          <View style={{ alignSelf: 'flex-start' }}>
            <Button title="Save details" onPress={() => { setMessage(''); infoMutation.mutate(); }} loading={infoMutation.isPending} disabled={!info.name.trim()} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reset password</Text>
          <View style={styles.field}>
            <Text style={styles.label}>New password (min 8 characters)</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
          </View>
          <View style={{ alignSelf: 'flex-start' }}>
            <Button title="Change password" onPress={() => { setMessage(''); passwordMutation.mutate(); }} loading={passwordMutation.isPending} disabled={newPassword.length < 8} />
          </View>
        </View>
      </ScrollView>

      <Modal visible={confirmStatus} transparent animationType="fade" onRequestClose={() => setConfirmStatus(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.sectionTitle}>{blocked ? 'Unblock admin?' : 'Block admin?'}</Text>
            <Text style={styles.meta}>
              {blocked ? 'They and all their staff will be able to log in again.' : 'They and ALL their staff will be logged out and cannot log in until you unblock.'}
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setConfirmStatus(false)} disabled={statusMutation.isPending} />
              <Button title={blocked ? 'Unblock' : 'Block'} variant={blocked ? 'primary' : 'danger'} loading={statusMutation.isPending} onPress={() => statusMutation.mutate(blocked ? 'ACTIVE' : 'BLOCKED')} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, backgroundColor: colors.canvas },
  content: { padding: 16, gap: 14, width: '100%', maxWidth: 800, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  success: { color: colors.success, fontSize: 13, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13 },
  section: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.white },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: colors.successSoft },
  badgeBlocked: { backgroundColor: colors.dangerSoft },
  badgeText: { fontSize: 12, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 420, backgroundColor: colors.white, borderRadius: 10, padding: 18, gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
