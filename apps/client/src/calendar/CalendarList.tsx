// // apps/client/src/calendar/CalendarList.tsx
// import React, { useMemo } from 'react';
// import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { colors } from '@/theme/colors';
// import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
// import { formatCalendarDate, formatCalendarTime, itemRangeLabel, todayIstKey } from './calendarDates';

// type Props = { items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

// export default function CalendarList({ items, onOpenItem }: Props) {
//   const groups = useMemo(() => { const map = new Map<string, CalendarItem[]>(); [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key)).forEach(item => { const key = todayIstKey(new Date(item.startAt)); map.set(key, [...(map.get(key) ?? []), item]); }); return [...map.entries()]; }, [items]);
//   if (!groups.length) return <View style={styles.empty}><Text style={styles.emptyTitle}>No calendar entries</Text><Text style={styles.emptyText}>There are no entries for this month.</Text></View>;
//   return <ScrollView contentContainerStyle={styles.body}>{groups.map(([date, rows]) => <View key={date} style={styles.group}><Text style={styles.date}>{formatCalendarDate(rows[0].startAt)}</Text>{rows.map(item => <Pressable key={item.key} accessibilityRole="button" onPress={() => onOpenItem(item)} style={styles.row}><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} /><View style={styles.main}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.allDay ? 'All day' : formatCalendarTime(item.startAt)} · {CALENDAR_CATEGORY_LABELS[item.category]}{item.endAt ? ` · ${itemRangeLabel(item)}` : ''}{item.status ? ` · ${item.status}` : ''}</Text></View></Pressable>)}</View>)}</ScrollView>;
// }

// const styles = StyleSheet.create({ body: { padding: 14, gap: 18 }, group: { gap: 8 }, date: { color: colors.primaryText, fontSize: 13, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 }, dot: { width: 9, height: 9, borderRadius: 5 }, main: { flex: 1, gap: 3 }, title: { color: colors.text, fontSize: 13, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 11 }, empty: { padding: 32, alignItems: 'center', gap: 8 }, emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 15 }, emptyText: { color: colors.muted, fontSize: 12 } });

// apps/client/src/calendar/CalendarList.tsx
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CalendarItem } from '@/types/calendar';
import { addDays, dateKeyToUtc, formatCalendarTime, itemRangeLabel, parseDateKey, todayIstKey } from './calendarDates';
import { CategoryTag, EmptyState, StatusTag } from './calendarUi';

type Props = { items: CalendarItem[]; onOpenItem: (item: CalendarItem) => void };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// One readable "when" line per entry (the old version repeated the time and the range).
function whenLabel(item: CalendarItem): string {
  if (item.allDay) {
    if (!item.endAt) return 'All day';
    const startKey = todayIstKey(new Date(item.startAt));
    const endKey = addDays(todayIstKey(new Date(item.endAt)), -1);
    return startKey === endKey ? 'All day' : itemRangeLabel(item);
  }
  if (!item.endAt) return formatCalendarTime(item.startAt);
  return todayIstKey(new Date(item.startAt)) === todayIstKey(new Date(item.endAt))
    ? `${formatCalendarTime(item.startAt)} – ${formatCalendarTime(item.endAt)}`
    : itemRangeLabel(item);
}

export default function CalendarList({ items, onOpenItem }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    [...items]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key))
      .forEach(item => {
        const key = todayIstKey(new Date(item.startAt));
        map.set(key, [...(map.get(key) ?? []), item]);
      });
    return [...map.entries()];
  }, [items]);

  if (!groups.length) {
    return (
      <ScrollView contentContainerStyle={styles.body}>
        <EmptyState icon="calendar-clear-outline" title="No calendar entries" text="There are no entries for this month." />
      </ScrollView>
    );
  }

  const today = todayIstKey();

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {groups.map(([date, rows]) => {
        const { day, month } = parseDateKey(date);
        const weekday = WEEKDAYS[dateKeyToUtc(date).getUTCDay()];
        const isToday = date === today;
        return (
          <View key={date} style={styles.group}>
            <View
              accessible
              accessibilityLabel={`${weekday} ${day} ${MONTHS[month - 1]}`}
              style={[styles.badge, isToday && styles.badgeToday]}
            >
              <Text style={[styles.badgeWeekday, isToday && styles.badgeTodayText]}>{weekday}</Text>
              <Text style={[styles.badgeDay, isToday && styles.badgeTodayText]}>{day}</Text>
              <Text style={[styles.badgeMonth, isToday && styles.badgeTodayText]}>{MONTHS[month - 1]}</Text>
            </View>

            <View style={styles.items}>
              {rows.map(item => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => onOpenItem(item)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={[styles.bar, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} />
                  <View style={styles.main}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.whenRow}>
                      <Ionicons name="time-outline" size={13} color={colors.muted} />
                      <Text style={styles.when}>{whenLabel(item)}</Text>
                    </View>
                    <View style={styles.tags}>
                      <CategoryTag category={item.category} />
                      {item.status ? <StatusTag status={item.status} /> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 18 },
  group: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },

  badge: { width: 56, paddingVertical: 8, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  badgeToday: { backgroundColor: colors.primary, borderColor: colors.primary },
  badgeWeekday: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  badgeDay: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  badgeMonth: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  badgeTodayText: { color: colors.white },

  items: { flex: 1, minWidth: 0, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
  cardPressed: { backgroundColor: '#F7F9FC' },
  bar: { alignSelf: 'stretch', width: 4, borderRadius: 2 },
  main: { flex: 1, minWidth: 0, gap: 6 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  when: { color: colors.muted, fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
