// // apps/client/src/calendar/CalendarScreen.tsx
// import React, { useMemo, useState } from 'react';
// import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
// import { errorMessage } from '@/api/client';
// import Button from '@/components/Button';
// import { colors } from '@/theme/colors';
// import { useCalendarActions, useCalendarItems } from '@/hooks/useCalendar';
// import { CALENDAR_CATEGORIES, CalendarCategory, CalendarEventInput, CalendarItem, CalendarView } from '@/types/calendar';
// import CalendarFilters from './CalendarFilters';
// import CalendarToolbar from './CalendarToolbar';
// import MonthCalendar from './MonthCalendar';
// import DayCalendar from './DayCalendar';
// import CalendarList from './CalendarList';
// import CalendarEventFormModal from './CalendarEventFormModal';
// import CalendarItemDetailsModal from './CalendarItemDetailsModal';
// import { addDays, addMonths, formatDayHeading, formatMonthHeading, todayIstKey, visibleRange } from './calendarDates';

// export default function CalendarScreen() {
//   const [view, setView] = useState<CalendarView>('month'); const [selectedDate, setSelectedDate] = useState(todayIstKey()); const [selectedCategories, setSelectedCategories] = useState<CalendarCategory[]>([...CALENDAR_CATEGORIES]); const [formOpen, setFormOpen] = useState(false); const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null); const [detailItem, setDetailItem] = useState<CalendarItem | null>(null);
//   const range = useMemo(() => visibleRange(view, selectedDate), [view, selectedDate]); const query = useMemo(() => ({ from: range.from, to: range.to, categories: selectedCategories }), [range.from, range.to, selectedCategories]); const itemsQuery = useCalendarItems(query); const actions = useCalendarActions();
//   const heading = view === 'day' ? formatDayHeading(selectedDate) : formatMonthHeading(selectedDate);
//   function toggleCategory(category: CalendarCategory) { setSelectedCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]); }
//   function navigate(amount: number) { setSelectedDate(current => view === 'day' ? addDays(current, amount) : addMonths(current, amount)); }
//   function openAdd() { setEditingEvent(null); setFormOpen(true); }
//   function openEdit(item: CalendarItem) { setDetailItem(null); setEditingEvent(item); setFormOpen(true); }
//   async function saveEvent(data: CalendarEventInput) { if (editingEvent) await actions.update.mutateAsync({ id: editingEvent.sourceId, data }); else await actions.create.mutateAsync(data); setFormOpen(false); setEditingEvent(null); }
//   async function deleteEvent(item: CalendarItem) { if (!item.version) return; await actions.remove.mutateAsync({ id: item.sourceId, version: item.version }); }
//   const items = itemsQuery.data?.items ?? [];
//   return <View style={styles.container}><View style={styles.layout}><CalendarFilters selected={selectedCategories} onToggle={toggleCategory} onAdd={openAdd} /><View style={styles.main}><CalendarToolbar heading={heading} view={view} onView={setView} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onToday={() => setSelectedDate(todayIstKey())} />{itemsQuery.isLoading && !itemsQuery.data ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.stateText}>Loading calendar…</Text></View> : itemsQuery.isError ? <View style={styles.state}><Text style={styles.error}>{errorMessage(itemsQuery.error)}</Text><Button title="Retry" variant="outline" onPress={() => { void itemsQuery.refetch(); }} /></View> : <>{!items.length ? <Text style={styles.emptyNotice}>No entries match the selected filters.</Text> : null}{view === 'month' ? <MonthCalendar month={selectedDate} items={items} selectedDate={selectedDate} onSelectDate={date => { setSelectedDate(date); setView('day'); }} onMore={date => { setSelectedDate(date); setView('day'); }} onOpenItem={setDetailItem} /> : view === 'day' ? <DayCalendar date={selectedDate} items={items} onOpenItem={setDetailItem} /> : <CalendarList items={items} onOpenItem={setDetailItem} />}</>}</View></View><CalendarEventFormModal visible={formOpen} selectedDate={selectedDate} event={editingEvent} onClose={() => { if (!actions.create.isPending && !actions.update.isPending) { setFormOpen(false); setEditingEvent(null); } }} onSave={saveEvent} /><CalendarItemDetailsModal item={detailItem} onClose={() => setDetailItem(null)} onEdit={openEdit} onDelete={deleteEvent} /></View>;
// }

// const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.canvas }, layout: { flex: 1, flexDirection: 'row', flexWrap: 'nowrap' }, main: { flex: 1, minWidth: 0, minHeight: 0, backgroundColor: colors.white }, state: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20 }, stateText: { color: colors.muted, fontSize: 13 }, error: { color: colors.danger, fontSize: 13, textAlign: 'center' }, emptyNotice: { color: colors.muted, fontSize: 12, paddingHorizontal: 14, paddingTop: 11 } });



// apps/client/src/calendar/CalendarScreen.tsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { colors } from '@/theme/colors';
import { useCalendarActions, useCalendarItems } from '@/hooks/useCalendar';
import { CALENDAR_CATEGORIES, CalendarCategory, CalendarEventInput, CalendarItem, CalendarView } from '@/types/calendar';
import CalendarFilters from './CalendarFilters';
import CalendarToolbar from './CalendarToolbar';
import MonthCalendar from './MonthCalendar';
import DayCalendar from './DayCalendar';
import CalendarList from './CalendarList';
import CalendarEventFormModal from './CalendarEventFormModal';
import CalendarItemDetailsModal from './CalendarItemDetailsModal';
import { addDays, addMonths, formatDayHeading, formatMonthHeading, todayIstKey, visibleRange } from './calendarDates';

const COMPACT_BREAKPOINT = 720;
const DANGER_SOFT = '#FFF1F0';

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(todayIstKey());
  const [selectedCategories, setSelectedCategories] = useState<CalendarCategory[]>([...CALENDAR_CATEGORIES]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null);
  const [detailItem, setDetailItem] = useState<CalendarItem | null>(null);

  const range = useMemo(() => visibleRange(view, selectedDate), [view, selectedDate]);
  const query = useMemo(() => ({ from: range.from, to: range.to, categories: selectedCategories }), [range.from, range.to, selectedCategories]);
  const itemsQuery = useCalendarItems(query);
  const actions = useCalendarActions();
  const heading = view === 'day' ? formatDayHeading(selectedDate) : formatMonthHeading(selectedDate);

  function toggleCategory(category: CalendarCategory) {
    setSelectedCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  }
  function navigate(amount: number) {
    setSelectedDate(current => view === 'day' ? addDays(current, amount) : addMonths(current, amount));
  }
  function openAdd() { setEditingEvent(null); setFormOpen(true); }
  function openEdit(item: CalendarItem) { setDetailItem(null); setEditingEvent(item); setFormOpen(true); }
  async function saveEvent(data: CalendarEventInput) {
    if (editingEvent) await actions.update.mutateAsync({ id: editingEvent.sourceId, data });
    else await actions.create.mutateAsync(data);
    setFormOpen(false);
    setEditingEvent(null);
  }
  async function deleteEvent(item: CalendarItem) {
    if (!item.version) return;
    await actions.remove.mutateAsync({ id: item.sourceId, version: item.version });
  }

  const items = itemsQuery.data?.items ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.layout, compact ? styles.layoutCompact : styles.layoutWide]}>
        <CalendarFilters layout={compact ? 'bar' : 'sidebar'} selected={selectedCategories} onToggle={toggleCategory} onAdd={openAdd} />

        <View style={[styles.main, !compact && styles.mainCard]}>
          <CalendarToolbar
            heading={heading}
            view={view}
            onView={setView}
            onPrevious={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={() => setSelectedDate(todayIstKey())}
          />

          {itemsQuery.isLoading && !itemsQuery.data ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.stateText}>Loading calendar…</Text>
            </View>
          ) : itemsQuery.isError ? (
            <View accessibilityRole="alert" style={styles.state}>
              <View style={styles.errorIcon}><Ionicons name="alert-circle-outline" size={26} color={colors.danger} /></View>
              <Text style={styles.stateTitle}>Couldn't load the calendar</Text>
              <Text style={styles.error}>{errorMessage(itemsQuery.error)}</Text>
              <Button title="Retry" variant="outline" onPress={() => { void itemsQuery.refetch(); }} />
            </View>
          ) : (
            <>
              {!items.length ? (
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
                  <Text style={styles.noticeText}>No entries match the selected filters.</Text>
                </View>
              ) : null}
              {view === 'month' ? (
                <MonthCalendar
                  month={selectedDate}
                  items={items}
                  selectedDate={selectedDate}
                  onSelectDate={date => { setSelectedDate(date); setView('day'); }}
                  onMore={date => { setSelectedDate(date); setView('day'); }}
                  onOpenItem={setDetailItem}
                />
              ) : view === 'day' ? (
                <DayCalendar date={selectedDate} items={items} onOpenItem={setDetailItem} />
              ) : (
                <CalendarList items={items} onOpenItem={setDetailItem} />
              )}
            </>
          )}
        </View>
      </View>

      <CalendarEventFormModal
        visible={formOpen}
        selectedDate={selectedDate}
        event={editingEvent}
        onClose={() => { if (!actions.create.isPending && !actions.update.isPending) { setFormOpen(false); setEditingEvent(null); } }}
        onSave={saveEvent}
      />
      <CalendarItemDetailsModal item={detailItem} onClose={() => setDetailItem(null)} onEdit={openEdit} onDelete={deleteEvent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  layout: { flex: 1 },
  layoutWide: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'stretch', padding: 16, gap: 16 },
  layoutCompact: { flexDirection: 'column' },
  main: { flex: 1, minWidth: 0, minHeight: 0, backgroundColor: colors.white },
  mainCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(11,47,125,0.07)' },
  state: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  stateText: { color: colors.muted, fontSize: 13 },
  stateTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  errorIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: DANGER_SOFT, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginTop: 10, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F7F9FC', alignSelf: 'flex-start' },
  noticeText: { color: colors.muted, fontSize: 12 },
});