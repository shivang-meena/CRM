// // apps/client/src/calendar/DayCalendar.tsx
// import React from 'react';
// import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { colors } from '@/theme/colors';
// import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
// import { formatCalendarTime, overlapsIstDay } from './calendarDates';

// type Props = { date: string; items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

// export default function DayCalendar({ date, items, onOpenItem }: Props) {
//   const entries = items.filter(item => overlapsIstDay(item, date)); const allDay = entries.filter(item => item.allDay); const timed = entries.filter(item => !item.allDay).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
//   return <ScrollView contentContainerStyle={styles.body}>{allDay.length ? <View style={styles.section}><Text style={styles.sectionTitle}>All day</Text>{allDay.map(item => <DayEntry key={item.key} item={item} onOpen={onOpenItem} />)}</View> : null}<View style={styles.section}><Text style={styles.sectionTitle}>Timed</Text>{timed.length ? timed.map(item => <DayEntry key={item.key} item={item} onOpen={onOpenItem} />) : <Text style={styles.empty}>No entries for this day.</Text>}</View></ScrollView>;
// }

// function DayEntry({ item, onOpen }: { item: CalendarItem; onOpen: (item: CalendarItem) => void }) { return <Pressable accessibilityRole="button" onPress={() => onOpen(item)} style={styles.entry}><View style={[styles.marker, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} /><View style={styles.content}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.allDay ? 'All day' : formatCalendarTime(item.startAt)} · {CALENDAR_CATEGORY_LABELS[item.category]}{item.status ? ` · ${item.status}` : ''}</Text></View></Pressable>; }
// const styles = StyleSheet.create({ body: { padding: 14, gap: 18 }, section: { gap: 8 }, sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, entry: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, backgroundColor: colors.white }, marker: { width: 5, borderRadius: 3 }, content: { flex: 1, gap: 4 }, title: { color: colors.text, fontSize: 13, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 11 }, empty: { color: colors.muted, fontSize: 13, paddingVertical: 20 } });


// apps/client/src/calendar/DayCalendar.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CalendarItem } from '@/types/calendar';
import { formatCalendarTime, overlapsIstDay, todayIstKey } from './calendarDates';
import { CategoryTag, EmptyState, IconName, SOFT, StatusTag, tint } from './calendarUi';

type Props = { date: string; items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

export default function DayCalendar({ date, items, onOpenItem }: Props) {
  const entries = items.filter(item => overlapsIstDay(item, date));
  const allDay = entries.filter(item => item.allDay);
  const timed = entries
    .filter(item => !item.allDay)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  if (!entries.length) {
    return (
      <ScrollView contentContainerStyle={styles.body}>
        <EmptyState icon="calendar-clear-outline" title="Nothing scheduled" text="No entries for this day." />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {allDay.length ? (
        <View style={styles.section}>
          <SectionTitle icon="sunny-outline" label="All day" count={allDay.length} />
          {allDay.map(item => <DayEntry key={item.key} item={item} onOpen={onOpenItem} />)}
        </View>
      ) : null}

      {timed.length ? (
        <View style={styles.section}>
          <SectionTitle icon="time-outline" label="Timed" count={timed.length} />
          {timed.map(item => <DayEntry key={item.key} item={item} date={date} onOpen={onOpenItem} />)}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SectionTitle({ icon, label, count }: { icon: IconName; label: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View>
    </View>
  );
}

function DayEntry({ item, date, onOpen }: { item: CalendarItem; date?: string; onOpen: (item: CalendarItem) => void }) {
  const color = CALENDAR_CATEGORY_COLORS[item.category];

  // Timed entries get a time rail; entries that cross midnight say so instead of showing a misleading time.
  let railStart = '';
  let railEnd = '';
  if (date && !item.allDay) {
    railStart = todayIstKey(new Date(item.startAt)) < date ? 'Ongoing' : formatCalendarTime(item.startAt);
    if (item.endAt) railEnd = todayIstKey(new Date(item.endAt)) > date ? 'Continues' : formatCalendarTime(item.endAt);
  }

  return (
    <View style={styles.entryRow}>
      {date ? (
        <View style={styles.rail}>
          <Text style={styles.railStart}>{railStart}</Text>
          {railEnd ? <Text style={styles.railEnd}>{railEnd}</Text> : null}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => onOpen(item)}
        style={({ pressed }) => [styles.entry, { backgroundColor: tint(color, pressed ? '26' : '14'), borderLeftColor: color }]}
      >
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tags}>
          <CategoryTag category={item.category} />
          {item.status ? <StatusTag status={item.status} /> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 22 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: colors.text, fontSize: 13.5, fontWeight: '800' },
  countPill: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center' },
  countText: { color: colors.muted, fontSize: 11, fontWeight: '800' },

  entryRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  rail: { width: 64, paddingTop: 12, alignItems: 'flex-end', gap: 2 },
  railStart: { color: colors.text, fontSize: 13, fontWeight: '800' },
  railEnd: { color: colors.muted, fontSize: 11.5 },
  entry: { flex: 1, minWidth: 0, gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderLeftWidth: 4, borderRadius: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '800', lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});