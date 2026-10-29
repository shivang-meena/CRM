import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { updateCustomerSelections, fetchCustomerServices, fetchCustomerProducts, CUSTOMER_SERVICES_KEY, CUSTOMER_PRODUCTS_KEY } from '@/api/customers';
import { Customer } from '@/types/customer';
import { useModuleQuery } from '@/hooks/useModuleQuery';
import { colors } from '@/theme/colors';
import Button from '@/components/Button';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';

export default function CustomerSelectionsModal({ customer, visible, onClose, onSaved }: { customer: Customer; visible: boolean; onClose: () => void; onSaved: (row: Customer) => void }) {
  const qc = useQueryClient();
  const services = useModuleQuery('customer', { queryKey: CUSTOMER_SERVICES_KEY, queryFn: fetchCustomerServices, enabled: visible });
  const products = useModuleQuery('customer', { queryKey: CUSTOMER_PRODUCTS_KEY, queryFn: fetchCustomerProducts, enabled: visible });
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: (payload: { version: number; serviceIds: string[]; productIds: string[] }) => updateCustomerSelections(customer.id, payload) });
  React.useEffect(() => {
    if (visible) {
      setServiceIds(customer.lead.serviceIds ?? (customer.lead.serviceId ? [customer.lead.serviceId] : []));
      setProductIds(customer.lead.productIds ?? []);
      setError('');
    }
  }, [visible, customer]);
  async function save() {
    setError('');
    try {
      const updated = await mutation.mutateAsync({ version: customer.lead.version, serviceIds, productIds });
      qc.setQueryData(['customer', updated.id], updated);
      qc.setQueryData(['customer-by-lead', updated.leadId], updated);
      await Promise.all(['customers', 'customer', 'customer-by-lead', 'lead', 'leads', 'lead-history'].map(key => qc.invalidateQueries({ queryKey: [key] })));
      onSaved(updated);
      onClose();
    } catch (e) { setError(errorMessage(e)); }
  }
  const busy = mutation.isPending;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.box}>
      <View style={styles.header}><Text style={styles.title}>Edit Services & Products</Text></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <SearchableMultiSelect label="Service" options={[...(services.data ?? []), ...(customer.lead.services ?? []).filter(item => !(services.data ?? []).some(row => row.id === item.id))]} selectedIds={serviceIds} onChange={setServiceIds} disabled={busy} loading={services.isLoading} error={services.isError ? errorMessage(services.error) : undefined} onRetry={() => { void services.refetch(); }} />
        <SearchableMultiSelect label="Product" options={[...(products.data ?? []), ...(customer.lead.products ?? []).filter(item => !(products.data ?? []).some(row => row.id === item.id))]} selectedIds={productIds} onChange={setProductIds} disabled={busy} loading={products.isLoading} error={products.isError ? errorMessage(products.error) : undefined} onRetry={() => { void products.refetch(); }} />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </ScrollView>
      <View style={styles.footer}><Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} /><Button title="Save" onPress={save} loading={busy} /></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(16,24,40,.45)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  box: { width: '100%', maxWidth: 620, maxHeight: '85%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' },
  header: { backgroundColor: colors.navy, padding: 16 }, title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  body: { padding: 16, gap: 18 }, footer: { padding: 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }, error: { color: colors.danger, fontSize: 13 },
});
