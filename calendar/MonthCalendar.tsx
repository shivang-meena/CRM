// // apps/client/src/calendar/MonthCalendar.tsx
// import React from 'react';
// import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
// import { colors } from '@/theme/colors';
// import { CALENDAR_CATEGORY_COLORS, CalendarItem } from '@/types/calendar';
// import { firstDayOfMonth, monthGridKeys, parseDateKey, overlapsIstDay, todayIstKey } from './calendarDates';

// type Props = { month: string; items: CalendarItem[]; selectedDate: string; onSelectDate: (date: string) => void; onOpenItem: (item: CalendarItem) => void; onMore: (date: string) => void };

// export default function MonthCalendar({ month, items, selectedDate, onSelectDate, onOpenItem, onMore }: Props) {
//   const { height: viewportHeight } = useWindowDimensions(); const today = todayIstKey(); const first = firstDayOfMonth(month); const days = monthGridKeys(month); const rowCount = days.length / 7; const cellHeight = Math.max(68, Math.floor((viewportHeight - 170) / rowCount)); const compact = cellHeight < 100;
//   return <ScrollView horizontal style={styles.scroll} showsHorizontalScrollIndicator contentContainerStyle={styles.scrollContent}><View style={styles.calendar}>
//     <View style={styles.weekHeader}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
//     <View style={styles.grid}>{days.map(date => { const dateItems = items.filter(item => overlapsIstDay(item, date)).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key)); const visibleItems = dateItems.slice(0, compact ? 2 : 3); const { day } = parseDateKey(date); const outside = !date.startsWith(first.slice(0, 7)); return <View key={date} style={[styles.cell, { height: cellHeight }, outside && styles.outside, date === today && styles.todayCell, date === selectedDate && styles.selectedCell]}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${date}`} onPress={() => onSelectDate(date)} style={styles.dayButton}><Text style={[styles.dayNumber, outside && styles.outsideText, date === today && styles.todayText]}>{day}</Text></Pressable><View style={[styles.events, compact && styles.compactEvents]}>{visibleItems.map(item => <Pressable key={item.key} accessibilityRole="button" onPress={() => onOpenItem(item)} style={[styles.chip, compact && styles.compactChip, { borderLeftColor: CALENDAR_CATEGORY_COLORS[item.category] }]}><Text numberOfLines={1} style={[styles.chipText, compact && styles.compactChipText]}>{item.title}</Text></Pressable>)}{dateItems.length > visibleItems.length ? <Pressable accessibilityRole="button" onPress={() => onMore(date)}><Text style={[styles.more, compact && styles.compactMore]}>+{dateItems.length - visibleItems.length} more</Text></Pressable> : null}</View></View>;})}</View>
//   </View></ScrollView>;
// }

// const styles = StyleSheet.create({ scroll: { width: '100%', minWidth: '100%', flex: 1 }, scrollContent: { width: '100%', minWidth: '100%' }, calendar: { width: '100%', minWidth: 0, flex: 1 }, weekHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }, weekDay: { width: '14.2857%', paddingVertical: 9, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.2857%', minHeight: 0, overflow: 'hidden', borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.border, padding: 6, backgroundColor: colors.white }, outside: { backgroundColor: '#FAFBFD' }, todayCell: { backgroundColor: '#F2F7FF' }, selectedCell: { borderColor: colors.primary, borderWidth: 1 }, dayButton: { alignSelf: 'flex-start', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4 }, dayNumber: { color: colors.text, fontSize: 12, fontWeight: '800' }, outsideText: { color: '#A5AEC0' }, todayText: { color: colors.primaryText }, events: { gap: 4, marginTop: 6 }, compactEvents: { gap: 2, marginTop: 3 }, chip: { borderLeftWidth: 3, backgroundColor: '#F4F6FA', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 4 }, compactChip: { paddingVertical: 2 }, chipText: { color: colors.text, fontSize: 10, fontWeight: '600' }, compactChipText: { fontSize: 9 }, more: { color: colors.primaryText, fontSize: 10, fontWeight: '800', paddingVertical: 2 }, compactMore: { fontSize: 9, paddingVertical: 1 } });


// apps/client/src/calendar/MonthCalendar.tsx
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CalendarItem } from '@/types/calendar';
import { firstDayOfMonth, formatCalendarTime, monthGridKeys, parseDateKey, overlapsIstDay, todayIstKey } from './calendarDates';
import { TODAY_TINT, tint } from './calendarUi';

type Props = { month: string; items: CalendarItem[]; selectedDate: string; onSelectDate: (date: string) => void; onOpenItem: (item: CalendarItem) => void; onMore: (date: string) => void };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEADER_HEIGHT = 40;
const MIN_CELL_HEIGHT = 72;
const DOT_MODE_WIDTH = 64; // cells narrower than this (phones) show dots instead of text chips
const TIME_IN_CHIP_WIDTH = 112;

export default function MonthCalendar({ month, items, selectedDate, onSelectDate, onOpenItem, onMore }: Props) {
  const { height: viewportHeight } = useWindowDimensions();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const today = todayIstKey();
  const first = firstDayOfMonth(month);
  const days = monthGridKeys(month);
  const rowCount = days.length / 7;

  // Cells fill the space that is really available; the old window-based estimate is only a first-paint fallback.
  const available = size.height > 0
    ? Math.floor((size.height - HEADER_HEIGHT) / rowCount)
    : Math.floor((viewportHeight - 170) / rowCount);
  const cellHeight = Math.max(MIN_CELL_HEIGHT, available);
  const cellWidth = size.width > 0 ? size.width / 7 : 100;
  const dotMode = cellWidth < DOT_MODE_WIDTH;
  const showTime = cellWidth >= TIME_IN_CHIP_WIDTH;
  const maxChips = dotMode ? 3 : Math.max(1, Math.min(4, Math.floor((cellHeight - 36 - 16) / 22)));

  return (
    <View style={styles.calendar} onLayout={(event) => setSize(event.nativeEvent.layout)}>
      <View style={styles.weekHeader}>
        {WEEKDAYS.map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {days.map(date => {
            const dateItems = items
              .filter(item => overlapsIstDay(item, date))
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime() || a.key.localeCompare(b.key));
            const visibleItems = dateItems.slice(0, maxChips);
            const hiddenCount = dateItems.length - visibleItems.length;
            const { day } = parseDateKey(date);
            const outside = !date.startsWith(first.slice(0, 7));
            const isToday = date === today;
            const isSelected = date === selectedDate;

            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`Open ${date}`}
                onPress={() => onSelectDate(date)}
                style={[
                  styles.cell,
                  { height: cellHeight },
                  dotMode && styles.cellCentered,
                  outside && styles.outside,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
              >
                <View style={[styles.dayBadge, dotMode && styles.dayBadgeCentered, isToday && styles.dayBadgeToday]}>
                  <Text style={[styles.dayNumber, outside && styles.outsideText, isToday && styles.todayText]}>{day}</Text>
                </View>

                {dotMode ? (
                  dateItems.length ? (
                    <View style={styles.dots}>
                      {visibleItems.map(item => <View key={item.key} style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[item.category] }]} />)}
                      {hiddenCount > 0 ? <Text style={styles.dotMore}>+{hiddenCount}</Text> : null}
                    </View>
                  ) : null
                ) : (
                  <View style={styles.events}>
                    {visibleItems.map(item => {
                      const color = CALENDAR_CATEGORY_COLORS[item.category];
                      return (
                        <Pressable
                          key={item.key}
                          accessibilityRole="button"
                          accessibilityLabel={item.title}
                          onPress={() => onOpenItem(item)}
                          style={({ pressed }) => [styles.chip, { backgroundColor: tint(color, pressed ? '33' : '1A'), borderLeftColor: color }]}
                        >
                          <Text numberOfLines={1} style={styles.chipText}>
                            {showTime && !item.allDay ? <Text style={styles.chipTime}>{formatCalendarTime(item.startAt)} </Text> : null}
                            {item.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {hiddenCount > 0 ? (
                      <Pressable accessibilityRole="button" onPress={() => onMore(date)}>
                        <Text style={styles.more}>+{hiddenCount} more</Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { flex: 1, minWidth: 0, minHeight: 0 },
  scroll: { flex: 1 },
  weekHeader: { height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#FAFBFD' },
  weekDay: { width: '14.2857%', textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  cell: { width: '14.2857%', minHeight: 0, overflow: 'hidden', borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.border, padding: 6, backgroundColor: colors.white },
  cellCentered: { alignItems: 'center', paddingHorizontal: 2 },
  outside: { backgroundColor: '#FAFBFD' },
  todayCell: { backgroundColor: TODAY_TINT },
  selectedCell: { borderWidth: 1, borderColor: colors.primary, zIndex: 1 },

  dayBadge: { alignSelf: 'flex-start', minWidth: 26, height: 26, paddingHorizontal: 4, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayBadgeCentered: { alignSelf: 'center' },
  dayBadgeToday: { backgroundColor: colors.primary },
  dayNumber: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  outsideText: { color: '#A5AEC0' },
  todayText: { color: colors.primaryText },

  events: { gap: 3, marginTop: 5 },
  chip: { borderLeftWidth: 3, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  chipText: { color: colors.text, fontSize: 10.5, fontWeight: '600' },
  chipTime: { color: colors.muted, fontWeight: '700' },
  more: { color: colors.primaryText, fontSize: 10.5, fontWeight: '800', paddingVertical: 2, paddingHorizontal: 2 },

  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotMore: { color: colors.muted, fontSize: 9, fontWeight: '800' },
});