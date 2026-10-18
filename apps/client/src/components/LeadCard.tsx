import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { Lead } from '@/types/lead';
import { formatDateTime, formatINR, isOverdue } from '@/utils/format';
import Stars from './Stars';
import { useLeadDnd } from '@/context/LeadDndContext';

type Props = { lead: Lead; onOpen: () => void; onMenu: () => void };

function Row({ k, v, red, lines }: { k: string; v: string; red?: boolean; lines?: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}:</Text>
      <Text style={[styles.rowVal, red && { color: colors.danger, fontWeight: '700' }]} numberOfLines={lines}>
        {v}
      </Text>
    </View>
  );
}

export default function LeadCard({ lead, onOpen, onMenu }: Props) {
  const overdue = isOverdue(lead);
  const dnd = useLeadDnd();
  const isDragging = dnd?.draggingLeadId === lead.id;
  const isDraggingRef = useRef(false);

  const handleOpen = () => {
    if (isDraggingRef.current) return;
    onOpen();
  };

  const cardContent = (
    <Pressable
      onPress={handleOpen}
      style={[
        styles.card,
        overdue && styles.cardOverdue,
        isDragging && styles.cardDragging,
      ]}
    >
      <View style={styles.top}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.name} numberOfLines={1}>{lead.name.toUpperCase()}</Text>
          <Ionicons name="reorder-two-outline" size={16} color={colors.muted} />
        </View>
        <View style={styles.phoneRow}>
          <Ionicons name="call" size={13} color={colors.green} />
          <Text style={styles.phone}>{lead.phone}</Text>
        </View>
        {!!lead.label && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{lead.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.rows}>
        <Row k="CD" v={formatDateTime(lead.createdAt)} />
        <Row k="BY" v={lead.createdBy} />
        <Row k="TO" v={lead.assignedTo} />
        {!!lead.nextFollowUpAt && <Row k="NFD" v={formatDateTime(lead.nextFollowUpAt)} red={overdue} />}
        {!!lead.address && <Row k="AD" v={lead.address} lines={1} />}
      </View>

      <View style={[styles.rateBox, overdue && { borderColor: colors.dangerBorder }]}>
        <View style={styles.rateLeft}>
          <Text style={styles.rateLabel}>Rating</Text>
          <Stars value={lead.rating} size={14} />
        </View>
        <View style={styles.rateRight}>
          <Text style={styles.rateLabel}>Estimated Amount</Text>
          <Text style={styles.amount}>{formatINR(lead.estimatedAmount)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {overdue ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OVERDUE</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          onPress={(e: any) => {
            e?.stopPropagation?.();
            onMenu();
          }}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
        </Pressable>
      </View>
    </Pressable>
  );

  if (Platform.OS === 'web') {
    return (
      <div
        draggable
        onDragStart={(e) => {
          isDraggingRef.current = true;
          e.dataTransfer.setData('text/plain', lead.id);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => {
            dnd?.startDrag(lead.id);
          }, 0);
        }}
        onDragEnd={() => {
          dnd?.endDrag();
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          opacity: isDragging ? 0.35 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, padding: 12, gap: 8,
  },
  cardOverdue: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  cardDragging: { borderStyle: 'dashed', borderColor: colors.primary },
  top: { gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { fontSize: 13, color: colors.text },
  chip: {
    alignSelf: 'flex-start', backgroundColor: colors.primarySoft,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.primaryText },
  divider: { height: 1, backgroundColor: colors.border },
  rows: { gap: 3 },
  row: { flexDirection: 'row', gap: 6 },
  rowKey: { width: 32, fontSize: 12, fontWeight: '700', color: colors.text },
  rowVal: { flex: 1, fontSize: 12, color: colors.muted },
  rateBox: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: 8, gap: 8,
  },
  rateLeft: { gap: 4 },
  rateRight: { flex: 1, alignItems: 'flex-end', gap: 4, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 8 },
  rateLabel: { fontSize: 11, fontWeight: '700', color: colors.text },
  amount: { fontSize: 12, color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.danger, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
