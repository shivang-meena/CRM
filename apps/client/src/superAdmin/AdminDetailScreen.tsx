import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { changeAdminLoginId, getAdmin, resetAdminPassword, updateAdmin, updateAdminFeatures, updateAdminStatus } from '@/api/superAdmin';
import { AdminRecord, FEATURE_LIST, FeatureKey } from '@/types/superAdmin';
import { FeatureSwitch } from '@/superAdmin/FeatureSwitch';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  secure?: boolean;
  maxLength?: number;
  editable?: boolean;
  accessibilityLabel?: string;
  autoCorrect?: boolean;
  style?: object;
};

function Field({ label, value, onChangeText, hint, secure, maxLength, editable = true, accessibilityLabel, autoCorrect, style }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, !editable && styles.inputWrapDisabled]}>
        <TextInput
          accessibilityLabel={accessibilityLabel}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          editable={editable}
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

export default function AdminDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [info, setInfo] = useState({ businessName: '', name: '', phone: '', email: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newLoginId, setNewLoginId] = useState('');
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

  const loginIdMutation = useMutation({
    mutationFn: () => changeAdminLoginId(id, newLoginId.trim().toLowerCase()),
    onSuccess: (updated) => {
      setError('');
      setNewLoginId('');
      setMessage(`Login ID changed to "${updated.loginId}". Share the new Login ID with the customer.`);
      applyUpdated(updated);
    },
    onError: (e) => { setMessage(''); setError(errorMessage(e)); },
  });

  if (query.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (query.isError || !admin) {
    return (
      <View style={styles.center}>
        <View style={styles.centerIcon}>
          <Text style={styles.centerIconText}>!</Text>
        </View>
        <Text style={styles.centerError}>{query.isError ? errorMessage(query.error) : 'Admin not found'}</Text>
        <Button title="Back" variant="outline" onPress={() => router.replace('/super-admin' as any)} />
      </View>
    );
  }

  const blocked = admin.status === 'BLOCKED';
  const displayName = admin.businessName || admin.name;
  const total = admin.totalFeatureCount || 0;
  const pct = total > 0 ? Math.min(100, Math.round((admin.enabledFeatureCount / total) * 100)) : 0;
  const setInfoField = (key: keyof typeof info) => (v: string) => setInfo((cur) => ({ ...cur, [key]: v }));

  return (
    <View style={styles.page}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <Button title="← Back" variant="outline" onPress={() => router.replace('/super-admin' as any)} />
          <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
            <View style={[styles.dot, { backgroundColor: blocked ? colors.danger : colors.success }]} />
            <Text style={[styles.badgeText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? 'Blocked' : 'Active'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: blocked ? colors.muted : colors.primary }]}>
              <Text style={styles.avatarText}>{displayName.trim().charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={2}>{displayName}</Text>
              <Text style={styles.meta} numberOfLines={1}>Login ID: {admin.loginId}</Text>
            </View>
          </View>
          <View style={styles.progressBlock}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Features enabled</Text>
              <Text style={styles.progressValue}>{admin.enabledFeatureCount}/{admin.totalFeatureCount}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: blocked ? colors.muted : colors.primary }]} />
            </View>
          </View>
        </View>

        {!!message && (
          <View style={styles.notice}>
            <View style={styles.noticeBar} />
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Features (what this Admin can use)</Text>
            <Text style={styles.meta}>Tap a switch to turn a feature ON or OFF. It is saved immediately. If you turn a feature OFF, the Admin and all of their staff lose it right away.</Text>
          </View>
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

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Details</Text>
          </View>
          <View style={styles.row}>
            <Field style={styles.half} label="Business name" value={info.businessName} onChangeText={setInfoField('businessName')} />
            <Field style={styles.half} label="Contact name" value={info.name} onChangeText={setInfoField('name')} />
          </View>
          <View style={styles.row}>
            <Field style={styles.half} label="Phone" value={info.phone} onChangeText={setInfoField('phone')} />
            <Field style={styles.half} label="Email" value={info.email} onChangeText={setInfoField('email')} />
          </View>
          <View style={styles.sectionFooter}>
            <Button title="Save details" onPress={() => { setMessage(''); infoMutation.mutate(); }} loading={infoMutation.isPending} disabled={!info.name.trim()} />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Change Login ID</Text>
          </View>
          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>Current Login ID</Text>
            <Text style={styles.currentValue}>{admin.loginId}</Text>
          </View>
          <Field
            accessibilityLabel="New Login ID"
            label="New Login ID"
            hint="3-50 characters. Use letters, numbers, dot (.), underscore (_) or hyphen (-)."
            value={newLoginId}
            onChangeText={setNewLoginId}
            autoCorrect={false}
            maxLength={50}
            editable={!loginIdMutation.isPending}
          />
          <View style={styles.sectionFooter}>
            <Button
              title="Change Login ID"
              onPress={() => { setMessage(''); setError(''); loginIdMutation.mutate(); }}
              loading={loginIdMutation.isPending}
              disabled={!/^[a-zA-Z0-9._-]{3,50}$/.test(newLoginId.trim()) || newLoginId.trim().toLowerCase() === admin.loginId}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Reset password</Text>
          </View>
          <Field label="New password" hint="Minimum 8 characters" secure value={newPassword} onChangeText={setNewPassword} />
          <View style={styles.sectionFooter}>
            <Button title="Change password" onPress={() => { setMessage(''); passwordMutation.mutate(); }} loading={passwordMutation.isPending} disabled={newPassword.length < 8} />
          </View>
        </View>

        {/* Account status */}
        <View style={[styles.section, styles.statusSection, { borderColor: blocked ? colors.danger : colors.border }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: blocked ? colors.dangerSoft : colors.successSoft }]}>
              <Text style={[styles.statusIconText, { color: blocked ? colors.danger : colors.success }]}>{blocked ? '!' : '✓'}</Text>
            </View>
            <View style={{ flex: 1, gap: 2, minWidth: 180 }}>
              <Text style={styles.sectionTitle}>Account status</Text>
              <Text style={styles.meta}>{blocked ? 'This Admin and all staff cannot log in.' : 'This Admin and their staff can log in.'}</Text>
            </View>
            <Button title={blocked ? 'Unblock admin' : 'Block admin'} variant={blocked ? 'primary' : 'danger'} onPress={() => setConfirmStatus(true)} />
          </View>
        </View>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmStatus} transparent animationType="fade" onRequestClose={() => setConfirmStatus(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={[styles.confirmIcon, { backgroundColor: blocked ? colors.successSoft : colors.dangerSoft }]}>
              <Text style={[styles.confirmIconText, { color: blocked ? colors.success : colors.danger }]}>{blocked ? '✓' : '!'}</Text>
            </View>
            <Text style={styles.confirmTitle}>{blocked ? 'Unblock admin?' : 'Block admin?'}</Text>
            <Text style={styles.confirmText}>
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

const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, backgroundColor: colors.canvas },
  centerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  centerIconText: { color: colors.danger, fontSize: 22, fontWeight: '800' },
  centerError: { color: colors.danger, fontSize: 14, fontWeight: '600', textAlign: 'center' },

  // Top bar
  topBar: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, width: '100%', maxWidth: 800, alignSelf: 'center' },

  content: { padding: 16, gap: 16, width: '100%', maxWidth: 800, alignSelf: 'center', paddingBottom: 40 },

  // Hero
  hero: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },

  progressBlock: { gap: 6 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  progressValue: { fontSize: 12, color: colors.text, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeActive: { backgroundColor: colors.successSoft },
  badgeBlocked: { backgroundColor: colors.dangerSoft },
  badgeText: { fontSize: 12, fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Banners
  notice: { flexDirection: 'row', backgroundColor: colors.successSoft, borderRadius: 12, overflow: 'hidden' },
  noticeBar: { width: 4, backgroundColor: colors.success },
  noticeText: { flex: 1, color: colors.success, fontSize: 13, fontWeight: '600', padding: 12 },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 12 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  // Sections
  section: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 14 },
  sectionHead: { gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Form
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { flexGrow: 1, flexBasis: 220 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.muted },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.white },
  inputWrapFocused: { borderColor: colors.primary },
  inputWrapDisabled: { backgroundColor: colors.canvas },
  input: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 15, color: colors.text, ...noOutline },
  toggleText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  currentBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  currentLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  currentValue: { fontSize: 14, color: colors.text, fontWeight: '800', flexShrink: 1 },

  // Status
  statusSection: { borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statusIconText: { fontSize: 18, fontWeight: '800' },

  // Modal
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 420, backgroundColor: colors.white, borderRadius: 16, padding: 22, alignItems: 'center', gap: 10 },
  confirmIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  confirmIconText: { fontSize: 24, fontWeight: '800' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  confirmText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 },
});