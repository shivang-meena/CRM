// // apps/client/src/calendar/CalendarFilters.tsx
// import React from 'react';
// import { Pressable, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Button from '@/components/Button';
// import { colors } from '@/theme/colors';
// import { CALENDAR_CATEGORIES, CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarCategory } from '@/types/calendar';

// type Props = { selected: CalendarCategory[]; onToggle: (category: CalendarCategory) => void; onAdd: () => void };

// export default function CalendarFilters({ selected, onToggle, onAdd }: Props) {
//   return <View style={styles.panel}><Button title="+ Add Event" onPress={onAdd} /><Text style={styles.title}>Show</Text>{CALENDAR_CATEGORIES.map(category => { const checked = selected.includes(category); return <Pressable key={category} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onToggle(category)} style={styles.filter}><View style={[styles.checkbox, checked && { backgroundColor: CALENDAR_CATEGORY_COLORS[category], borderColor: CALENDAR_CATEGORY_COLORS[category] }]}>{checked ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}</View><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[category] }]} /><Text style={[styles.label, !checked && styles.disabled]}>{CALENDAR_CATEGORY_LABELS[category]}</Text></Pressable>;})}</View>;
// }

// const styles = StyleSheet.create({ panel: { width: 190, padding: 12, gap: 10, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.white }, title: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 8 }, filter: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8 }, checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, dot: { width: 8, height: 8, borderRadius: 4 }, label: { color: colors.text, fontSize: 13, fontWeight: '600' }, disabled: { color: colors.muted } });


// apps/client/src/calendar/CalendarFilters.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORIES, CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarCategory } from '@/types/calendar';
import { tint } from './calendarUi';

type Props = {
  selected: CalendarCategory[];
  onToggle: (category: CalendarCategory) => void;
  onAdd: () => void;
  layout?: 'sidebar' | 'bar'; // presentation only: 'bar' is used on narrow screens
};

export default function CalendarFilters({ selected, onToggle, onAdd, layout = 'sidebar' }: Props) {
  if (layout === 'bar') {
    return (
      <View style={styles.bar}>
        <Button title="+ Add Event" onPress={onAdd} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barScroll} contentContainerStyle={styles.barContent}>
          {CALENDAR_CATEGORIES.map(category => {
            const checked = selected.includes(category);
            const color = CALENDAR_CATEGORY_COLORS[category];
            return (
              <Pressable
                key={category}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => onToggle(category)}
                style={[styles.pill, checked && { backgroundColor: tint(color, '1A'), borderColor: tint(color, '66') }]}
              >
                <View style={[styles.pillDot, checked ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color }]} />
                <Text style={[styles.pillText, !checked && styles.muted]}>{CALENDAR_CATEGORY_LABELS[category]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Button title="+ Add Event" onPress={onAdd} />
      <View style={styles.divider} />
      <Text style={styles.title}>Show</Text>
      {CALENDAR_CATEGORIES.map(category => {
        const checked = selected.includes(category);
        const color = CALENDAR_CATEGORY_COLORS[category];
        return (
          <Pressable
            key={category}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => onToggle(category)}
            style={({ pressed }) => [styles.filter, pressed && styles.filterPressed]}
          >
            <View style={[styles.checkbox, { borderColor: color }, checked && { backgroundColor: color }]}>
              {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
            <Text style={[styles.label, !checked && styles.muted]}>{CALENDAR_CATEGORY_LABELS[category]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Sidebar */
  panel: { width: 228, alignSelf: 'flex-start', padding: 14, gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white, boxShadow: '0 4px 14px rgba(11,47,125,0.07)' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  title: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 4, marginLeft: 6 },
  filter: { minHeight: 40, paddingHorizontal: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterPressed: { backgroundColor: '#F3F4F8' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  muted: { color: colors.muted },

  /* Compact bar */
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  barScroll: { flex: 1 },
  barContent: { alignItems: 'center', gap: 8, paddingRight: 12 },
  pill: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pillDot: { width: 9, height: 9, borderRadius: 5 },
  pillText: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
});