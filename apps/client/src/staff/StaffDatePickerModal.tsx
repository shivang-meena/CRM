import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface Props {
  visible: boolean;
  value: string;
  title: string;
  allowClear?: boolean;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const pad = (value: number) => String(value).padStart(2, '0');

export function StaffDatePickerModal({ visible, value, title, allowClear = false, onSelect, onClose }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(new Date().getDate());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [yearPage, setYearPage] = useState(2020);

  useEffect(() => {
    if (!visible) return;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const initialYear = match ? Number(match[1]) : new Date().getFullYear();
    const initialMonth = match ? Number(match[2]) - 1 : new Date().getMonth();
    const initialDay = match ? Number(match[3]) : new Date().getDate();
    setYear(initialYear);
    setMonth(initialMonth);
    setDay(initialDay);
    setYearPage(MIN_YEAR + Math.floor((initialYear - MIN_YEAR) / 12) * 12);
    setView('days');
  }, [visible, value]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells = useMemo(() => [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `empty-${index}`, value: null as number | null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, value: index + 1 })),
  ], [daysInMonth, firstWeekday]);

  function chooseYear(nextYear: number) {
    setYear(nextYear);
    setYearPage(MIN_YEAR + Math.floor((nextYear - MIN_YEAR) / 12) * 12);
    setView('days');
  }

  function confirm() {
    const safeDay = Math.min(day, daysInMonth);
    onSelect(`${year}-${pad(month + 1)}-${pad(safeDay)}`);
    onClose();
  }

  const yearOptions = Array.from({ length: 12 }, (_, index) => yearPage + index).filter(item => item <= MAX_YEAR);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="calendar-outline" size={19} color={colors.white} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.selected}>{`${pad(day)} ${MONTHS[month]} ${year}`}</Text>
          </View>

          <View style={styles.body}>
            {view === 'days' ? <>
              <View style={styles.calendarHeader}>
                <Pressable accessibilityRole="button" accessibilityLabel="Choose month" accessibilityState={{ expanded: false }} onPress={() => setView('months')} style={styles.headingSelect}>
                  <Text style={styles.headingText}>{MONTHS[month]}</Text><Ionicons name="chevron-down" size={15} color={colors.primaryText} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Choose year" accessibilityState={{ expanded: false }} onPress={() => { setYearPage(MIN_YEAR + Math.floor((year - MIN_YEAR) / 12) * 12); setView('years'); }} style={styles.headingSelect}>
                  <Text style={styles.headingText}>{year}</Text><Ionicons name="chevron-down" size={15} color={colors.primaryText} />
                </Pressable>
              </View>
              <View style={styles.weekRow}>{WEEKDAYS.map(name => <Text key={name} style={styles.weekday}>{name}</Text>)}</View>
              <View style={styles.daysGrid}>{cells.map(cell => cell.value === null
                ? <View key={cell.key} style={styles.dayCell} />
                : <Pressable key={cell.key} accessibilityRole="button" accessibilityLabel={`${MONTHS[month]} ${cell.value}, ${year}`} accessibilityState={{ selected: day === cell.value }} onPress={() => setDay(cell.value!)} style={[styles.dayCell, day === cell.value && styles.dayActive]}>
                  <Text style={[styles.dayText, day === cell.value && styles.dayTextActive]}>{cell.value}</Text>
                </Pressable>)}</View>
            </> : view === 'months' ? <>
              <Text style={styles.viewTitle}>Choose month · {year}</Text>
              <View style={styles.optionGrid}>{MONTHS.map((name, index) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: month === index }} onPress={() => { setMonth(index); setView('days'); }} style={[styles.monthOption, month === index && styles.optionActive]}>
                <Text style={[styles.optionText, month === index && styles.optionTextActive]}>{name.slice(0, 3)}</Text>
              </Pressable>)}</View>
            </> : <>
              <View style={styles.yearNav}>
                <Pressable accessibilityRole="button" accessibilityLabel="Previous years" disabled={yearPage <= MIN_YEAR} onPress={() => setYearPage(current => Math.max(MIN_YEAR, current - 12))} style={styles.navButton}><Ionicons name="chevron-back" size={18} color={colors.primaryText} /></Pressable>
                <Text style={styles.viewTitle}>{yearPage}–{Math.min(yearPage + 11, MAX_YEAR)}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Next years" disabled={yearPage + 12 > MAX_YEAR} onPress={() => setYearPage(current => Math.min(MAX_YEAR - 11, current + 12))} style={styles.navButton}><Ionicons name="chevron-forward" size={18} color={colors.primaryText} /></Pressable>
              </View>
              <ScrollView style={styles.yearScroll} contentContainerStyle={styles.optionGrid}>
                {yearOptions.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: year === option }} onPress={() => chooseYear(option)} style={[styles.yearOption, year === option && styles.optionActive]}>
                  <Text style={[styles.optionText, year === option && styles.optionTextActive]}>{option}</Text>
                </Pressable>)}
              </ScrollView>
            </>}
          </View>

          <View style={styles.footer}>
            {allowClear ? <Pressable accessibilityRole="button" onPress={() => { onSelect(''); onClose(); }} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable> : <View style={{ flex: 1 }} />}
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={confirm} style={styles.doneButton}><Text style={styles.doneText}>Select date</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.overlay },
  dialog: { width: '100%', maxWidth: 390, maxHeight: '92%', overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  header: { padding: 16, backgroundColor: colors.primaryText, gap: 7 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.white, fontSize: 15, fontWeight: '800' },
  selected: { color: colors.white, opacity: 0.85, fontSize: 12 },
  body: { minHeight: 315, padding: 16, gap: 16 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  headingSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7, backgroundColor: colors.accentSoft },
  headingText: { color: colors.primaryText, fontSize: 15, fontWeight: '800' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekday: { width: '14.285%', textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 },
  dayCell: { width: '14.285%', height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  dayActive: { backgroundColor: colors.primaryText },
  dayText: { color: colors.text, fontSize: 13 },
  dayTextActive: { color: colors.white, fontWeight: '800' },
  viewTitle: { color: colors.text, textAlign: 'center', fontWeight: '800', fontSize: 14 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  monthOption: { width: '30%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 7 },
  yearOption: { width: '22%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 7 },
  optionActive: { backgroundColor: colors.primaryText, borderColor: colors.primaryText },
  optionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  optionTextActive: { color: colors.white },
  yearNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
  yearScroll: { maxHeight: 270 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  clearButton: { paddingHorizontal: 8, paddingVertical: 9 },
  clearText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 7 },
  cancelText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  doneButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.primaryText, borderRadius: 7 },
  doneText: { color: colors.white, fontWeight: '700', fontSize: 12 },
});
