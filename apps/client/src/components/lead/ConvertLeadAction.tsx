import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { useConvertLead, useCustomerByLead } from '@/hooks/useCustomers';
import { colors } from '@/theme/colors';

type Props = {
  leadId: string;
  onCustomerOpen?: () => void;
};

export default function ConvertLeadAction({ leadId, onCustomerOpen }: Props) {
  const router = useRouter();
  const lookup = useCustomerByLead(leadId);
  const conversion = useConvertLead(leadId);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);
  const busy = lookup.isFetching || conversion.isPending;

  const label = lookup.isError
    ? 'Retry Customer Check'
    : lookup.data
      ? 'View Customer'
      : lookup.isLoading
        ? 'Checking Customer…'
        : 'Convert to Customer';

  function openCustomer(id: string) {
    onCustomerOpen?.();
    router.push({ pathname: '/customer/[id]', params: { id } } as Href);
  }

  function handlePress() {
    if (busy) return;
    if (lookup.isError) {
      void lookup.refetch();
      return;
    }
    if (lookup.data) {
      openCustomer(lookup.data.id);
      return;
    }
    conversion.reset();
    setNotice('');
    setOpen(true);
  }

  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await conversion.mutateAsync();
      setOpen(false);
      setNotice('Customer ready. Select View Customer to open.');
    } catch {
      // Keep the dialog open. The existing errorMessage helper formats errors.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={handlePress}
        style={({ pressed }) => [styles.button, (busy || pressed) && styles.dimmed]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primaryText} />
        ) : (
          <Ionicons name="person-add-outline" size={16} color={colors.primaryText} />
        )}
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>

      {lookup.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage(lookup.error)}
        </Text>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!submitting.current) setOpen(false); }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Convert to Customer?</Text>
            <Text style={styles.message}>
              This creates a customer linked to this lead. Existing details,
              follow-ups, meetings, history and documents stay connected.
            </Text>
            {conversion.isError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {errorMessage(conversion.error)}
              </Text>
            ) : null}
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                variant="outline"
                disabled={conversion.isPending}
                onPress={() => setOpen(false)}
              />
              {lookup.data ? (
                <Button
                  title="View Customer"
                  onPress={() => {
                    if (!lookup.data) return;
                    setOpen(false);
                    openCustomer(lookup.data.id);
                  }}
                />
              ) : (
                <Button
                  title="Convert to Customer"
                  loading={conversion.isPending}
                  onPress={() => { void confirm(); }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4, maxWidth: '100%' },
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6,
    minHeight: 38, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.primarySoft, alignSelf: 'flex-start',
  },
  buttonText: { fontSize: 13, fontWeight: '700', color: colors.primaryText },
  dimmed: { opacity: 0.6 },
  error: { fontSize: 12, color: colors.danger, maxWidth: 380 },
  notice: { fontSize: 12, color: colors.green, maxWidth: 250 },
  overlay: {
    flex: 1, backgroundColor: colors.overlay, padding: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dialog: {
    width: '100%', maxWidth: 440, backgroundColor: colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 20, gap: 14,
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  message: { fontSize: 14, lineHeight: 22, color: colors.muted },
  dialogActions: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10,
  },
});
