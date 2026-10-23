// // apps/client/src/calendar/CalendarToolbar.tsx
// import React from 'react';
// import { Pressable, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { colors } from '@/theme/colors';
// import { CalendarView } from '@/types/calendar';

// type Props = { heading: string; view: CalendarView; onView: (view: CalendarView) => void; onPrevious: () => void; onNext: () => void; onToday: () => void };

// export default function CalendarToolbar({ heading, view, onView, onPrevious, onNext, onToday }: Props) {
//   return <View style={styles.toolbar}>
//     <View style={styles.navigation}><Pressable accessibilityRole="button" accessibilityLabel="Previous calendar period" onPress={onPrevious} style={styles.iconButton}><Ionicons name="chevron-back" size={18} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next calendar period" onPress={onNext} style={styles.iconButton}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable><Text style={styles.heading}>{heading}</Text><Pressable accessibilityRole="button" onPress={onToday} style={styles.today}><Text style={styles.todayText}>Today</Text></Pressable></View>
//     <View style={styles.views}>{(['month', 'day', 'list'] as CalendarView[]).map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: view === option }} onPress={() => onView(option)} style={[styles.viewButton, view === option && styles.viewButtonActive]}><Text style={[styles.viewText, view === option && styles.viewTextActive]}>{option[0].toUpperCase() + option.slice(1)}</Text></Pressable>)}</View>
//   </View>;
// }

// const styles = StyleSheet.create({ toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap' }, navigation: { flexDirection: 'row', alignItems: 'center', gap: 6 }, iconButton: { width: 32, height: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginHorizontal: 8 }, today: { borderWidth: 1, borderColor: colors.primary, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7 }, todayText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' }, views: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 7, overflow: 'hidden' }, viewButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white }, viewButtonActive: { backgroundColor: colors.primary }, viewText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, viewTextActive: { color: colors.primaryText } });


// apps/client/src/calendar/CalendarToolbar.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { CalendarView } from '@/types/calendar';
import { IconName, SOFT } from './calendarUi';

type Props = { heading: string; view: CalendarView; onView: (view: CalendarView) => void; onPrevious: () => void; onNext: () => void; onToday: () => void };

const VIEW_OPTIONS: { key: CalendarView; icon: IconName }[] = [
  { key: 'month', icon: 'grid-outline' },
  { key: 'day', icon: 'today-outline' },
  { key: 'list', icon: 'list-outline' },
];

export default function CalendarToolbar({ heading, view, onView, onPrevious, onNext, onToday }: Props) {
  const [width, setWidth] = useState(0);
  const compact = width > 0 && width < 640;

  const arrows = (
    <View style={styles.arrows}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous calendar period" onPress={onPrevious} style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>
      <View style={styles.arrowDivider} />
      <Pressable accessibilityRole="button" accessibilityLabel="Next calendar period" onPress={onNext} style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>
    </View>
  );

  const todayButton = (
    <Pressable accessibilityRole="button" accessibilityLabel="Go to today" onPress={onToday} style={({ pressed }) => [styles.today, pressed && styles.pressed]}>
      <Text style={styles.todayText}>Today</Text>
    </Pressable>
  );

  const views = (
    <View style={[styles.views, compact && styles.viewsCompact]}>
      {VIEW_OPTIONS.map(({ key, icon }) => {
        const active = view === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onView(key)}
            style={[styles.viewButton, compact && styles.viewButtonCompact, active && styles.viewButtonActive]}
          >
            <Ionicons name={icon} size={14} color={active ? colors.primaryText : colors.muted} />
            <Text style={[styles.viewText, active && styles.viewTextActive]}>{key[0].toUpperCase() + key.slice(1)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.toolbar} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {compact ? (
        <>
          <View style={styles.row}>
            <Text accessibilityRole="header" numberOfLines={1} style={[styles.heading, styles.headingFlex]}>{heading}</Text>
            {todayButton}
          </View>
          <View style={styles.row}>
            {arrows}
            {views}
          </View>
        </>
      ) : (
        <View style={styles.row}>
          {arrows}
          <Text accessibilityRole="header" numberOfLines={1} style={[styles.heading, styles.headingFlex]}>{heading}</Text>
          {todayButton}
          {views}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  heading: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headingFlex: { flex: 1, minWidth: 0 },

  arrows: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.white },
  arrow: { width: 38, height: 36, alignItems: 'center', justifyContent: 'center' },
  arrowDivider: { width: 1, height: 20, backgroundColor: colors.border },
  pressed: { backgroundColor: '#F3F4F8' },

  today: { height: 36, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  todayText: { color: colors.primaryText, fontSize: 13, fontWeight: '700' },

  views: { flexDirection: 'row', padding: 3, gap: 2, borderRadius: 12, backgroundColor: SOFT },
  viewsCompact: { flex: 1 },
  viewButton: { height: 30, paddingHorizontal: 12, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewButtonCompact: { flex: 1, paddingHorizontal: 6 },
  viewButtonActive: { backgroundColor: colors.primary },
  viewText: { color: colors.muted, fontSize: 12.5, fontWeight: '700' },
  viewTextActive: { color: colors.white },
});
