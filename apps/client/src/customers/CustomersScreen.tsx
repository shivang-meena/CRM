import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, useWindowDimensions,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import Stars from '@/components/Stars';
import { useCustomers } from '@/hooks/useCustomers';
import { colors } from '@/theme/colors';
import { Customer } from '@/types/customer';
import { formatDateTime } from '@/utils/format';

const columns = [
  { label: 'No.', width: 52 },
  { label: 'Actions', width: 90 },
  { label: 'Customer Name', width: 200 },
  { label: 'Email', width: 220 },
  { label: 'Phone', width: 140 },
  { label: 'Converted Date', width: 175 },
  { label: 'Converted By', width: 170 },
  { label: 'Rating', width: 110 },
];

function Cell({ width, children }: { width: number; children: React.ReactNode }) {
  return <View style={[styles.cell, { width }]}>{children}</View>;
}

export default function CustomersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const query = useCustomers({ search, page, pageSize });
  const data = query.data;
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  function openCustomer(customer: Customer) {
    router.push({ pathname: '/customer/[id]', params: { id: customer.id } } as Href);
  }

  function applySearch() {
    setPage(1);
    setSearch(draft.trim());
  }

  function name(customer: Customer) {
    return (
      <View style={{ gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open customer ${customer.lead.name}`}
          onPress={() => openCustomer(customer)}
        >
          <Text style={styles.name}>{customer.lead.name}</Text>
        </Pressable>
        {customer.lead.companyName ? (
          <Text style={styles.secondary}>{customer.lead.companyName}</Text>
        ) : null}
        {customer.lead.deletedAt ? (
          <Text style={styles.archived}>Source lead archived</Text>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.pageHeader}>
        <View style={{ gap: 4 }}>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.secondary}>
            Customers converted from leads · {data?.total ?? '—'} matching records
          </Text>
        </View>
        <Button
          title={query.isFetching ? 'Refreshing…' : 'Refresh'}
          variant="outline"
          disabled={query.isFetching}
          onPress={() => { void query.refetch(); }}
        />
      </View>

      <View style={styles.toolbar}>
        <TextInput
          accessibilityLabel="Search customers by name, company, email or phone"
          placeholder="Search name, company, email or phone…"
          placeholderTextColor={colors.muted}
          value={draft}
          maxLength={200}
          onChangeText={setDraft}
          onSubmitEditing={applySearch}
          returnKeyType="search"
          style={styles.search}
        />
        <Button title="Search" onPress={applySearch} />
        {draft || search ? (
          <Button
            title="Clear"
            variant="outline"
            onPress={() => { setDraft(''); setSearch(''); setPage(1); }}
          />
        ) : null}
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.secondary}>Loading customers…</Text>
        </View>
      ) : query.isError ? (
        <View accessibilityRole="alert" style={styles.state}>
          <Text style={styles.error}>{errorMessage(query.error)}</Text>
          <Button title="Retry" variant="outline" onPress={() => { void query.refetch(); }} />
        </View>
      ) : !data?.items.length ? (
        <View style={styles.state}>
          <Text style={styles.emptyTitle}>{search ? 'No matching customers' : 'No customers yet'}</Text>
          <Text style={styles.secondary}>
            {search ? 'Try another name, email or phone number.' : 'Open a lead and select Convert to Customer.'}
          </Text>
        </View>
      ) : width >= 1000 ? (
        <View style={styles.tableFrame}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeader}>
                {columns.map(column => (
                  <Cell key={column.label} width={column.width}>
                    <Text style={styles.heading}>{column.label}</Text>
                  </Cell>
                ))}
              </View>
              {data.items.map((customer, index) => (
                <View key={customer.id} style={[styles.row, index % 2 === 1 && styles.alternate]}>
                  <Cell width={52}><Text style={styles.value}>{(page - 1) * pageSize + index + 1}</Text></Cell>
                  <Cell width={90}>
                    <Pressable accessibilityRole="button" onPress={() => openCustomer(customer)}>
                      <Text style={styles.name}>View</Text>
                    </Pressable>
                  </Cell>
                  <Cell width={200}>{name(customer)}</Cell>
                  <Cell width={220}><Text selectable style={styles.value}>{customer.lead.email || '—'}</Text></Cell>
                  <Cell width={140}><Text selectable style={styles.value}>{customer.lead.phone || '—'}</Text></Cell>
                  <Cell width={175}><Text style={styles.value}>{formatDateTime(customer.convertedAt)} IST</Text></Cell>
                  <Cell width={170}><Text style={styles.value}>{customer.convertedByName}</Text></Cell>
                  <Cell width={110}><Stars value={customer.lead.rating} size={15} /></Cell>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.cards}>
          {data.items.map(customer => (
            <View key={customer.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>{name(customer)}</View>
                <Button title="View" variant="outline" onPress={() => openCustomer(customer)} />
              </View>
              <Text selectable style={styles.value}>Email: {customer.lead.email || '—'}</Text>
              <Text selectable style={styles.value}>Phone: {customer.lead.phone || '—'}</Text>
              <Text style={styles.secondary}>Converted: {formatDateTime(customer.convertedAt)} IST</Text>
              <Text style={styles.secondary}>Converted by: {customer.convertedByName}</Text>
              <Stars value={customer.lead.rating} size={16} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.sizes}>
          <Text style={styles.secondary}>Rows per page:</Text>
          {[10, 20, 50].map(size => (
            <Pressable
              key={size}
              accessibilityRole="button"
              accessibilityLabel={`${size} rows per page`}
              accessibilityState={{ selected: pageSize === size }}
              onPress={() => { setPageSize(size); setPage(1); }}
              style={[styles.sizeButton, pageSize === size && styles.selectedSize]}
            >
              <Text style={styles.value}>{size}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sizes}>
          <Button title="Previous" variant="outline" disabled={page <= 1 || query.isFetching} onPress={() => setPage(p => p - 1)} />
          <Text style={styles.secondary}>Page {page} of {pageCount}</Text>
          <Button title="Next" variant="outline" disabled={page >= pageCount || query.isFetching || query.isError} onPress={() => setPage(p => p + 1)} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  pageHeader: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  secondary: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  search: {
    flexGrow: 1, flexShrink: 1, minWidth: 180, minHeight: 42,
    backgroundColor: colors.white, color: colors.text, fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
  },
  tableFrame: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.navy },
  heading: { color: colors.white, fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  alternate: { backgroundColor: colors.primarySoft },
  cell: { paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'center', flexShrink: 0 },
  value: { color: colors.text, fontSize: 13, lineHeight: 20 },
  name: { color: colors.accent, fontWeight: '700', fontSize: 13, lineHeight: 20 },
  archived: { color: colors.muted, fontSize: 11 },
  state: {
    padding: 30, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14 },
  cards: { gap: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 16, gap: 8, backgroundColor: colors.white },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  sizeButton: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
  selectedSize: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
