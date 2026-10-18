import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { CalendarView } from '@/types/calendar';

type Props = { heading: string; view: CalendarView; onView: (view: CalendarView) => void; onPrevious: () => void; onNext: () => void; onToday: () => void };

export default function CalendarToolbar({ heading, view, onView, onPrevious, onNext, onToday }: Props) {
  return <View style={styles.toolbar}>
    <View style={styles.navigation}><Pressable accessibilityRole="button" accessibilityLabel="Previous calendar period" onPress={onPrevious} style={styles.iconButton}><Ionicons name="chevron-back" size={18} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next calendar period" onPress={onNext} style={styles.iconButton}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable><Text style={styles.heading}>{heading}</Text><Pressable accessibilityRole="button" onPress={onToday} style={styles.today}><Text style={styles.todayText}>Today</Text></Pressable></View>
    <View style={styles.views}>{(['month', 'day', 'list'] as CalendarView[]).map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: view === option }} onPress={() => onView(option)} style={[styles.viewButton, view === option && styles.viewButtonActive]}><Text style={[styles.viewText, view === option && styles.viewTextActive]}>{option[0].toUpperCase() + option.slice(1)}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({ toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap' }, navigation: { flexDirection: 'row', alignItems: 'center', gap: 6 }, iconButton: { width: 32, height: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginHorizontal: 8 }, today: { borderWidth: 1, borderColor: colors.primary, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7 }, todayText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' }, views: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 7, overflow: 'hidden' }, viewButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white }, viewButtonActive: { backgroundColor: colors.primary }, viewText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, viewTextActive: { color: colors.primaryText } });
