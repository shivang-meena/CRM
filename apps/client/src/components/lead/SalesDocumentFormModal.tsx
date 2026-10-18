import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { saveDocument } from '@/api/salesDocuments';
import Button from '@/components/Button';
import { useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { Lead } from '@/types/lead';
import { DocumentItemInput, Party, SalesDocument } from '@/types/salesDocuments';
import { crmDateKey, formatMoney } from '@/utils/format';
import { colors } from '@/theme/colors';
import { Field, FormShell, ui } from './FormControls';

type Props = {
  visible: boolean;
  leadId: string;
  type: 'QUOTATION' | 'INVOICE';
  lead?: Lead | null;
  record?: SalesDocument | null;
  onSaved: () => void;
  onClose: () => void;
};

interface EditableItem extends DocumentItemInput {
  tempId: string;
}

const emptyItem = (): EditableItem => ({
  tempId: Math.random().toString(36).slice(2),
  description: '',
  quantity: '1',
  unit: 'units',
  unitPrice: '0',
  discountAmount: '0',
  taxPercent: '18',
});

function calculateItem(item: DocumentItemInput) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discountAmount) || 0;
  const tax = parseFloat(item.taxPercent) || 0;

  const gross = Math.round(qty * price * 100) / 100;
  const net = Math.max(0, gross - disc);
  const taxAmt = Math.round(net * (tax / 100) * 100) / 100;
  const total = net + taxAmt;

  return { gross, net, taxAmt, total };
}

export default function SalesDocumentFormModal({
  visible,
  leadId,
  type,
  lead,
  record,
  onSaved,
  onClose,
}: Props) {
  const isQuote = type === 'QUOTATION';
  const todayIso = crmDateKey();

  const [docDate, setDocDate] = useState(() => record?.documentDate ?? todayIso);
  const [expiryOrDue, setExpiryOrDue] = useState(() =>
    isQuote ? (record?.validUntil ?? '') : (record?.dueDate ?? '')
  );

  const [customer, setCustomer] = useState<Party>(() =>
    record?.customerSnapshot ?? {
      name: lead?.name ?? '',
      phone: lead?.phone ?? '',
      email: lead?.email ?? '',
      address: lead?.address ?? '',
      taxIdentifier: '',
    }
  );

  const [issuer, setIssuer] = useState<Party>(() =>
    record?.issuerSnapshot ?? {
      name: 'Shivora CRM Solutions',
      address: 'Tech Park, Sector 4, Bangalore, India',
      phone: '+91 98765 43210',
      email: 'billing@shivora.crm',
      taxIdentifier: 'GSTIN29ABCDE1234F1Z5',
    }
  );

  const [items, setItems] = useState<EditableItem[]>(() => {
    if (record?.items?.length) {
      return record.items.map((it) => ({
        tempId: it.id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit ?? '',
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        taxPercent: it.taxPercent,
      }));
    }
    return [emptyItem()];
  });

  const [notes, setNotes] = useState(() => record?.notes ?? '');
  const [terms, setTerms] = useState(() => record?.terms ?? 'Payment due within 15 days of invoice date.');
  const [error, setError] = useState('');

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    saveDocument(leadId, isQuote ? 'quotations' : 'invoices', body, record ?? undefined)
  );
  const keyFor = useSubmissionKey();

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    for (const it of items) {
      const calc = calculateItem(it);
      subtotal += calc.gross;
      discountTotal += parseFloat(it.discountAmount) || 0;
      taxTotal += calc.taxAmt;
      grandTotal += calc.total;
    }

    return {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  }, [items]);

  if (!visible) return null;

  function updateItem(index: number, field: keyof DocumentItemInput, value: string) {
    setItems((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError('');
    if (!docDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Document date must be in YYYY-MM-DD format.');
      return;
    }
    if (expiryOrDue && !expiryOrDue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError(`${isQuote ? 'Validity' : 'Due'} date must be in YYYY-MM-DD format.`);
      return;
    }
    if (!customer.name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!issuer.name.trim()) {
      setError('Issuer business name is required.');
      return;
    }
    if (!items.length) {
      setError('Add at least one item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        setError(`Item #${i + 1} requires a description.`);
        return;
      }
      const qty = parseFloat(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError(`Item #${i + 1} quantity must be greater than 0.`);
        return;
      }
      const price = parseFloat(it.unitPrice);
      if (isNaN(price) || price < 0) {
        setError(`Item #${i + 1} unit price cannot be negative.`);
        return;
      }
      const disc = parseFloat(it.discountAmount);
      if (isNaN(disc) || disc < 0) {
        setError(`Item #${i + 1} discount cannot be negative.`);
        return;
      }
      const gross = qty * price;
      if (disc > gross) {
        setError(`Item #${i + 1} discount cannot exceed gross amount.`);
        return;
      }
      const tax = parseFloat(it.taxPercent);
      if (isNaN(tax) || tax < 0 || tax > 100) {
        setError(`Item #${i + 1} tax percent must be between 0 and 100.`);
        return;
      }
    }

    const payloadItems = items.map((it) => ({
      description: it.description.trim(),
      quantity: it.quantity.trim(),
      unit: it.unit?.trim() || undefined,
      unitPrice: it.unitPrice.trim(),
      discountAmount: it.discountAmount.trim() || '0',
      taxPercent: it.taxPercent.trim() || '0',
    }));

    const body: Record<string, unknown> = {
      documentDate: docDate,
      currency: 'INR',
      customerSnapshot: {
        name: customer.name.trim(),
        phone: customer.phone?.trim() || undefined,
        email: customer.email?.trim() || undefined,
        address: customer.address?.trim() || undefined,
        taxIdentifier: customer.taxIdentifier?.trim() || undefined,
      },
      issuerSnapshot: {
        name: issuer.name.trim(),
        phone: issuer.phone?.trim() || undefined,
        email: issuer.email?.trim() || undefined,
        address: issuer.address?.trim() || undefined,
        taxIdentifier: issuer.taxIdentifier?.trim() || undefined,
      },
      items: payloadItems,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
    };

    if (isQuote) {
      body.validUntil = expiryOrDue || null;
    } else {
      body.dueDate = expiryOrDue || null;
    }

    if (!record) {
      body.requestKey = keyFor(body);
    }

    try {
      await mutation.mutateAsync(body);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <FormShell
      title={record ? `Edit ${isQuote ? 'Quotation' : 'Invoice'} Draft` : `Create ${isQuote ? 'Quotation' : 'Invoice'} Draft`}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={record ? 'Update Draft' : 'Save Draft'}
    >
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Document Dates</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Document Date (YYYY-MM-DD) *"
              value={docDate}
              onChange={setDocDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={`${isQuote ? 'Valid Until' : 'Due Date'} (YYYY-MM-DD)`}
              value={expiryOrDue}
              onChange={setExpiryOrDue}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Customer Details (Lead Snapshot)</Text>
        <Field label="Customer / Contact Name *" value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Phone" value={customer.phone ?? ''} onChange={(v) => setCustomer({ ...customer, phone: v })} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Email" value={customer.email ?? ''} onChange={(v) => setCustomer({ ...customer, email: v })} />
          </View>
        </View>
        <Field label="Billing Address" value={customer.address ?? ''} onChange={(v) => setCustomer({ ...customer, address: v })} multiline />
        <Field label="Tax / GSTIN ID" value={customer.taxIdentifier ?? ''} onChange={(v) => setCustomer({ ...customer, taxIdentifier: v })} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Issuer Business Details</Text>
        <Field label="Company / Entity Name *" value={issuer.name} onChange={(v) => setIssuer({ ...issuer, name: v })} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Phone" value={issuer.phone ?? ''} onChange={(v) => setIssuer({ ...issuer, phone: v })} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Email" value={issuer.email ?? ''} onChange={(v) => setIssuer({ ...issuer, email: v })} />
          </View>
        </View>
        <Field label="Business Address" value={issuer.address ?? ''} onChange={(v) => setIssuer({ ...issuer, address: v })} multiline />
        <Field label="GSTIN / Tax ID" value={issuer.taxIdentifier ?? ''} onChange={(v) => setIssuer({ ...issuer, taxIdentifier: v })} />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.itemsHeaderRow}>
          <Text style={styles.sectionHeader}>Line Items ({items.length})</Text>
          <Button title="+ Add Item" variant="outline" onPress={addItem} />
        </View>

        {items.map((item, idx) => {
          const calc = calculateItem(item);
          return (
            <View key={item.tempId} style={styles.itemBox}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemNumberText}>Item #{idx + 1}</Text>
                {items.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove item ${idx + 1}`}
                    onPress={() => removeItem(idx)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>

              <Field
                label="Description *"
                value={item.description}
                onChange={(v) => updateItem(idx, 'description', v)}
                placeholder="Product or service description"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Quantity *"
                    value={item.quantity}
                    onChange={(v) => updateItem(idx, 'quantity', v)}
                    numeric
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Unit"
                    value={item.unit ?? ''}
                    onChange={(v) => updateItem(idx, 'unit', v)}
                    placeholder="e.g. pcs, hrs"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Unit Price (₹) *"
                    value={item.unitPrice}
                    onChange={(v) => updateItem(idx, 'unitPrice', v)}
                    numeric
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Discount (₹)"
                    value={item.discountAmount}
                    onChange={(v) => updateItem(idx, 'discountAmount', v)}
                    numeric
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Tax (%)"
                    value={item.taxPercent}
                    onChange={(v) => updateItem(idx, 'taxPercent', v)}
                    numeric
                  />
                </View>
                <View style={styles.calcSummary}>
                  <Text style={styles.calcLabel}>Item Total</Text>
                  <Text style={styles.calcValue}>{formatMoney(calc.total.toFixed(2))}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Totals Preview */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalVal}>{formatMoney(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount Total:</Text>
            <Text style={styles.totalVal}>- {formatMoney(totals.discountTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax Total:</Text>
            <Text style={styles.totalVal}>+ {formatMoney(totals.taxTotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total (₹):</Text>
            <Text style={styles.grandTotalVal}>{formatMoney(totals.grandTotal)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Additional Notes & Terms</Text>
        <Field label="Notes" value={notes} onChange={setNotes} multiline placeholder="Notes for customer..." />
        <Field label="Terms & Conditions" value={terms} onChange={setTerms} multiline placeholder="Terms of sale..." />
      </View>
    </FormShell>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    gap: 10,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemBox: {
    padding: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    gap: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  calcSummary: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 18,
  },
  calcLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  totalsCard: {
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryText,
  },
});
