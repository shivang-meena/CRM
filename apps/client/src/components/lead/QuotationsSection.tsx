import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { useDocuments } from '@/hooks/useSalesDocuments';
import { ListFilters, SectionSummary } from '@/types/leadActivities';
import { SalesDocument } from '@/types/salesDocuments';
import { formatMoney } from '@/utils/format';
import { colors } from '@/theme/colors';
import { Choices, Pager, ui } from './FormControls';
import DocumentDetailsModal from './DocumentDetailsModal';

type Props = {
  leadId: string;
  summary?: SectionSummary;
  onCreateInvoiceFromQuote?: (invoice: SalesDocument) => void;
};

const STATUS_FILTERS = ['', 'DRAFT', 'FINALIZED', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

export default function QuotationsSection({
  leadId,
  summary,
  onCreateInvoiceFromQuote,
}: Props) {
  const [filters, setFilters] = useState<ListFilters>({ page: 1, pageSize: 20 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<SalesDocument | null>(null);

  const query = useDocuments(leadId, 'quotations', filters);

  function applyFilter(next: Partial<ListFilters>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }));
  }

  return (
    <View style={styles.container}>
      <View style={ui.panel}>
        <View style={ui.row}>
          <TextInput
            accessibilityLabel="Search quotations"
            placeholder="Search quotation number or notes..."
            value={searchText}
            onChangeText={setSearchText}
            style={[ui.input, { flex: 1, minWidth: 160 }]}
            placeholderTextColor={colors.muted}
          />
          <Button
            title="Search"
            variant="outline"
            onPress={() => applyFilter({ search: searchText.trim() || undefined })}
          />
          <Button
            title="Clear"
            variant="outline"
            onPress={() => {
              setSearchText('');
              setStatus('');
              setFilters({ page: 1, pageSize: 20 });
            }}
          />
        </View>

        <Choices
          label="Filter by Status"
          value={status}
          options={STATUS_FILTERS}
          onChange={(s) => {
            setStatus(s);
            applyFilter({ status: s || undefined });
          }}
        />
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : query.isError ? (
        <View accessibilityRole="alert" style={ui.panel}>
          <Text style={ui.error}>{errorMessage(query.error)}</Text>
          <Button title="Retry" variant="outline" onPress={() => { void query.refetch(); }} />
        </View>
      ) : !query.data?.items?.length ? (
        <View style={ui.panel}>
          <Text style={ui.muted}>No quotation records found for this lead.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {query.data.items.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docNumber}>
                    {doc.documentNumber ?? 'Draft Quotation'}
                  </Text>
                  <Text style={styles.docDate}>
                    Date: {doc.documentDate} {doc.validUntil ? `• Valid until: ${doc.validUntil}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, doc.status === 'ACCEPTED' ? styles.statusAccepted : doc.status === 'FINALIZED' ? styles.statusFinalized : styles.statusDraft]}>
                  <Text style={styles.statusBadgeText}>{doc.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total ({doc.items.length} items):</Text>
                  <Text style={styles.totalVal}>{formatMoney(doc.grandTotal)}</Text>
                </View>
                {doc.notes ? (
                  <Text style={styles.notesText} numberOfLines={2}>
                    {doc.notes}
                  </Text>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                <Button
                  title="View Details"
                  variant="outline"
                  onPress={() => setSelectedDoc(doc)}
                />
              </View>
            </View>
          ))}

          {query.data.total > (filters.pageSize ?? 20) ? (
            <Pager
              page={filters.page ?? 1}
              total={query.data.total}
              pageSize={filters.pageSize}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          ) : null}
        </View>
      )}

      {selectedDoc ? (
        <DocumentDetailsModal
          visible={!!selectedDoc}
          leadId={leadId}
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={() => {
            void query.refetch();
          }}
          onConvertToInvoice={onCreateInvoiceFromQuote}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  docNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
  },
  docDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDraft: {
    backgroundColor: colors.primarySoft,
  },
  statusFinalized: {
    backgroundColor: '#FFF2E8',
  },
  statusAccepted: {
    backgroundColor: '#E9F8ED',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  notesText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});
