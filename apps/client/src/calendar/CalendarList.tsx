import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
import { formatCalendarDate, formatCalendarTime, itemRangeLabel, todayIstKey } from './calendarDates';

type Props = { items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

export default function CalendarList({ items, onOpenItem }: Props) {
  const groups = useMemo(() => { const map = new Map<string, CalendarItem[]>(); [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key)).forEach(item => { const key = todayIstKey(new Date(item.startAt)); map.set(key, [...(map.get(key) ?? []), item]); }); return [...map.entries()]; }, [items]);
  if (!groups.length) return <View style={styles.empty}><Text style={styles.emptyTitle}>No calendar entries</Text><Text style={styles.emptyText}>There are no entries for this month.</Text></View>;
  return <ScrollView contentContainerStyle={styles.body}>{groups.map(([date, rows]) => <View key={date} style={styles.group}><Text style={styles.date}>{formatCalendarDate(rows[0].startAt)}</Text>{rows.map(item => <Pressable key={item.key} accessibilityRole="button" onPress={() => onOpenItem(item)} style={styles.row}><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} /><View style={styles.main}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.allDay ? 'All day' : formatCalendarTime(item.startAt)} · {CALENDAR_CATEGORY_LABELS[item.category]}{item.endAt ? ` · ${itemRangeLabel(item)}` : ''}{item.status ? ` · ${item.status}` : ''}</Text></View></Pressable>)}</View>)}</ScrollView>;
}

const styles = StyleSheet.create({ body: { padding: 14, gap: 18 }, group: { gap: 8 }, date: { color: colors.primaryText, fontSize: 13, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }, dot: { width: 9, height: 9, borderRadius: 5 }, main: { flex: 1, gap: 3 }, title: { color: colors.text, fontSize: 13, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 11 }, empty: { padding: 32, alignItems: 'center', gap: 8 }, emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 15 }, emptyText: { color: colors.muted, fontSize: 12 } });
