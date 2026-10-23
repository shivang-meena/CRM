// // apps/client/src/calendar/CalendarItemDetailsModal.tsx
// import React, { useState } from 'react';
// import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import ConfirmDialog from '@/components/ConfirmDialog';
// import Button from '@/components/Button';
// import { errorMessage } from '@/api/client';
// import { colors } from '@/theme/colors';
// import { CALENDAR_CATEGORY_COLORS, CALENDAR_CATEGORY_LABELS, CalendarItem } from '@/types/calendar';
// import { formatCalendarDate, formatCalendarTime, itemRangeLabel } from './calendarDates';

// type Props = { item: CalendarItem | null; onClose: () => void; onEdit: (item: CalendarItem) => void; onDelete: (item: CalendarItem) => Promise<void> };

// export default function CalendarItemDetailsModal({ item, onClose, onEdit, onDelete }: Props) {
//   const router = useRouter(); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
//   if (!item) return null;
//   const currentItem = item;
//   const sourceLabel = currentItem.source === 'CALENDAR_EVENT' ? 'Calendar event' : currentItem.source === 'LEAD_FOLLOWUP' ? 'Lead follow-up' : currentItem.source === 'REMINDER' ? 'Reminder' : 'Meeting';
//   function openSource() { if (currentItem.leadId) { router.push({ pathname: '/lead/[id]', params: { id: currentItem.leadId, section: currentItem.source === 'LEAD_FOLLOWUP' ? 'followups' : currentItem.source === 'REMINDER' ? 'reminders' : 'meetings' } }); } else if (currentItem.source === 'REMINDER') router.push('/reminders'); else if (currentItem.source === 'MEETING') router.push('/meetings'); }
//   async function remove() { setBusy(true); setError(''); try { await onDelete(currentItem); setConfirm(false); onClose(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); } }
//   return <><Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.modal}><View style={styles.header}><Text style={styles.title}>Calendar Details</Text><Pressable accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={21} color={colors.primaryText} /></Pressable></View><ScrollView contentContainerStyle={styles.body}><View style={styles.titleRow}><View style={[styles.dot, { backgroundColor: CALENDAR_CATEGORY_COLORS[currentItem.category] }]} /><Text style={styles.eventTitle}>{currentItem.title}</Text></View><Detail label="Category" value={CALENDAR_CATEGORY_LABELS[currentItem.category]} /><Detail label="Source" value={sourceLabel} /><Detail label="When" value={currentItem.allDay ? itemRangeLabel(currentItem) : currentItem.endAt ? itemRangeLabel(currentItem) : `${formatCalendarDate(currentItem.startAt)} ${formatCalendarTime(currentItem.startAt)}`} /><Detail label="Status" value={currentItem.status ?? '—'} /><Detail label="Description" value={currentItem.description || '—'} />{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.footer}>{currentItem.editable ? <><Button title="Edit" variant="outline" onPress={() => onEdit(currentItem)} /><Button title="Delete" variant="danger" onPress={() => setConfirm(true)} /></> : currentItem.source !== 'CALENDAR_EVENT' ? <Button title="Open source" variant="outline" onPress={openSource} /> : null}<Button title="Close" onPress={onClose} /></View></View></View></Modal><ConfirmDialog visible={confirm} title="Delete calendar event?" message="This event will be archived and removed from the calendar." loading={busy} onCancel={() => setConfirm(false)} onConfirm={() => { void remove(); }} /></>;
// }

// function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
// const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 14 }, modal: { width: '100%', maxWidth: 560, maxHeight: '88%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' }, header: { backgroundColor: colors.primary, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.primaryText, fontSize: 16, fontWeight: '800' }, body: { padding: 16, gap: 13 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 10, height: 10, borderRadius: 5 }, eventTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800' }, detail: { gap: 4 }, label: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, value: { color: colors.text, fontSize: 13 }, error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 9, borderRadius: 6, fontSize: 12 }, footer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 9, flexWrap: 'wrap' } });

// apps/client/src/calendar/CalendarItemDetailsModal.tsx
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/Button';
import { errorMessage } from '@/api/client';
import { colors } from '@/theme/colors';
import { CALENDAR_CATEGORY_COLORS, CalendarItem } from '@/types/calendar';
import { formatCalendarDate, formatCalendarTime, itemRangeLabel } from './calendarDates';
import { CategoryTag, IconName, SOFT, SURFACE, prettyStatus, tint } from './calendarUi';

type Props = { item: CalendarItem | null; onClose: () => void; onEdit: (item: CalendarItem) => void; onDelete: (item: CalendarItem) => Promise<void> };

export default function CalendarItemDetailsModal({ item, onClose, onEdit, onDelete }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!item) return null;
  const currentItem = item;
  const color = CALENDAR_CATEGORY_COLORS[currentItem.category];
  const sourceLabel = currentItem.source === 'CALENDAR_EVENT' ? 'Calendar event' : currentItem.source === 'LEAD_FOLLOWUP' ? 'Lead follow-up' : currentItem.source === 'REMINDER' ? 'Reminder' : 'Meeting';

  function openSource() {
    if (currentItem.leadId) {
      router.push({ pathname: '/lead/[id]', params: { id: currentItem.leadId, section: currentItem.source === 'LEAD_FOLLOWUP' ? 'followups' : currentItem.source === 'REMINDER' ? 'reminders' : 'meetings' } });
    } else if (currentItem.source === 'REMINDER') router.push('/reminders');
    else if (currentItem.source === 'MEETING') router.push('/meetings');
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await onDelete(currentItem);
      setConfirm(false);
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const when = currentItem.allDay
    ? itemRangeLabel(currentItem)
    : currentItem.endAt
      ? itemRangeLabel(currentItem)
      : `${formatCalendarDate(currentItem.startAt)} ${formatCalendarTime(currentItem.startAt)}`;

  return (
    <>
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Calendar Details</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose} hitSlop={8} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
              <View style={[styles.hero, { backgroundColor: tint(color, '14'), borderLeftColor: color }]}>
                <Text style={styles.eventTitle}>{currentItem.title}</Text>
                <View style={styles.tags}>
                  <CategoryTag category={currentItem.category} />
                  <View style={styles.sourceTag}><Text style={styles.sourceText}>{sourceLabel}</Text></View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <InfoRow icon="time-outline" label="When" value={when} />
                <View style={styles.rowDivider} />
                <InfoRow icon="flag-outline" label="Status" value={currentItem.status ? prettyStatus(currentItem.status) : '—'} />
                <View style={styles.rowDivider} />
                <InfoRow icon="document-text-outline" label="Description" value={currentItem.description || '—'} />
              </View>

              {error ? (
                <View accessibilityRole="alert" style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              {currentItem.editable ? (
                <>
                  <Button title="Edit" variant="outline" onPress={() => onEdit(currentItem)} />
                  <Button title="Delete" variant="danger" onPress={() => setConfirm(true)} />
                </>
              ) : currentItem.source !== 'CALENDAR_EVENT' ? (
                <Button title="Open source" variant="outline" onPress={openSource} />
              ) : null}
              <Button title="Close" onPress={onClose} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirm}
        title="Delete calendar event?"
        message="This event will be archived and removed from the calendar."
        loading={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => { void remove(); }}
      />
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={16} color={colors.primaryText} /></View>
      <View style={styles.infoText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 14 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '88%', backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 40px rgba(14,27,61,0.24)' },

  header: { backgroundColor: colors.primary, paddingVertical: 14, paddingLeft: 20, paddingRight: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },

  body: { padding: 20, gap: 16 },
  hero: { gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderLeftWidth: 5, borderRadius: 14 },
  eventTitle: { color: colors.text, fontSize: 19, fontWeight: '800', lineHeight: 25 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  sourceTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: SOFT },
  sourceText: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  infoCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: SURFACE, paddingHorizontal: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  infoText: { flex: 1, minWidth: 0, gap: 3 },
  rowDivider: { height: 1, backgroundColor: colors.border },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  value: { color: colors.text, fontSize: 14, lineHeight: 20 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 10, backgroundColor: colors.dangerSoft },
  error: { flex: 1, color: colors.danger, fontSize: 12.5 },

  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
});
