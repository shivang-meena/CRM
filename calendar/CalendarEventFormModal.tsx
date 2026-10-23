// // apps/client/src/calendar/CalendarEventFormModal.tsx
// import React, { useEffect, useState } from 'react';
// import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Button from '@/components/Button';
// import DateTimePickerModal from '@/components/DateTimePickerModal';
// import { errorMessage } from '@/api/client';
// import { colors } from '@/theme/colors';
// import { CalendarEventInput, CalendarItem } from '@/types/calendar';
// import { addDays, dateKeyToIstMidnightIso, dateTimeKeyToIstIso, formatCalendarTime, parseDateKey, todayIstKey } from './calendarDates';

// type Props = { visible: boolean; selectedDate: string; event: CalendarItem | null; onClose: () => void; onSave: (data: CalendarEventInput) => Promise<void> };
// type FormState = { title: string; category: CalendarEventInput['category']; description: string; allDay: boolean; startDate: string; endDate: string; startTime: string; endTime: string };
// const requestKey = () => `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
// const pickerValue = (date: string, time: string) => { const { year, month, day } = parseDateKey(date); return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year} ${time}`; };
// const parsePicker = (value: string) => { const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}:\d{2})$/.exec(value); return match ? { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] } : null; };
// const initial = (selectedDate: string, event: CalendarItem | null): FormState => {
//   if (!event) return { title: '', category: 'EVENT', description: '', allDay: false, startDate: selectedDate, endDate: selectedDate, startTime: '10:00', endTime: '11:00' };
//   const startDate = todayIstKey(new Date(event.startAt)); const endDate = event.endAt ? todayIstKey(new Date(event.endAt)) : startDate;
//   return { title: event.title, category: event.category as CalendarEventInput['category'], description: event.description ?? '', allDay: event.allDay, startDate, endDate: event.allDay ? addDays(endDate, -1) : endDate, startTime: formatCalendarTime(event.startAt), endTime: event.endAt ? formatCalendarTime(event.endAt) : '11:00' };
// };

// export default function CalendarEventFormModal({ visible, selectedDate, event, onClose, onSave }: Props) {
//   const [form, setForm] = useState<FormState>(() => initial(selectedDate, event)); const [picker, setPicker] = useState<'startDate' | 'endDate' | 'startTime' | 'endTime' | null>(null); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
//   useEffect(() => { if (visible) { setForm(initial(selectedDate, event)); setPicker(null); setError(''); } }, [visible, selectedDate, event]);
//   const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(old => ({ ...old, [key]: value }));
//   async function save() {
//     if (!form.title.trim()) return setError('Title is required.');
//     if (form.endDate < form.startDate) return setError('End date must be on or after start date.');
//     const startAt = form.allDay ? dateKeyToIstMidnightIso(form.startDate) : dateTimeKeyToIstIso(form.startDate, form.startTime);
//     const endAt = form.allDay ? dateKeyToIstMidnightIso(addDays(form.endDate, 1)) : dateTimeKeyToIstIso(form.endDate, form.endTime);
//     if (new Date(endAt) <= new Date(startAt)) return setError('End must be after start.');
//     setSaving(true); setError('');
//     try { await onSave({ title: form.title.trim(), category: form.category, description: form.description.trim() || null, startAt, endAt, allDay: form.allDay, timezone: 'Asia/Kolkata', ...(event ? { version: event.version ?? 1 } : { requestKey: requestKey() }) }); onClose(); } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
//   }
//   const pickerDate = picker === 'endDate' || picker === 'endTime' ? form.endDate : form.startDate; const pickerTime = picker === 'startTime' ? form.startTime : picker === 'endTime' ? form.endTime : '12:00';
//   return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onClose()}><View style={styles.overlay}><View style={styles.modal}><View style={styles.header}><Text style={styles.headerTitle}>{event ? 'Edit Calendar Event' : 'Add Calendar Event'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close event form" disabled={saving} onPress={onClose}><Ionicons name="close" size={21} color={colors.primaryText} /></Pressable></View><ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
//     <Field label="Title *" value={form.title} onChangeText={value => set('title', value)} />
//     <View style={styles.field}><Text style={styles.label}>Category</Text><View style={styles.chips}>{(['EVENT', 'HOLIDAY', 'SERVICE'] as CalendarEventInput['category'][]).map(value => <Pressable key={value} onPress={() => set('category', value)} style={[styles.chip, form.category === value && styles.chipActive]}><Text style={[styles.chipText, form.category === value && styles.chipTextActive]}>{value[0] + value.slice(1).toLowerCase()}</Text></Pressable>)}</View></View>
//     <Field label="Description" value={form.description} onChangeText={value => set('description', value)} multiline />
//     <Pressable accessibilityRole="switch" accessibilityState={{ checked: form.allDay }} onPress={() => set('allDay', !form.allDay)} style={styles.toggleRow}><View style={[styles.toggle, form.allDay && styles.toggleActive]}><View style={[styles.knob, form.allDay && styles.knobActive]} /></View><Text style={styles.toggleText}>All day</Text></Pressable>
//     <DateField label="Start date" value={form.startDate} onPress={() => setPicker('startDate')} /><DateField label="End date" value={form.endDate} onPress={() => setPicker('endDate')} />
//     {!form.allDay ? <View style={styles.row}><View style={styles.half}><DateField label="Start time" value={form.startTime} onPress={() => setPicker('startTime')} time /></View><View style={styles.half}><DateField label="End time" value={form.endTime} onPress={() => setPicker('endTime')} time /></View></View> : <Text style={styles.helper}>The end date is inclusive and will be stored as the next day at IST midnight.</Text>}
//     {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
//   </ScrollView><View style={styles.footer}><Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} /><Button title={event ? 'Save Changes' : 'Save Event'} onPress={() => { void save(); }} loading={saving} /></View></View></View><DateTimePickerModal visible={!!picker} value={picker ? pickerValue(pickerDate, pickerTime) : ''} title={picker?.includes('Time') ? 'Choose Time' : picker === 'endDate' ? 'Choose End Date' : 'Choose Start Date'} onSelect={value => { const parsed = parsePicker(value); if (!parsed || !picker) return; if (picker === 'startDate' || picker === 'endDate') set(picker, parsed.date); else set(picker, parsed.time); setPicker(null); }} onClose={() => setPicker(null)} /></Modal>;
// }

// function Field({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={[styles.input, multiline && styles.multiline]} multiline={multiline} placeholderTextColor={colors.muted} /></View>; }
// function DateField({ label, value, onPress, time = false }: { label: string; value: string; onPress: () => void; time?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable onPress={onPress} style={styles.dateField}><Ionicons name={time ? 'time-outline' : 'calendar-outline'} size={17} color={colors.primaryText} /><Text style={styles.dateText}>{value}</Text></Pressable></View>; }
// const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 14 }, modal: { width: '100%', maxWidth: 600, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' }, header: { backgroundColor: colors.primary, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerTitle: { color: colors.primaryText, fontSize: 16, fontWeight: '800' }, body: { padding: 16, gap: 13 }, field: { gap: 5 }, label: { color: colors.text, fontSize: 12, fontWeight: '800' }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: 7, minHeight: 42, paddingHorizontal: 11, paddingVertical: 9, color: colors.text }, multiline: { minHeight: 82, textAlignVertical: 'top' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, paddingVertical: 8 }, chipActive: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: colors.primaryText }, toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, toggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: '#DCE3F0', padding: 3 }, toggleActive: { backgroundColor: colors.accent }, knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white }, knobActive: { alignSelf: 'flex-end' }, toggleText: { color: colors.text, fontSize: 13, fontWeight: '700' }, row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, dateField: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, dateText: { color: colors.text, fontSize: 13, fontWeight: '600' }, helper: { color: colors.muted, fontSize: 11 }, error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 9, borderRadius: 6, fontSize: 12 }, footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 9 } });


// apps/client/src/calendar/CalendarEventFormModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import { errorMessage } from '@/api/client';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CalendarEventInput, CalendarItem } from '@/types/calendar';
import { addDays, dateKeyToIstMidnightIso, dateTimeKeyToIstIso, formatCalendarTime, formatDateKey, parseDateKey, todayIstKey } from './calendarDates';
import { SURFACE, tint } from './calendarUi';

type Props = { visible: boolean; selectedDate: string; event: CalendarItem | null; onClose: () => void; onSave: (data: CalendarEventInput) => Promise<void> };
type FormState = { title: string; category: CalendarEventInput['category']; description: string; allDay: boolean; startDate: string; endDate: string; startTime: string; endTime: string };

const DANGER_SOFT = '#FFF1F0';
const requestKey = () => `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
const pickerValue = (date: string, time: string) => { const { year, month, day } = parseDateKey(date); return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year} ${time}`; };
const parsePicker = (value: string) => { const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}:\d{2})$/.exec(value); return match ? { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] } : null; };
const initial = (selectedDate: string, event: CalendarItem | null): FormState => {
  if (!event) return { title: '', category: 'EVENT', description: '', allDay: false, startDate: selectedDate, endDate: selectedDate, startTime: '10:00', endTime: '11:00' };
  const startDate = todayIstKey(new Date(event.startAt)); const endDate = event.endAt ? todayIstKey(new Date(event.endAt)) : startDate;
  return { title: event.title, category: event.category as CalendarEventInput['category'], description: event.description ?? '', allDay: event.allDay, startDate, endDate: event.allDay ? addDays(endDate, -1) : endDate, startTime: formatCalendarTime(event.startAt), endTime: event.endAt ? formatCalendarTime(event.endAt) : '11:00' };
};

export default function CalendarEventFormModal({ visible, selectedDate, event, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => initial(selectedDate, event));
  const [picker, setPicker] = useState<'startDate' | 'endDate' | 'startTime' | 'endTime' | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setForm(initial(selectedDate, event)); setPicker(null); setError(''); } }, [visible, selectedDate, event]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(old => ({ ...old, [key]: value }));

  async function save() {
    if (!form.title.trim()) return setError('Title is required.');
    if (form.endDate < form.startDate) return setError('End date must be on or after start date.');
    const startAt = form.allDay ? dateKeyToIstMidnightIso(form.startDate) : dateTimeKeyToIstIso(form.startDate, form.startTime);
    const endAt = form.allDay ? dateKeyToIstMidnightIso(addDays(form.endDate, 1)) : dateTimeKeyToIstIso(form.endDate, form.endTime);
    if (new Date(endAt) <= new Date(startAt)) return setError('End must be after start.');
    setSaving(true); setError('');
    try {
      await onSave({ title: form.title.trim(), category: form.category, description: form.description.trim() || null, startAt, endAt, allDay: form.allDay, timezone: 'Asia/Kolkata', ...(event ? { version: event.version ?? 1 } : { requestKey: requestKey() }) });
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const pickerDate = picker === 'endDate' || picker === 'endTime' ? form.endDate : form.startDate;
  const pickerTime = picker === 'startTime' ? form.startTime : picker === 'endTime' ? form.endTime : '12:00';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !saving && onClose()}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{event ? 'Edit Calendar Event' : 'Add Calendar Event'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close event form" disabled={saving} onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Field label="Title *" value={form.title} onChangeText={value => set('title', value)} />

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chips}>
                {(['EVENT', 'HOLIDAY', 'SERVICE'] as CalendarEventInput['category'][]).map(value => {
                  const active = form.category === value;
                  const color = CALENDAR_CATEGORY_COLORS[value];
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => set('category', value)}
                      style={[styles.chip, active && { backgroundColor: tint(color, '1A'), borderColor: color }]}
                    >
                      <View style={[styles.chipDot, { backgroundColor: color }]} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{value[0] + value.slice(1).toLowerCase()}</Text>
                      {active ? <Ionicons name="checkmark" size={14} color={color} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Field label="Description" value={form.description} onChangeText={value => set('description', value)} multiline />

            {/* Everything about "when" lives in one panel */}
            <View style={styles.panel}>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: form.allDay }} onPress={() => set('allDay', !form.allDay)} style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="sunny-outline" size={17} color={colors.muted} />
                  <Text style={styles.toggleText}>All day</Text>
                </View>
                <View style={[styles.toggle, form.allDay && styles.toggleActive]}><View style={[styles.knob, form.allDay && styles.knobActive]} /></View>
              </Pressable>

              <View style={styles.row}>
                <View style={styles.half}><DateField label="Start date" value={form.startDate} onPress={() => setPicker('startDate')} /></View>
                <View style={styles.half}><DateField label="End date" value={form.endDate} onPress={() => setPicker('endDate')} /></View>
              </View>

              {!form.allDay ? (
                <View style={styles.row}>
                  <View style={styles.half}><DateField label="Start time" value={form.startTime} onPress={() => setPicker('startTime')} time /></View>
                  <View style={styles.half}><DateField label="End time" value={form.endTime} onPress={() => setPicker('endTime')} time /></View>
                </View>
              ) : (
                <View style={styles.helperRow}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
                  <Text style={styles.helper}>The end date is inclusive and will be stored as the next day at IST midnight.</Text>
                </View>
              )}
            </View>

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Cancel" variant="outline" onPress={onClose} disabled={saving} />
            <Button title={event ? 'Save Changes' : 'Save Event'} onPress={() => { void save(); }} loading={saving} />
          </View>
        </View>
      </View>

      <DateTimePickerModal
        visible={!!picker}
        value={picker ? pickerValue(pickerDate, pickerTime) : ''}
        title={picker?.includes('Time') ? 'Choose Time' : picker === 'endDate' ? 'Choose End Date' : 'Choose Start Date'}
        onSelect={value => {
          const parsed = parsePicker(value);
          if (!parsed || !picker) return;
          if (picker === 'startDate' || picker === 'endDate') set(picker, parsed.date); else set(picker, parsed.time);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </Modal>
  );
}

function Field({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, multiline && styles.multiline, focused && styles.inputFocused]}
        multiline={multiline}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function DateField({ label, value, onPress, time = false }: { label: string; value: string; onPress: () => void; time?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${time ? value : formatDateKey(value)}`} onPress={onPress} style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}>
        <Ionicons name={time ? 'time-outline' : 'calendar-outline'} size={17} color={colors.primaryText} />
        <Text style={styles.dateText}>{time ? value : formatDateKey(value)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 14 },
  modal: { width: '100%', maxWidth: 600, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 40px rgba(14,27,61,0.24)' },

  header: { backgroundColor: colors.primary, paddingVertical: 14, paddingLeft: 20, paddingRight: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },

  body: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, backgroundColor: colors.white },
  inputFocused: { borderColor: colors.primary },
  multiline: { minHeight: 88, textAlignVertical: 'top' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.white },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: colors.text },

  panel: { padding: 14, gap: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: SURFACE },
  toggleRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#DCE3F0', padding: 3 },
  toggleActive: { backgroundColor: colors.accent },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  knobActive: { alignSelf: 'flex-end' },

  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minWidth: 0 },
  dateField: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white },
  dateFieldPressed: { backgroundColor: '#F3F4F8' },
  dateText: { color: colors.text, fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
  helperRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  helper: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 10, backgroundColor: colors.dangerSoft ?? DANGER_SOFT },
  error: { flex: 1, color: colors.danger, fontSize: 12.5 },

  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});