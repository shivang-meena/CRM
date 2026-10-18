import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORIES, CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarCategory } from '@/types/calendar';

type Props = { selected: CalendarCategory[]; onToggle: (category: CalendarCategory) => void; onAdd: () => void };

export default function CalendarFilters({ selected, onToggle, onAdd }: Props) {
  return <View style={styles.panel}><Button title="+ Add Event" onPress={onAdd} /><Text style={styles.title}>Show</Text>{CALENDAR_CATEGORIES.map(category => { const checked = selected.includes(category); return <Pressable key={category} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onToggle(category)} style={styles.filter}><View style={[styles.checkbox, checked && { backgroundColor: CALENDAR_CATEGORY_COLORS[category], borderColor: CALENDAR_CATEGORY_COLORS[category] }]}>{checked ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}</View><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[category] }]} /><Text style={[styles.label, !checked && styles.disabled]}>{CALENDAR_CATEGORY_LABELS[category]}</Text></Pressable>;})}</View>;
}

const styles = StyleSheet.create({ panel: { width: 190, padding: 12, gap: 10, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.white }, title: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 8 }, filter: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8 }, checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, dot: { width: 8, height: 8, borderRadius: 4 }, label: { color: colors.text, fontSize: 13, fontWeight: '600' }, disabled: { color: colors.muted } });
