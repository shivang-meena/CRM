// apps/client/src/calendar/calendarUi.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarCategory } from '@/types/calendar';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const SURFACE = '#F7F9FC';
export const SOFT = '#EEF3FA';
export const TODAY_TINT = '#F2F7FF';

// Appends an alpha byte to a 6-digit hex colour, so every tint stays inside the existing category palette.
export const tint = (hex: string, alpha: string) => `${hex}${alpha}`;

export function prettyStatus(status: string) {
  const text = status.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function CategoryTag({ category }: { category: CalendarCategory }) {
  const color = CALENDAR_CATEGORY_COLORS[category];
  return (
    <View style={[styles.tag, { backgroundColor: tint(color, '1A') }]}>
      <View style={[styles.tagDot, { backgroundColor: color }]} />
      <Text style={styles.tagText}>{CALENDAR_CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

export function StatusTag({ status }: { status: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: SOFT }]}>
      <Text style={[styles.tagText, { color: colors.muted }]}>{prettyStatus(status)}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={colors.primaryText} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
