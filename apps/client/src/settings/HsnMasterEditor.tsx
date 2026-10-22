import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { fetchHsnMaster, HSN_MASTER_KEY, INVOICE_HSN_MASTER_KEY, saveHsnMaster } from '@/api/hsnMaster';
import type { HsnMasterEntry } from '@/api/hsnMaster';
import { ProfileField } from './ProfileFields';

type Draft = { id?: string; code: string; description: string; igstRate: string; sgstRate: string; cgstRate: string; isActive: boolean };
const EMPTY: Draft = { code: '', description: '', igstRate: '', sgstRate: '', cgstRate: '', isActive: true };

export default function HsnMasterEditor() {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: HSN_MASTER_KEY, queryFn: fetchHsnMaster });
  const mutation = useMutation({ mutationFn: saveHsnMaster });
  const [form, setForm] = useState<Draft | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function edit(entry?: HsnMasterEntry) {
    setForm(entry ? { ...entry, igstRate: String(entry.igstRate), sgstRate: String(entry.sgstRate), cgstRate: String(entry.cgstRate) } : { ...EMPTY });
    setError('');
    setMessage('');
  }
  function update(key: 'code' | 'description' | 'igstRate' | 'sgstRate' | 'cgstRate', value: string) {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setError('');
  }
  async function save() {
    if (!form || mutation.isPending) return;
    setError('');
    if (!/^\d{4,8}$/.test(form.code.trim())) {
      setError('Enter an HSN/SAC number with 4 to 8 digits.');
      return;
    }
    if (!form.description.trim()) {
      setError('Enter the HSN description.');
      return;
    }
    const rates = [form.igstRate, form.sgstRate, form.cgstRate];
    if (rates.some((rate) => !/^\d+(?:\.\d{1,2})?$/.test(rate) || Number(rate) > 100)) {
      setError('Enter each GST rate between 0 and 100 with up to two decimal places.');
      return;
    }
    if (Math.round(Number(form.igstRate) * 100) !== Math.round((Number(form.sgstRate) + Number(form.cgstRate)) * 100)) {
      setError('IGST must equal SGST + CGST.');
      return;
    }
    try {
      await mutation.mutateAsync({ id: form.id, data: { code: form.code.trim(), description: form.description.trim(), igstRate: Number(form.igstRate), sgstRate: Number(form.sgstRate), cgstRate: Number(form.cgstRate), isActive: form.isActive } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: HSN_MASTER_KEY }),
        queryClient.invalidateQueries({ queryKey: INVOICE_HSN_MASTER_KEY }),
      ]);
      setForm(null);
      setMessage('HSN master entry saved.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const term = search.trim().toLowerCase();
  const rows = (query.data ?? []).filter((row) => `${row.code} ${row.description}`.toLowerCase().includes(term));
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>HSN / SAC Master</Text>
          <Text style={styles.hint}>Add HSN numbers, descriptions and GST rates. Select an HSN in the invoice to apply its rates automatically.</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={mutation.isPending} style={styles.button} onPress={() => edit()}>
          <Text style={styles.buttonText}>Add HSN</Text>
        </Pressable>
      </View>
      {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {form ? (
        <View style={styles.form}>
          <Text style={styles.title}>{form.id ? 'Edit HSN' : 'New HSN'}</Text>
          <View pointerEvents={mutation.isPending ? 'none' : 'auto'} style={styles.formFields}>
            <View style={[styles.row, width < 600 && styles.stack]}>
              <ProfileField label="HSN Number" required value={form.code} onChange={(value) => update('code', value)} maxLength={8} keyboardType="number-pad" />
              <ProfileField label="HSN Description" required value={form.description} onChange={(value) => update('description', value)} maxLength={500} multiline />
            </View>
            <View style={[styles.row, width < 600 && styles.stack]}>
              <ProfileField label="IGST (%)" required value={form.igstRate} onChange={(value) => update('igstRate', value)} maxLength={6} keyboardType="decimal-pad" />
              <ProfileField label="SGST (%)" required value={form.sgstRate} onChange={(value) => update('sgstRate', value)} maxLength={6} keyboardType="decimal-pad" />
              <ProfileField label="CGST (%)" required value={form.cgstRate} onChange={(value) => update('cgstRate', value)} maxLength={6} keyboardType="decimal-pad" />
            </View>
            <Text style={styles.hint}>Invoice GST mode decides which rates apply: IGST, or SGST + CGST. IGST must equal SGST + CGST. Use 0 for a zero-rate entry.</Text>
            <View style={styles.actions}>
              <Switch accessibilityLabel="HSN available for new invoices" value={form.isActive} onValueChange={(isActive) => setForm((current) => current ? { ...current, isActive } : current)} />
              <Text style={styles.hint}>Active for new invoices</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={mutation.isPending} style={styles.button} onPress={() => { void save(); }}>
              <Text style={styles.buttonText}>{mutation.isPending ? 'Saving...' : 'Save HSN'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={mutation.isPending} style={styles.secondary} onPress={() => { setForm(null); setError(''); }}>
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {query.isPending ? <ActivityIndicator color="#0B2F7D" /> : query.isError ? (
        <View style={styles.actions}>
          <Text accessibilityRole="alert" style={styles.error}>{errorMessage(query.error)}</Text>
          <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); }}><Text style={styles.link}>Retry HSN Master</Text></Pressable>
        </View>
      ) : (
        <>
          <ProfileField label="Search HSN number or description" value={search} onChange={setSearch} maxLength={100} />
          {!rows.length ? <Text style={styles.hint}>{query.data?.length ? 'No matching HSN entries.' : 'No HSN entries yet. Add an HSN before creating a GST invoice.'}</Text> : null}
          {rows.map((row) => (
            <View key={row.id} style={styles.entry}>
              <View style={styles.intro}>
                <Text style={styles.title}>{row.code} · {row.isActive ? 'Active' : 'Inactive'}</Text>
                <Text style={styles.description}>{row.description}</Text>
                <Text style={styles.hint}>IGST {row.igstRate}%  |  SGST {row.sgstRate}% + CGST {row.cgstRate}%</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Edit HSN ${row.code}`} disabled={mutation.isPending} onPress={() => edit(row)} style={styles.secondary}>
                <Text style={styles.link}>Edit</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, borderTopWidth: 1, borderColor: '#EEEBF2' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  intro: { flex: 1, minWidth: 180, gap: 5 },
  title: { color: '#0B2F7D', fontSize: 13, fontWeight: '600' },
  hint: { color: '#777079', fontSize: 12, lineHeight: 18 },
  description: { color: '#433B4B', fontSize: 13 },
  button: { backgroundColor: '#0B2F7D', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 17, minHeight: 44, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  secondary: { padding: 12, minHeight: 44, justifyContent: 'center' },
  link: { color: '#0B2F7D', fontWeight: '600', fontSize: 12 },
  form: { padding: 14, backgroundColor: '#F7F9FC', borderRadius: 6, borderWidth: 1, borderColor: '#EEEBF2', gap: 12 },
  formFields: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stack: { flexDirection: 'column' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: '#EEEBF2' },
  error: { color: '#B42318', fontSize: 12 },
  success: { color: '#15803D', fontSize: 12 },
});
