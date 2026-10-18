import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lead, statusLabel } from '@/types/lead';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Stars from '@/components/Stars';

export default function LeadHeader({ lead }: { lead: Lead }) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(lead.name || 'L').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.titleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{lead.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel(lead.status)}</Text>
            </View>
          </View>
          {lead.companyName ? <Text style={styles.company}>{lead.companyName}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Assigned to: <Text style={styles.metaBold}>{lead.assignedTo || 'Unassigned'}</Text></Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>Phone: <Text style={styles.metaBold}>{lead.phone}</Text></Text>
            {lead.email ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaText}>Email: <Text style={styles.metaBold}>{lead.email}</Text></Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Next Follow-up</Text>
          <Text style={[styles.summaryVal, !lead.nextFollowUpAt && styles.emptyVal]}>
            {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Estimated Amount</Text>
          <Text style={styles.summaryVal}>{formatINR(Number(lead.estimatedAmount))}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Rating</Text>
          <Stars value={lead.rating} size={15} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
  },
  titleInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  company: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted,
  },
  metaBold: {
    fontWeight: '700',
    color: colors.text,
  },
  dot: {
    fontSize: 12,
    color: colors.muted,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: 110,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  emptyVal: {
    color: colors.muted,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
});
