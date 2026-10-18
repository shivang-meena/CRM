import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { convertQuotation, documentAction, voidPayment } from '@/api/salesDocuments';
import Button from '@/components/Button';
import { useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { SalesDocument } from '@/types/salesDocuments';
import { formatDateTime, formatMoney } from '@/utils/format';
import { colors } from '@/theme/colors';
import { labelFor, ui } from './FormControls';
import PaymentFormModal from './PaymentFormModal';
import SalesDocumentFormModal from './SalesDocumentFormModal';

type Props = {
  visible: boolean;
  leadId: string;
  document: SalesDocument | null;
  onClose: () => void;
  onRefresh: () => void;
  onConvertToInvoice?: (invoice: SalesDocument) => void;
};

export default function DocumentDetailsModal({
  visible,
  leadId,
  document: doc,
  onClose,
  onRefresh,
  onConvertToInvoice,
}: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [voidPaymentId, setVoidPaymentId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const keyFor = useSubmissionKey();
  const crmMutation = useCrmMutation(leadId, async () => {});

  if (!visible || !doc) return null;

  const isQuote = doc.type === 'QUOTATION';

  async function handleAction(action: string, extra: Record<string, unknown> = {}) {
    if (!doc) return;
    setError('');
    setBusy(true);
    try {
      await documentAction(leadId, isQuote ? 'quotations' : 'invoices', doc, action, extra);
      await crmMutation.mutateAsync(undefined);
      onRefresh();
      if (action === 'delete') {
        onClose();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert() {
    if (!doc) return;
    setError('');
    setBusy(true);
    try {
      const key = keyFor({ convertQuote: doc.id });
      const invoice = await convertQuotation(leadId, doc.id, doc.version, key);
      await crmMutation.mutateAsync(undefined);
      onRefresh();
      if (onConvertToInvoice) onConvertToInvoice(invoice);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleVoidPayment() {
    if (!doc || !voidPaymentId) return;
    if (!voidReason.trim()) {
      setError('Please provide a reason for voiding this payment.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await voidPayment(leadId, doc.id, voidPaymentId, doc.version, voidReason.trim());
      await crmMutation.mutateAsync(undefined);
      setVoidPaymentId(null);
      setVoidReason('');
      onRefresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={ui.overlay}>
        <View style={ui.modal}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Text style={styles.modalTitle}>
                  {doc.documentNumber ?? `Draft ${isQuote ? 'Quotation' : 'Invoice'}`}
                </Text>
                <View style={[styles.statusBadge, doc.status === 'ISSUED' && styles.statusIssued, doc.status === 'ACCEPTED' && styles.statusAccepted, doc.status === 'VOID' && styles.statusVoid]}>
                  <Text style={styles.statusBadgeText}>{doc.status}</Text>
                </View>
                {!isQuote ? (
                  <View style={[styles.statusBadge, doc.paymentState === 'PAID' ? styles.statusAccepted : styles.statusPart]}>
                    <Text style={styles.statusBadgeText}>{doc.paymentState}</Text>
                  </View>
                ) : null}
                {doc.isOverdue ? (
                  <View style={[styles.statusBadge, styles.statusVoid]}>
                    <Text style={styles.statusBadgeText}>OVERDUE</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.subMeta}>
                Date: {doc.documentDate} {isQuote && doc.validUntil ? `• Valid until: ${doc.validUntil}` : ''} {!isQuote && doc.dueDate ? `• Due date: ${doc.dueDate}` : ''}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close document details" onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.primaryText} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={ui.body}>
            {error ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Parties Snapshot */}
            <View style={styles.partiesRow}>
              <View style={styles.partyBox}>
                <Text style={styles.partyHeading}>Customer Details</Text>
                <Text style={styles.partyName}>{doc.customerSnapshot.name}</Text>
                {doc.customerSnapshot.phone ? <Text style={styles.partyMeta}>Phone: {doc.customerSnapshot.phone}</Text> : null}
                {doc.customerSnapshot.email ? <Text style={styles.partyMeta}>Email: {doc.customerSnapshot.email}</Text> : null}
                {doc.customerSnapshot.address ? <Text style={styles.partyMeta}>Address: {doc.customerSnapshot.address}</Text> : null}
                {doc.customerSnapshot.taxIdentifier ? <Text style={styles.partyMeta}>Tax ID: {doc.customerSnapshot.taxIdentifier}</Text> : null}
              </View>

              <View style={styles.partyBox}>
                <Text style={styles.partyHeading}>Issuer Details</Text>
                <Text style={styles.partyName}>{doc.issuerSnapshot.name}</Text>
                {doc.issuerSnapshot.phone ? <Text style={styles.partyMeta}>Phone: {doc.issuerSnapshot.phone}</Text> : null}
                {doc.issuerSnapshot.email ? <Text style={styles.partyMeta}>Email: {doc.issuerSnapshot.email}</Text> : null}
                {doc.issuerSnapshot.address ? <Text style={styles.partyMeta}>Address: {doc.issuerSnapshot.address}</Text> : null}
                {doc.issuerSnapshot.taxIdentifier ? <Text style={styles.partyMeta}>Tax ID: {doc.issuerSnapshot.taxIdentifier}</Text> : null}
              </View>
            </View>

            {/* Line Items Table */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items & Pricing</Text>
              <View style={styles.table}>
                <View style={styles.tableHead}>
                  <Text style={[styles.th, { flex: 2 }]}>Description</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Disc</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Tax</Text>
                  <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
                </View>
                {doc.items.map((it, idx) => (
                  <View key={it.id ?? idx} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tdDesc}>{it.description}</Text>
                      {it.unit ? <Text style={styles.tdUnit}>({it.unit})</Text> : null}
                    </View>
                    <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{it.quantity}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{formatMoney(it.unitPrice)}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{formatMoney(it.discountAmount)}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{it.taxPercent}%</Text>
                    <Text style={[styles.tdBold, { flex: 1.2, textAlign: 'right' }]}>{formatMoney(it.totalAmount)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Financial Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Subtotal</Text>
                <Text style={styles.sumVal}>{formatMoney(doc.subtotal)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Discount</Text>
                <Text style={styles.sumVal}>- {formatMoney(doc.discountTotal)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Tax Total</Text>
                <Text style={styles.sumVal}>+ {formatMoney(doc.taxTotal)}</Text>
              </View>
              <View style={[styles.sumRow, styles.grandRow]}>
                <Text style={styles.grandLabel}>Grand Total</Text>
                <Text style={styles.grandVal}>{formatMoney(doc.grandTotal)}</Text>
              </View>

              {!isQuote ? (
                <>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Paid Amount</Text>
                    <Text style={[styles.sumVal, { color: colors.green }]}>{formatMoney(doc.paidAmount)}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>Balance Due</Text>
                    <Text style={[styles.sumVal, { color: colors.danger, fontWeight: '800' }]}>{formatMoney(doc.balance)}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Notes & Terms */}
            {doc.notes || doc.terms ? (
              <View style={styles.notesBox}>
                {doc.notes ? (
                  <View style={{ gap: 2 }}>
                    <Text style={styles.notesHead}>Notes:</Text>
                    <Text style={styles.notesBody}>{doc.notes}</Text>
                  </View>
                ) : null}
                {doc.terms ? (
                  <View style={{ gap: 2 }}>
                    <Text style={styles.notesHead}>Terms & Conditions:</Text>
                    <Text style={styles.notesBody}>{doc.terms}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Invoices Payment History */}
            {!isQuote && doc.payments?.length > 0 ? (
              <View style={styles.paymentsSection}>
                <Text style={styles.sectionTitle}>Recorded Payments ({doc.payments.length})</Text>
                {doc.payments.map((p) => (
                  <View key={p.id} style={[styles.paymentCard, p.voidedAt ? styles.paymentVoided : undefined]}>
                    <View style={styles.payTop}>
                      <Text style={styles.payAmount}>{formatMoney(p.amount)}</Text>
                      <View style={[styles.statusBadge, p.voidedAt ? styles.statusVoid : styles.statusAccepted]}>
                        <Text style={styles.statusBadgeText}>{p.voidedAt ? 'VOIDED' : p.method}</Text>
                      </View>
                    </View>
                    <Text style={styles.payMeta}>Date: {formatDateTime(p.paidAt)} IST {p.reference ? `• Ref: ${p.reference}` : ''}</Text>
                    {p.note ? <Text style={styles.payMeta}>Note: {p.note}</Text> : null}
                    {p.voidedAt ? (
                      <Text style={[styles.payMeta, { color: colors.danger }]}>Void reason: {p.voidReason}</Text>
                    ) : (
                      <View style={{ marginTop: 6 }}>
                        <Button
                          title="Void Payment"
                          variant="danger"
                          onPress={() => setVoidPaymentId(p.id)}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Void Payment Prompt Dialog */}
            {voidPaymentId ? (
              <View style={styles.voidPromptBox}>
                <Text style={styles.voidPromptTitle}>Void Payment Reason</Text>
                <TextInput
                  placeholder="Enter reason for voiding this payment..."
                  value={voidReason}
                  onChangeText={setVoidReason}
                  style={ui.input}
                  placeholderTextColor={colors.muted}
                />
                <View style={ui.row}>
                  <Button title="Cancel" variant="outline" onPress={() => setVoidPaymentId(null)} />
                  <Button title="Confirm Void" variant="danger" loading={busy} onPress={handleVoidPayment} />
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Modal Actions Footer */}
          <View style={ui.footer}>
            <View style={styles.actionsFooterRow}>
              {/* Quotation Specific Actions */}
              {isQuote && doc.status === 'DRAFT' ? (
                <>
                  <Button title="Edit Draft" variant="outline" onPress={() => setEditOpen(true)} />
                  <Button title="Finalize Quotation" loading={busy} onPress={() => handleAction('finalize')} />
                  <Button title="Delete Draft" variant="danger" loading={busy} onPress={() => handleAction('delete')} />
                </>
              ) : null}

              {isQuote && doc.status === 'FINALIZED' ? (
                <>
                  <Button title="Accept" loading={busy} onPress={() => handleAction('accept')} />
                  <Button title="Reject" variant="outline" loading={busy} onPress={() => handleAction('reject')} />
                  <Button title="Cancel Quote" variant="danger" loading={busy} onPress={() => handleAction('cancel')} />
                </>
              ) : null}

              {isQuote && doc.status === 'ACCEPTED' ? (
                <Button title="Create Invoice from Quotation" loading={busy} onPress={handleConvert} />
              ) : null}

              {/* Invoice Specific Actions */}
              {!isQuote && doc.status === 'DRAFT' ? (
                <>
                  <Button title="Edit Draft" variant="outline" onPress={() => setEditOpen(true)} />
                  <Button title="Issue Invoice" loading={busy} onPress={() => handleAction('issue')} />
                  <Button title="Delete Draft" variant="danger" loading={busy} onPress={() => handleAction('delete')} />
                </>
              ) : null}

              {!isQuote && doc.status === 'ISSUED' ? (
                <>
                  {parseFloat(doc.balance) > 0 ? (
                    <Button title="Record Payment" onPress={() => setPaymentOpen(true)} />
                  ) : null}
                  <Button title="Void Invoice" variant="danger" loading={busy} onPress={() => handleAction('void')} />
                </>
              ) : null}

              <Button title="Close" variant="outline" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>

      {/* Edit Draft Form Modal */}
      {editOpen ? (
        <SalesDocumentFormModal
          visible={editOpen}
          leadId={leadId}
          type={doc.type}
          record={doc}
          onSaved={() => {
            setEditOpen(false);
            onRefresh();
          }}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

      {/* Record Payment Modal */}
      {paymentOpen ? (
        <PaymentFormModal
          visible={paymentOpen}
          leadId={leadId}
          invoice={doc}
          onSaved={() => {
            setPaymentOpen(false);
            onRefresh();
          }}
          onClose={() => setPaymentOpen(false)}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subMeta: {
    fontSize: 12,
    color: colors.primaryText,
    opacity: 0.85,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  statusBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusIssued: {
    backgroundColor: colors.accentSoft,
  },
  statusAccepted: {
    backgroundColor: '#E9F8ED',
  },
  statusPart: {
    backgroundColor: '#FFF2E8',
  },
  statusVoid: {
    backgroundColor: colors.dangerSoft,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  partyBox: {
    flex: 1,
    minWidth: 200,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  partyHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  partyMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  itemsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryText,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  td: {
    fontSize: 12,
    color: colors.text,
  },
  tdDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  tdUnit: {
    fontSize: 10,
    color: colors.muted,
  },
  tdBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  summaryCard: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  sumVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 2,
  },
  grandLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  grandVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryText,
  },
  notesBox: {
    padding: 12,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    gap: 8,
  },
  notesHead: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  notesBody: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  paymentsSection: {
    gap: 8,
  },
  paymentCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  paymentVoided: {
    opacity: 0.6,
    backgroundColor: colors.dangerSoft,
  },
  payTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  payMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  voidPromptBox: {
    padding: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    gap: 10,
  },
  voidPromptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },
  actionsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
});
