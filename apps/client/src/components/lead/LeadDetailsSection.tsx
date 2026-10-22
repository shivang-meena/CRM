import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Lead, sourceLabel, statusLabel } from '@/types/lead';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Button from '@/components/Button';
import Stars from '@/components/Stars';

function Card({ title, wide, children }: { title: string; wide: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.card, wide && { flex: 1 }]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Item({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label} :</Text>
      {children ?? <Text style={styles.value}>{value || '-'}</Text>}
    </View>
  );
}

type Props = {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const statusesQuery = useLeadStatuses();
  const matchedStatus = statusesQuery.data?.find(
    (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
  );
  const statusName = matchedStatus?.name ?? statusLabel(lead.status);

  return (
    <View style={styles.container}>
      <View style={[styles.cards, wide && { flexDirection: 'row' }]}>
        <Card title="Lead Information" wide={wide}>
          <Item label="Name" value={lead.name} />
          <Item label="Company Name" value={lead.companyName} />
          <Item label="Service" value={lead.service?.name} />
          <Item label="Phone" value={lead.phone} />
          <Item label="Email Address" value={lead.email} />
          <Item label="Address" value={lead.address} />
          <Item label="Comment" value={lead.comment} />
          <Item label="Reference" value={lead.reference} />
        </Card>

        <Card title="General Information" wide={wide}>
          <Item label="Date" value={formatDateTime(lead.createdAt)} />
          <Item label="Follow Up Date" value={formatDateTime(lead.nextFollowUpAt)} />
          <Item label="Status" value={statusName} />
          <Item label="Source" value={sourceLabel(lead.source)} />
          <Item label="Labels">
            {lead.label ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{lead.label}</Text>
              </View>
            ) : (
              <Text style={styles.value}>-</Text>
            )}
          </Item>
          <Item label="Estimated Amount" value={formatINR(Number(lead.estimatedAmount))} />
          <Item label="Rating">
            <Stars value={lead.rating} size={18} />
          </Item>
          <Item label="Created By" value={lead.createdBy} />
          <Item label="Assign To" value={lead.assignedTo} />
        </Card>
      </View>

      <View style={styles.btnRow}>
        <Button title="Edit Lead" onPress={onEdit} />
        <Button title="Delete Lead" variant="danger" onPress={onDelete} />
        <Button title="Back to Leads" variant="outline" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardHead: {
    backgroundColor: colors.navy,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  value: {
    fontSize: 13,
    color: colors.muted,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
});
