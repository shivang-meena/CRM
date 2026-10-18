import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { recordPayment } from '@/api/salesDocuments';
import { useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { SalesDocument } from '@/types/salesDocuments';
import { formatMoney } from '@/utils/format';
import { Choices, DateField, Field, FormShell } from './FormControls';
import { colors } from '@/theme/colors';

type Props = {
  visible: boolean;
  leadId: string;
  invoice: SalesDocument;
  onSaved: () => void;
  onClose: () => void;
};

const METHODS = ['UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'OTHER'];

export default function PaymentFormModal({
  visible,
  leadId,
  invoice,
  onSaved,
  onClose,
}: Props) {
  const [amount, setAmount] = useState(() => invoice.balance || '0');
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString());
  const [error, setError] = useState('');

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    recordPayment(leadId, invoice.id, body)
  );
  const keyFor = useSubmissionKey();

  if (!visible) return null;

  async function handleSave() {
    setError('');
    const amt = parseFloat(amount);
    const balance = parseFloat(invoice.balance);

    if (isNaN(amt) || amt <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }
    if (amt > balance) {
      setError(`Payment cannot exceed the outstanding balance of ${formatMoney(invoice.balance)}.`);
      return;
    }

    const body: Record<string, unknown> = {
      amount: amt.toFixed(2),
      paidAt: paidAt || new Date().toISOString(),
      method,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
    };
    body.requestKey = keyFor(body);

    try {
      await mutation.mutateAsync(body);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <FormShell
      title={`Record Payment for ${invoice.documentNumber ?? 'Invoice'}`}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel="Record Payment"
    >
      <View style={styles.invoiceSummary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Grand Total</Text>
          <Text style={styles.summaryVal}>{formatMoney(invoice.grandTotal)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Already Paid</Text>
          <Text style={styles.summaryVal}>{formatMoney(invoice.paidAmount)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Balance Due</Text>
          <Text style={[styles.summaryVal, { color: colors.danger }]}>{formatMoney(invoice.balance)}</Text>
        </View>
      </View>

      <Field label="Payment Amount (₹) *" value={amount} onChange={setAmount} numeric />
      <Choices label="Payment Method *" value={method} options={METHODS} onChange={setMethod} />
      <Field label="Payment Reference / Transaction ID" value={reference} onChange={setReference} placeholder="e.g. UPI Ref / Cheque No / Bank Ref" />
      <Field label="Note" value={note} onChange={setNote} multiline placeholder="Additional payment note..." />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  invoiceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryCol: {
    gap: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
});
