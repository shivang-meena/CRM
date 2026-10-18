import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
import { formatCalendarTime, overlapsIstDay } from './calendarDates';

type Props = { date: string; items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

export default function DayCalendar({ date, items, onOpenItem }: Props) {
  const entries = items.filter(item => overlapsIstDay(item, date)); const allDay = entries.filter(item => item.allDay); const timed = entries.filter(item => !item.allDay).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return <ScrollView contentContainerStyle={styles.body}>{allDay.length ? <View style={styles.section}><Text style={styles.sectionTitle}>All day</Text>{allDay.map(item => <DayEntry key={item.key} item={item} onOpen={onOpenItem} />)}</View> : null}<View style={styles.section}><Text style={styles.sectionTitle}>Timed</Text>{timed.length ? timed.map(item => <DayEntry key={item.key} item={item} onOpen={onOpenItem} />) : <Text style={styles.empty}>No entries for this day.</Text>}</View></ScrollView>;
}

function DayEntry({ item, onOpen }: { item: CalendarItem; onOpen: (item: CalendarItem) => void }) { return <Pressable accessibilityRole="button" onPress={() => onOpen(item)} style={styles.entry}><View style={[styles.marker, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} /><View style={styles.content}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.allDay ? 'All day' : formatCalendarTime(item.startAt)} · {CALENDAR_CATEGORY_LABELS[item.category]}{item.status ? ` · ${item.status}` : ''}</Text></View></Pressable>; }
const styles = StyleSheet.create({ body: { padding: 14, gap: 18 }, section: { gap: 8 }, sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, entry: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, backgroundColor: colors.white }, marker: { width: 5, borderRadius: 3 }, content: { flex: 1, gap: 4 }, title: { color: colors.text, fontSize: 13, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 11 }, empty: { color: colors.muted, fontSize: 13, paddingVertical: 20 } });
