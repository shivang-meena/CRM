import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import {
  fetchProductMaster,
  saveProductMaster,
  PRODUCT_MASTER_KEY,
  ProductMasterEntry,
} from '@/api/productMaster';
import { INVOICE_HSN_MASTER_KEY } from '@/api/hsnMaster';
import Button from '@/components/Button';
import { ProfileField } from './ProfileFields';

type Draft = {
  id?: string;
  name: string;
  hsnSac: string;
  description: string;
  igstRate: string;
  sgstRate: string;
  cgstRate: string;
  isActive: boolean;
};

const EMPTY: Draft = {
  name: '',
  hsnSac: '',
  description: '',
  igstRate: '18',
  sgstRate: '9',
  cgstRate: '9',
  isActive: true,
};

export default function ProductMasterEditor() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: PRODUCT_MASTER_KEY, queryFn: fetchProductMaster });
  const mutation = useMutation({ mutationFn: saveProductMaster });

  const [form, setForm] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string>();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function reset() {
    setEditingId(undefined);
    setForm(EMPTY);
    setError('');
  }

  function edit(row: ProductMasterEntry) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      name: row.name,
      hsnSac: row.hsnSac || '',
      description: row.description || '',
      igstRate: String(row.igstRate ?? 0),
      sgstRate: String(row.sgstRate ?? 0),
      cgstRate: String(row.cgstRate ?? 0),
      isActive: row.isActive,
    });
    setError('');
    setMessage('');
  }

  function handleRateChange(field: 'igst' | 'sgst' | 'cgst', val: string) {
    const clean = val.replace(/[^0-9.]/g, '');
    if (field === 'igst') {
      const num = parseFloat(clean) || 0;
      const half = (num / 2).toString();
      setForm((prev) => ({
        ...prev,
        igstRate: clean,
        sgstRate: clean ? half : '',
        cgstRate: clean ? half : '',
      }));
    } else if (field === 'cgst') {
      const c = parseFloat(clean) || 0;
      const s = parseFloat(form.sgstRate) || 0;
      setForm((prev) => ({
        ...prev,
        cgstRate: clean,
        igstRate: (c + s).toString(),
      }));
    } else {
      const s = parseFloat(clean) || 0;
      const c = parseFloat(form.cgstRate) || 0;
      setForm((prev) => ({
        ...prev,
        sgstRate: clean,
        igstRate: (c + s).toString(),
      }));
    }
  }

  async function save() {
    if (mutation.isPending) return;
    setError('');
    setMessage('');

    const name = form.name.trim().replace(/\s+/g, ' ');
    if (!name) {
      setError('Product name is required.');
      return;
    }

    const hsn = form.hsnSac.trim();
    if (hsn && !/^\d{4,8}$/.test(hsn)) {
      setError('HSN/SAC number must contain 4 to 8 digits.');
      return;
    }

    const igst = Number(form.igstRate) || 0;
    const sgst = Number(form.sgstRate) || 0;
    const cgst = Number(form.cgstRate) || 0;

    if (igst < 0 || igst > 100 || sgst < 0 || sgst > 100 || cgst < 0 || cgst > 100) {
      setError('GST rates must be between 0 and 100%.');
      return;
    }

    if (Math.round(igst * 100) !== Math.round((sgst + cgst) * 100)) {
      setError('IGST rate must equal SGST rate + CGST rate.');
      return;
    }

    try {
      await mutation.mutateAsync({
        id: editingId,
        name,
        hsnSac: hsn,
        description: form.description.trim(),
        igstRate: igst,
        sgstRate: sgst,
        cgstRate: cgst,
        isActive: form.isActive,
      });

      reset();
      setMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
      await queryClient.invalidateQueries({ queryKey: PRODUCT_MASTER_KEY });
      await queryClient.invalidateQueries({ queryKey: INVOICE_HSN_MASTER_KEY });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const filtered = (query.data || []).filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.hsnSac || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Product HSN
        </Text>
        <Text style={styles.hint}>
          Manage products with their HSN/SAC codes and GST rates (CGST, SGST, IGST).
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionHeader}>{editingId ? 'Edit Product' : 'Add New Product'}</Text>

        <View pointerEvents={mutation.isPending ? 'none' : 'auto'} style={styles.form}>
          <ProfileField
            label="Product Name"
            required
            value={form.name}
            onChange={(val) => setForm((p) => ({ ...p, name: val }))}
            maxLength={150}
            placeholder="e.g. Laptop"
          />

          <View style={[styles.rowGrid, wide && styles.rowGridWide]}>
            <View style={styles.col}>
              <ProfileField
                label="HSN / SAC Code"
                value={form.hsnSac}
                onChange={(val) => setForm((p) => ({ ...p, hsnSac: val }))}
                maxLength={8}
                placeholder="4-8 digits (e.g. 9983)"
              />
            </View>

            <View style={styles.col}>
              <ProfileField
                label="Description"
                value={form.description}
                onChange={(val) => setForm((p) => ({ ...p, description: val }))}
                maxLength={200}
                placeholder="Optional description"
              />
            </View>
          </View>

          <View style={styles.ratesSection}>
            <Text style={styles.ratesTitle}>GST Rates (%)</Text>
            <View style={styles.ratesRow}>
              <View style={styles.rateField}>
                <Text style={styles.rateLabel}>CGST %</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.cgstRate}
                  onChangeText={(v) => handleRateChange('cgst', v)}
                  keyboardType="numeric"
                  placeholder="9"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.rateField}>
                <Text style={styles.rateLabel}>SGST %</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.sgstRate}
                  onChangeText={(v) => handleRateChange('sgst', v)}
                  keyboardType="numeric"
                  placeholder="9"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.rateField}>
                <Text style={styles.rateLabel}>IGST % (Total)</Text>
                <TextInput
                  style={[styles.rateInput, styles.rateInputBold]}
                  value={form.igstRate}
                  onChangeText={(v) => handleRateChange('igst', v)}
                  keyboardType="numeric"
                  placeholder="18"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <Text style={styles.rateHelper}>
              Intra-state (same state) uses CGST + SGST. Inter-state uses IGST.
            </Text>
          </View>

          <View style={styles.activeRow}>
            <Text style={styles.text}>Active Product</Text>
            <Switch
              accessibilityLabel="Product active"
              value={form.isActive}
              onValueChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
            />
          </View>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}

        <View style={styles.btnRow}>
          <Button
            title={editingId ? 'Save Product' : 'Add Product'}
            onPress={() => { void save(); }}
            loading={mutation.isPending}
          />
          {editingId ? (
            <Button title="Cancel Edit" variant="outline" onPress={reset} disabled={mutation.isPending} />
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.listHeader}>
          <Text style={styles.sectionHeader}>Saved Products ({filtered.length})</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search product or HSN..."
            placeholderTextColor="#888"
          />
        </View>

        {query.isPending ? <ActivityIndicator color="#1D5FD6" /> : null}
        {query.isError ? (
          <View style={styles.form}>
            <Text accessibilityRole="alert" style={styles.error}>{errorMessage(query.error)}</Text>
            <Button title="Retry Products" variant="outline" onPress={() => { void query.refetch(); }} />
          </View>
        ) : null}

        {query.isSuccess && !filtered.length ? (
          <Text style={styles.hint}>
            {search ? 'No products match your search.' : 'No products added yet. Add your first product above.'}
          </Text>
        ) : null}

        {filtered.map((row) => (
          <View key={row.id} style={styles.entry}>
            <View style={styles.entryText}>
              <View style={styles.nameRow}>
                <Text style={styles.entryName}>{row.name}</Text>
                {Boolean(row.hsnSac) && (
                  <View style={styles.hsnBadge}>
                    <Text style={styles.hsnBadgeText}>HSN: {row.hsnSac}</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, row.isActive ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, row.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              {Boolean(row.description) && (
                <Text style={styles.descriptionText}>{row.description}</Text>
              )}

              <Text style={styles.taxSummaryText}>
                CGST: {row.cgstRate ?? 0}% | SGST: {row.sgstRate ?? 0}% | IGST: {row.igstRate ?? 0}%
              </Text>
            </View>

            <Button title="Edit" variant="outline" onPress={() => edit(row)} disabled={mutation.isPending} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 7, borderWidth: 1, borderColor: '#EEEBF2', backgroundColor: '#FFFFFF' },
  heading: { padding: 15, gap: 4, borderBottomWidth: 1, borderBottomColor: '#EFEDF3' },
  title: { fontSize: 13, fontWeight: '600', color: '#514059' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#514059', marginBottom: 4 },
  hint: { fontSize: 12, color: '#777079', lineHeight: 18 },
  text: { fontSize: 14, color: '#514059' },
  body: { padding: 16, gap: 14 },
  form: { gap: 12 },
  rowGrid: { gap: 12 },
  rowGridWide: { flexDirection: 'row' },
  col: { flex: 1 },
  ratesSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  ratesTitle: { fontSize: 12, fontWeight: '700', color: '#334155' },
  ratesRow: { flexDirection: 'row', gap: 12 },
  rateField: { flex: 1, gap: 4 },
  rateLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  rateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
  },
  rateInputBold: { fontWeight: '700', borderColor: '#94A3B8' },
  rateHelper: { fontSize: 11, color: '#64748B', fontStyle: 'italic' },
  activeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#EFEDF3', marginVertical: 8 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchInput: {
    minWidth: 180,
    maxWidth: 260,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
  },
  entry: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEDF3',
  },
  entryText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  entryName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  hsnBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hsnBadgeText: { fontSize: 11, color: '#1D4ED8', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextActive: { color: '#15803D' },
  statusTextInactive: { color: '#64748B' },
  descriptionText: { fontSize: 12, color: '#64748B' },
  taxSummaryText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  error: { fontSize: 13, color: '#B42318' },
  success: { fontSize: 13, color: '#16784B' },
});
