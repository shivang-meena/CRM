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
import PaymentFormModal from './PaymentFormModal';

type Props = {
  leadId: string;
  summary?: SectionSummary;
};

const STATUS_FILTERS = ['', 'DRAFT', 'ISSUED', 'VOID'];

export default function InvoicesSection({ leadId, summary }: Props) {
  const [filters, setFilters] = useState<ListFilters>({ page: 1, pageSize: 20 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<SalesDocument | null>(null);
  const [payDoc, setPayDoc] = useState<SalesDocument | null>(null);

  const query = useDocuments(leadId, 'invoices', filters);

  function applyFilter(next: Partial<ListFilters>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }));
  }

  const overdueCount = summary?.overdue.invoices ?? 0;

  return (
    <View style={styles.container}>
      <View style={ui.panel}>
        <View style={ui.row}>
          <TextInput
            accessibilityLabel="Search invoices"
            placeholder="Search invoice number or notes..."
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
              setOverdue('');
              setFilters({ page: 1, pageSize: 20 });
            }}
          />
        </View>

        <View style={ui.row}>
          <View style={{ flex: 1 }}>
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filter overdue invoices: ${overdueCount}`}
            accessibilityState={{ selected: overdue === 'true' }}
            onPress={() => {
              const nextVal = overdue === 'true' ? '' : 'true';
              setOverdue(nextVal);
              applyFilter({ overdue: nextVal || undefined });
            }}
            style={[ui.choice, overdue === 'true' && ui.choiceOn, { alignSelf: 'flex-end', marginBottom: 2 }]}
          >
            <Text style={[ui.text, overdue === 'true' && { fontWeight: '700' }]}>
              Overdue {overdueCount ? `(${overdueCount})` : ''}
            </Text>
          </Pressable>
        </View>
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
          <Text style={ui.muted}>No invoice records found for this lead.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {query.data.items.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docNumber}>
                    {doc.documentNumber ?? 'Draft Invoice'}
                  </Text>
                  <Text style={styles.docDate}>
                    Date: {doc.documentDate} {doc.dueDate ? `• Due date: ${doc.dueDate}` : ''}
                  </Text>
                </View>

                <View style={styles.badgesRow}>
                  <View style={[styles.statusBadge, doc.status === 'ISSUED' ? styles.statusIssued : doc.status === 'VOID' ? styles.statusVoid : styles.statusDraft]}>
                    <Text style={styles.statusBadgeText}>{doc.status}</Text>
                  </View>
                  <View style={[styles.statusBadge, doc.paymentState === 'PAID' ? styles.statusPaid : styles.statusUnpaid]}>
                    <Text style={styles.statusBadgeText}>{doc.paymentState}</Text>
                  </View>
                  {doc.isOverdue ? (
                    <View style={[styles.statusBadge, styles.statusVoid]}>
                      <Text style={styles.statusBadgeText}>OVERDUE</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total:</Text>
                  <Text style={styles.totalVal}>{formatMoney(doc.grandTotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Paid Amount:</Text>
                  <Text style={[styles.totalVal, { color: colors.green }]}>{formatMoney(doc.paidAmount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Balance Due:</Text>
                  <Text style={[styles.totalVal, { color: colors.danger }]}>{formatMoney(doc.balance)}</Text>
                </View>
                {doc.notes ? (
                  <Text style={styles.notesText} numberOfLines={2}>
                    {doc.notes}
                  </Text>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                {doc.status === 'ISSUED' && parseFloat(doc.balance) > 0 ? (
                  <Button
                    title="Record Payment"
                    variant="outline"
                    onPress={() => setPayDoc(doc)}
                  />
                ) : null}
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
        />
      ) : null}

      {payDoc ? (
        <PaymentFormModal
          visible={!!payDoc}
          leadId={leadId}
          invoice={payDoc}
          onSaved={() => {
            setPayDoc(null);
            void query.refetch();
          }}
          onClose={() => setPayDoc(null)}
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
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDraft: {
    backgroundColor: colors.primarySoft,
  },
  statusIssued: {
    backgroundColor: colors.accentSoft,
  },
  statusVoid: {
    backgroundColor: colors.dangerSoft,
  },
  statusPaid: {
    backgroundColor: '#E9F8ED',
  },
  statusUnpaid: {
    backgroundColor: '#FFF2E8',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  cardBody: {
    gap: 4,
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
    fontSize: 12,
    color: colors.muted,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  notesText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});
