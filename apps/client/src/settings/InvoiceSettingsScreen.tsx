import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { resetGstInvoiceStart } from '@/api/gstInvoiceSettings';
import { fetchInvoiceSettings, resetNonGstInvoiceStart, saveInvoiceSettings } from '@/api/nonGstInvoiceSettings';
import { EMPTY_GST_INVOICE_SETTINGS, gstInvoiceNumber, gstSettingsPayload } from '@/types/gstInvoiceSettings';
import type { GstInvoiceSettingsSnapshot } from '@/types/gstInvoiceSettings';
import { EMPTY_NON_GST_INVOICE_SETTINGS } from '@/types/nonGstInvoiceSettings';
import type { InvoiceSettings, InvoiceSettingsPayload } from '@/types/nonGstInvoiceSettings';
import { INVOICE_GST_SETTINGS_KEY } from '@/hooks/useInvoiceGstSettings';
import { INVOICE_NON_GST_SETTINGS_KEY } from '@/hooks/useInvoiceNonGstSettings';
import ConfirmDialog from '@/components/ConfirmDialog';
import WebSettingsTabs from './WebSettingsTabs';
import GstSignatureUpload from './GstSignatureUpload';
import { ProfileField, fieldStyles } from './ProfileFields';

const KEY = ['settings', 'invoices'] as const;
type Kind = 'gst' | 'nonGst';
type Draft = Omit<GstInvoiceSettingsSnapshot, 'invoiceStart' | 'gstPercentage'> & {
  invoiceStart: string;
  gstPercentage: string;
};
const TITLE = { gst: 'GST Invoice', nonGst: 'Non GST Invoice' } as const;
const QUERY_KEY = {
  gst: INVOICE_GST_SETTINGS_KEY,
  nonGst: INVOICE_NON_GST_SETTINGS_KEY,
};
function draft(settings: NonNullable<InvoiceSettings[Kind]>): Draft {
  return {
    ...settings,
    invoiceStart: String(settings.invoiceStart),
    gstPercentage: 'gstPercentage' in settings ? String(settings.gstPercentage) : '0',
  };
}
function gstPayload(form: Draft) {
  return gstSettingsPayload({
    ...form,
    invoiceStart: Number(form.invoiceStart),
    gstPercentage: Number(form.gstPercentage),
  });
}
function nonGstPayload(form: Draft) {
  const data = gstPayload(form);
  return {
    invoiceCurrency: data.invoiceCurrency,
    hsnSac: data.hsnSac,
    invoicePrefix: data.invoicePrefix,
    invoiceStart: data.invoiceStart,
    bankName: data.bankName,
    accountNo: data.accountNo,
    ifscCode: data.ifscCode,
    paymentUpiId: data.paymentUpiId,
    signature: data.signature,
    termsAndConditions: data.termsAndConditions,
  };
}
function validate(form: Draft, kind: Kind): string {
  const data = gstPayload(form);
  if (!['INR', 'USD', 'EUR'].includes(data.invoiceCurrency)) return 'Choose a valid invoice currency.';
  if (!data.hsnSac || data.hsnSac.length > 20) return 'Enter an HSN/SAC code of up to 20 characters.';
  if (!/^[A-Za-z0-9][A-Za-z0-9_\/-]{0,29}$/.test(data.invoicePrefix))
    return 'Enter an invoice prefix of up to 30 letters, numbers, hyphens, underscores or slashes.';
  if (
    !/^\d+$/.test(form.invoiceStart) ||
    !Number.isInteger(data.invoiceStart) ||
    data.invoiceStart < 1 ||
    data.invoiceStart > 2147483646
  )
    return 'Invoice Start must be a whole number between 1 and 2147483646.';
  if (
    kind === 'gst' &&
    (!/^\d+(?:\.\d{1,2})?$/.test(form.gstPercentage) || data.gstPercentage < 0 || data.gstPercentage > 100)
  )
    return 'GST percentage must be between 0 and 100, with up to two decimal places.';
  if (!/^[A-Za-z0-9 -]{0,40}$/.test(data.accountNo)) return 'Enter a valid account number.';
  if (data.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode)) return 'Enter a valid 11-character IFSC code.';
  if (data.paymentUpiId && !/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(data.paymentUpiId))
    return 'Enter a valid payment UPI ID.';
  return '';
}

export default function InvoiceSettingsScreen() {
  const query = useQuery({
    queryKey: KEY,
    queryFn: fetchInvoiceSettings,
    refetchOnWindowFocus: false,
  });
  if (query.isPending || query.isFetching)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#40348B" />
        <Text style={styles.subtitle}>Loading Invoice Settings...</Text>
      </View>
    );
  if (query.isError)
    return (
      <View style={styles.center}>
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage(query.error)}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => {
            void query.refetch();
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  return <InvoiceSettingsForm initial={query.data} />;
}

function InvoiceSettingsForm({ initial }: { initial: InvoiceSettings }) {
  const { width } = useWindowDimensions();
  const [saved, setSaved] = useState(initial);
  const [forms, setForms] = useState(() => ({
    gst: draft(initial.gst ?? EMPTY_GST_INVOICE_SETTINGS),
    nonGst: draft(initial.nonGst ?? EMPTY_NON_GST_INVOICE_SETTINGS),
  }));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [signatureErrors, setSignatureErrors] = useState({
    gst: '',
    nonGst: '',
  });
  const [uploads, setUploads] = useState({ gst: false, nonGst: false });
  const [resetKind, setResetKind] = useState<Kind | null>(null);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const queryClient = useQueryClient();
  const saveMutation = useMutation({ mutationFn: saveInvoiceSettings });
  const resetMutation = useMutation({
    mutationFn: (kind: Kind) => (kind === 'gst' ? resetGstInvoiceStart() : resetNonGstInvoiceStart()),
  });
  const pending = saveMutation.isPending || resetMutation.isPending;
  const busy = pending || uploads.gst || uploads.nonGst;
  function update(kind: Kind, key: keyof Draft, value: string) {
    if (pending) return;
    setForms((current) => ({
      ...current,
      [kind]: { ...current[kind], [key]: value },
    }));
    setError('');
    setMessage('');
  }
  function updateShared(key: 'invoiceCurrency' | 'hsnSac', value: string) {
    if (pending) return;
    setForms((current) => ({
      gst: { ...current.gst, [key]: value },
      nonGst: { ...current.nonGst, [key]: value },
    }));
    setError('');
    setMessage('');
  }
  async function save() {
    if (busy) return;
    setError('');
    setMessage('');
    for (const kind of ['gst', 'nonGst'] as const) {
      const problem = validate(forms[kind], kind) || signatureErrors[kind];
      if (problem) {
        setError(`${TITLE[kind]}: ${problem}`);
        return;
      }
    }
    const payload: InvoiceSettingsPayload = {
      gst: gstPayload(forms.gst),
      nonGst: nonGstPayload(forms.nonGst),
    };
    try {
      const value = await saveMutation.mutateAsync(payload);
      setSaved(value);
      setForms({ gst: draft(value.gst!), nonGst: draft(value.nonGst!) });
      queryClient.setQueryData(KEY, value);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INVOICE_GST_SETTINGS_KEY }),
        queryClient.invalidateQueries({
          queryKey: INVOICE_NON_GST_SETTINGS_KEY,
        }),
      ]);
      setMessage('Invoice Settings saved successfully.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function openReset(kind: Kind) {
    if (busy || !saved[kind]) return;
    const current = kind === 'gst' ? gstPayload(forms[kind]) : nonGstPayload(forms[kind]);
    const previous = kind === 'gst' ? gstPayload(draft(saved[kind]!)) : nonGstPayload(draft(saved[kind]!));
    if (JSON.stringify(current) !== JSON.stringify(previous)) {
      setError(`Save ${TITLE[kind]} changes before resetting its invoice start.`);
      return;
    }
    setError('');
    setMessage('');
    setResetKind(kind);
  }
  async function reset() {
    if (busy || !resetKind) return;
    const kind = resetKind;
    try {
      const value = await resetMutation.mutateAsync(kind);
      const next = { ...saved, [kind]: value } as InvoiceSettings;
      setSaved(next);
      setForms((current) => ({ ...current, [kind]: draft(value) }));
      queryClient.setQueryData(KEY, next);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY[kind] });
      setMessage(`${TITLE[kind]} start reset successfully.`);
      setResetKind(null);
    } catch (e) {
      setResetKind(null);
      setError(errorMessage(e));
    }
  }
  const resetSettings = resetKind ? saved[resetKind] : null;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <WebSettingsTabs active="invoice" />
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save Invoice Settings"
          disabled={busy}
          onPress={() => {
            void save();
          }}
          style={[styles.button, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <Text style={styles.buttonText}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text accessibilityRole="alert" style={styles.success}>
          {message}
        </Text>
      ) : null}
      {(['gst', 'nonGst'] as const).map((kind) => (
        <InvoiceSettingsSection
          key={kind}
          kind={kind}
          form={forms[kind]}
          saved={saved[kind]}
          busy={busy}
          wide={width >= 1050}
          signatureError={signatureErrors[kind]}
          onChange={(key, value) => update(kind, key, value)}
          onSignatureError={(value) => setSignatureErrors((current) => ({ ...current, [kind]: value }))}
          onUploadBusy={(value) => setUploads((current) => ({ ...current, [kind]: value }))}
          onReset={() => openReset(kind)}
        />
      ))}
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.badge}>
              <Ionicons name="pricetag-outline" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text accessibilityRole="header" style={styles.title}>
                Currency &amp; Tax Code
              </Text>
              <Text style={styles.subtitle}>Set default invoice currency and HSN/SAC code.</Text>
            </View>
          </View>
        </View>
        <View style={[styles.sharedFields, width < 1050 && styles.stack]}>
          <View style={styles.sharedField}>
            <Text style={fieldStyles.label}>Invoice Currency:</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose default invoice currency"
              accessibilityState={{ expanded: currencyDropdownOpen }}
              disabled={busy}
              style={styles.currencySelector}
              onPress={() => setCurrencyDropdownOpen((open) => !open)}
            >
              <Text style={fieldStyles.value}>
                {forms.gst.invoiceCurrency === 'INR'
                  ? '₹ - India'
                  : forms.gst.invoiceCurrency === 'USD'
                    ? '$ - USD'
                    : '€ - EUR'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#777079" />
            </Pressable>
            {currencyDropdownOpen ? (
              <View style={styles.currencyOptions}>
                {[
                  { label: '₹ - India', value: 'INR' },
                  { label: '$ - USD', value: 'USD' },
                  { label: '€ - EUR', value: 'EUR' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => {
                      updateShared('invoiceCurrency', option.value);
                      setCurrencyDropdownOpen(false);
                    }}
                    style={styles.currencyOption}
                  >
                    <Text style={styles.currencyOptionText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.sharedField}>
            <ProfileField
              label="HSN Code:"
              value={forms.gst.hsnSac}
              onChange={(value) => updateShared('hsnSac', value)}
              maxLength={20}
            />
          </View>
        </View>
      </View>
      <ConfirmDialog
        visible={Boolean(resetKind)}
        title={`${resetKind ? TITLE[resetKind] : ''} Start Reset`}
        message={`Set the next invoice number to ${resetSettings ? gstInvoiceNumber(resetSettings.invoicePrefix, resetSettings.invoiceStart) : ''}?`}
        confirmText="Reset"
        loading={resetMutation.isPending}
        onCancel={() => {
          if (!busy) setResetKind(null);
        }}
        onConfirm={() => {
          void reset();
        }}
      />
    </ScrollView>
  );
}

function InvoiceSettingsSection({
  kind,
  form,
  saved,
  busy,
  wide,
  signatureError,
  onChange,
  onSignatureError,
  onUploadBusy,
  onReset,
}: {
  kind: Kind;
  form: Draft;
  saved: InvoiceSettings[Kind];
  busy: boolean;
  wide: boolean;
  signatureError: string;
  onChange: (key: keyof Draft, value: string) => void;
  onSignatureError: (error: string) => void;
  onUploadBusy: (busy: boolean) => void;
  onReset: () => void;
}) {
  const gst = kind === 'gst';
  const fields: Partial<Record<keyof Draft, { label: string; max: number }>> = {
    invoicePrefix: { label: 'Invoice Prefix:', max: 30 },
    invoiceStart: { label: 'Invoice Start:', max: 10 },
    gstPercentage: { label: 'GST percentage:', max: 6 },
    bankName: { label: 'Bank Name:', max: 150 },
    accountNo: { label: 'Account No.:', max: 40 },
    ifscCode: { label: 'IFSC Code:', max: 11 },
    paymentUpiId: {
      label: gst ? 'GST Payment UPI ID:' : 'NON GST Payment UPI ID:',
      max: 150,
    },
  };
  const rows: (keyof Draft | null)[][] = gst
    ? [
        ['invoicePrefix', 'invoiceStart'],
        ['gstPercentage', 'bankName'],
        ['accountNo', 'ifscCode'],
        ['paymentUpiId', null],
      ]
    : [
        ['invoicePrefix', 'invoiceStart'],
        ['bankName', 'accountNo'],
        ['ifscCode', 'paymentUpiId'],
      ];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text accessibilityRole="header" style={styles.title}>
              {TITLE[kind]}
            </Text>
            <Text style={styles.subtitle}>Manage Your {TITLE[kind]} Settings</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reset ${TITLE[kind]} start`}
          disabled={busy || !saved}
          style={[styles.button, (busy || !saved) && styles.disabled]}
          onPress={onReset}
        >
          <Text style={styles.buttonText}>Invoice Start Reset</Text>
        </Pressable>
      </View>
      <View pointerEvents={busy ? 'none' : 'auto'} style={[styles.body, !wide && styles.stack]}>
        <View style={!wide ? { alignSelf: 'center' } : undefined}>
          <GstSignatureUpload
            label={gst ? 'Invoice GST Signature:' : 'Invoice Non-Gst Signature:'}
            value={form.signature}
            onChange={(value) => onChange('signature', value)}
            onError={onSignatureError}
            onBusyChange={onUploadBusy}
            disabled={busy}
          />
          {signatureError ? <Text style={fieldStyles.error}>{signatureError}</Text> : null}
        </View>
        <View style={styles.fields}>
          {rows.map((row, index) => (
            <View key={index} style={[styles.row, !wide && styles.stack]}>
              {row.map((key, cell) =>
                key ? (
                  <ProfileField
                    key={key}
                    label={fields[key]!.label}
                    value={form[key]}
                    onChange={(value) => onChange(key, value)}
                    maxLength={fields[key]!.max}
                    keyboardType={
                      key === 'invoiceStart'
                        ? 'number-pad'
                        : key === 'gstPercentage'
                          ? 'decimal-pad'
                          : key === 'paymentUpiId'
                            ? 'email-address'
                            : 'default'
                    }
                  />
                ) : wide ? (
                  <View key={cell} style={{ flex: 1 }} />
                ) : null,
              )}
            </View>
          ))}
          <ProfileField
            label="Invoice Terms & Conditions:"
            value={form.termsAndConditions}
            onChange={(value) => onChange('termsAndConditions', value)}
            multiline
            maxLength={10000}
          />
          {saved ? (
            <Text style={styles.subtitle}>
              Next {TITLE[kind]}: {gstInvoiceNumber(saved.invoicePrefix, saved.nextNumber)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FCFBFE' },
  content: { padding: 14, paddingBottom: 30, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  toolbar: { alignItems: 'flex-end' },
  button: {
    backgroundColor: '#40348B',
    minHeight: 35,
    borderRadius: 4,
    paddingHorizontal: 17,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#EEEBF2',
    boxShadow: '0 1px 4px rgba(45,29,65,0.04)',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEDF3',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 7,
    backgroundColor: '#963787',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#514059', fontWeight: '600', fontSize: 13 },
  subtitle: { color: '#777079', fontSize: 11, lineHeight: 17 },
  body: {
    padding: 16,
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
  },
  fields: { flex: 1, gap: 16, alignSelf: 'stretch' },
  sharedFields: {
    padding: 16,
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  sharedField: { flex: 1, position: 'relative', zIndex: 2 },
  currencySelector: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: '#DED9E4',
    borderRadius: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  currencyOptions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DED9E4',
    borderRadius: 5,
    boxShadow: '0 2px 6px rgba(45,29,65,0.12)',
  },
  currencyOption: { paddingHorizontal: 12, paddingVertical: 10 },
  currencyOptionText: { color: '#514059', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  stack: { flexDirection: 'column', alignItems: 'stretch' },
  error: { fontSize: 12, color: '#B3261E', lineHeight: 18 },
  success: {
    fontSize: 12,
    color: '#1E7F5C',
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: 4,
  },
});
