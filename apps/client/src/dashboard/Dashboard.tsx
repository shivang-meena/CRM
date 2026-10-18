import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useDashboardActivities } from '@/hooks/useLeadActivities';
import { useDashboardStandaloneTasks, useTaskActions, useTaskLabels, useTaskSummary } from '@/hooks/useTasks';
import { Task as StandaloneTask } from '@/types/task';
import { ActivityRecord } from '@/types/leadActivities';
import { errorMessage } from '@/api/client';
import { crmDayRange, formatDateTime } from '@/utils/format';
import type { LeadStatus } from '@/types/lead';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/Button';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { colors } from '@/theme/colors';
import DashboardPanel, { dashboardColors as palette, IconName } from './DashboardPanel';
import DashboardComposer from './DashboardComposer';
import useDashboardEntries from './useDashboardEntries';
import { completionPercent, DashboardEntry, isOnDay, ScheduleKind } from './model';

const leadTabs: { key: LeadStatus; label: string }[] = [
  { key: 'NEW', label: 'New' }, { key: 'PROCESSING', label: 'Processing' }, { key: 'CLOSE_BY', label: 'Close-by' },
];
const scheduleTabs: ScheduleKind[] = ['Reminder', 'Meeting', 'Events'];

function SummaryCard({ title, icon, count, completed, color, soft, progressLabel, change }: {
  title: string; icon: IconName; count: number | null; completed: number; color: string; soft: string;
  progressLabel: string; change?: number | null;
}) {
  const percent = completionPercent(completed, count ?? 0);
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={23} color={color} /></View>
        <View style={styles.summaryHeading}><Text style={styles.summaryLabel}>{title}</Text><Text style={styles.summaryValue}>{count === null ? '—' : count}</Text></View>
        <View style={styles.watermark}><Ionicons name={icon} size={39} color={soft} /></View>
      </View>
      <View style={styles.summaryMeta}>
        <View style={[styles.badge, { backgroundColor: soft }]}><Text style={[styles.badgeText, { color }]}>{count === null ? 'Unavailable' : change !== undefined
          ? change === null ? 'New activity' : `${Math.abs(change).toFixed(2)} % ${change < 0 ? 'Decrease' : 'Increase'}` : `${completed} Completed`}</Text></View>
        <Text style={styles.comparison}>{change !== undefined ? 'vs Yesterday' : count === null ? '—' : count}</Text>
      </View>
      <View style={styles.progressLabels}><Text style={styles.progressLabel}>{progressLabel}</Text><Text style={[styles.progressValue, { color }]}>{count === null ? '—' : `${percent.toFixed(2)} %`}</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel={progressLabel} accessibilityValue={{ min: 0, max: 100, now: percent }} style={[styles.progressTrack, { backgroundColor: soft }]}>
        <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function IconButton({ label, icon, onPress, disabled }: { label: string; icon: IconName; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, disabled && styles.disabled]}><Ionicons name={icon} size={18} color={palette.purple} /></Pressable>;
}

export default function Dashboard() {
  const router = useRouter();
  const { userName } = useAuth();
  const query = useLeads('');
  const store = useDashboardEntries(userName);
  const taskActions = useTaskActions();
  const taskLabelsQuery = useTaskLabels();
  const [contentWidth, setContentWidth] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [leadTab, setLeadTab] = useState<LeadStatus>('NEW');
  const [scheduleTab, setScheduleTab] = useState<ScheduleKind>('Reminder');
  const [taskTab, setTaskTab] = useState('Today');
  const [composer, setComposer] = useState<{ kind: DashboardEntry['kind']; entry?: DashboardEntry } | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<DashboardEntry | null>(null);
  const [standaloneTaskFormOpen, setStandaloneTaskFormOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Asia/Kolkata day boundaries for Today and Tomorrow
  const todayRange = crmDayRange(now);
  const tomorrowIST = new Date(now.getTime() + 86400000);
  const tomorrowRange = crmDayRange(tomorrowIST);

  // Backend lead activities queries
  const todayFollowUpsQuery = useDashboardActivities('followups', { from: todayRange.from, to: todayRange.to });
  const todayTasksQuery = useDashboardActivities('tasks', { from: todayRange.from, to: todayRange.to });
  const tomorrowTasksQuery = useDashboardActivities('tasks', { from: tomorrowRange.from, to: tomorrowRange.to });
  const standaloneTodayQuery = useDashboardStandaloneTasks({ from: todayRange.from, to: todayRange.to });
  const standaloneTomorrowQuery = useDashboardStandaloneTasks({ from: tomorrowRange.from, to: tomorrowRange.to });
  const standaloneTodaySummaryQuery = useTaskSummary({ from: todayRange.from, to: todayRange.to });
  const standaloneTomorrowSummaryQuery = useTaskSummary({ from: tomorrowRange.from, to: tomorrowRange.to });
  const backendRemindersQuery = useDashboardActivities('reminders', { status: 'PENDING' });
  const backendMeetingsQuery = useDashboardActivities('meetings', { status: 'SCHEDULED' });

  const leads = query.data ?? [];
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const todaysLeads = leads.filter((lead) => isOnDay(lead.createdAt, now));
  const yesterdayCount = leads.filter((lead) => isOnDay(lead.createdAt, yesterday)).length;
  const change = yesterdayCount === 0 ? (todaysLeads.length ? null : 0) : (todaysLeads.length - yesterdayCount) / yesterdayCount * 100;

  // Local storage personal entries
  const localTasks = store.entries.filter((entry) => entry.kind === 'task');
  const localTodaysTasks = localTasks.filter((entry) => isOnDay(entry.date, now));
  const localTomorrowTasks = localTasks.filter((entry) => isOnDay(entry.date, tomorrow));
  const localNotes = store.entries.filter((entry) => entry.kind === 'note');
  const localSchedules = store.entries.filter((entry) => entry.kind === scheduleTab).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  // Server task items
  const serverTodayTasks = todayTasksQuery.data?.items ?? [];
  const serverTomorrowTasks = tomorrowTasksQuery.data?.items ?? [];
  const standaloneTodayTasks = standaloneTodayQuery.data?.items ?? [];
  const standaloneTomorrowTasks = standaloneTomorrowQuery.data?.items ?? [];

  // Summary card counts combining server and local
  const followUpCount = todayFollowUpsQuery.isLoading ? null : (todayFollowUpsQuery.data?.total ?? 0);
  const followUpCompleted = todayFollowUpsQuery.data?.completed ?? 0;

  const totalTasksCount = (store.ready ? localTodaysTasks.length : 0) + (todayTasksQuery.data?.total ?? 0) + (standaloneTodaySummaryQuery.data?.total ?? 0);
  const totalTasksCompleted = localTodaysTasks.filter((entry) => entry.completed).length + (todayTasksQuery.data?.completed ?? 0) + (standaloneTodaySummaryQuery.data?.status.find(item => item.status === 'COMPLETED')?.total ?? 0);

  const ready = store.ready && !store.saving;
  const wide = contentWidth >= 760;
  const loadedLeads = !query.isLoading && !query.isError;

  async function saveEntry(entry: DashboardEntry) {
    const saved = await store.save([entry, ...store.entries.filter((item) => item.id !== entry.id)]);
    if (saved && entry.kind !== 'note' && entry.kind !== 'task') setScheduleTab(entry.kind);
    return saved;
  }

  async function saveStandaloneTask(data: Record<string, unknown>) {
    await taskActions.create.mutateAsync(data);
    setStandaloneTaskFormOpen(false);
  }

  function entryRow(entry: DashboardEntry) {
    return (
      <View key={entry.id} style={styles.entryRow}>
        {entry.kind === 'task' ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Complete ${entry.text}`}
            accessibilityState={{ checked: entry.completed, disabled: !ready }}
            disabled={!ready}
            onPress={() => { void saveEntry({ ...entry, completed: !entry.completed }); }}
            style={styles.iconButton}
          >
            <Ionicons name={entry.completed ? 'checkbox' : 'square-outline'} size={20} color={palette.purple} />
          </Pressable>
        ) : (
          <Ionicons name={entry.kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'} size={18} color={palette.purple} />
        )}
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, entry.completed && styles.completedText]}>{entry.text}</Text>
          <Text style={styles.rowMeta}>{formatDateTime(entry.date)} • Personal</Text>
        </View>
        <IconButton label={`Edit ${entry.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: entry.kind, entry })} />
        <IconButton label={`Delete ${entry.text}`} icon="trash-outline" disabled={!ready} onPress={() => setDeleteEntry(entry)} />
      </View>
    );
  }

  function backendEntryRow(item: ActivityRecord, kind: 'task' | 'Reminder' | 'Meeting') {
    return (
      <Pressable
        key={`backend-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title} for ${item.independent ? 'standalone activity' : item.lead?.name ?? 'lead'}`}
        onPress={() => item.independent
          ? router.push(kind === 'Reminder' ? '/reminders' : '/meetings')
          : item.leadId ? router.push({
            pathname: '/lead/[id]',
            params: {
              id: item.leadId,
              section: kind === 'task' ? 'tasks' : kind === 'Reminder' ? 'reminders' : 'meetings',
            },
          }) : undefined}
        style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
      >
        <Ionicons
          name={kind === 'task' ? 'checkbox-outline' : kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'}
          size={18}
          color={palette.purple}
        />
        <View style={styles.rowContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            {item.lead?.name ? (
              <View style={styles.leadTag}>
                <Text style={styles.leadTagText}>{item.lead.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowMeta}>
            {formatDateTime(item.scheduledAt ?? item.dueAt ?? item.remindAt ?? item.startAt)} • Lead Activity
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
      </Pressable>
    );
  }

  function standaloneEntryRow(item: StandaloneTask) {
    return (
      <Pressable
        key={`standalone-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.subject}`}
        onPress={() => router.push({ pathname: '/tasks', params: { taskId: item.id } })}
        style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
      >
        <Ionicons name="checkbox-outline" size={18} color={palette.purple} />
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{item.subject}</Text>
          <Text style={styles.rowMeta}>{formatDateTime(item.endAt)} • Standalone Task</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.page} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
      <View style={styles.topbar}>
        <Text accessibilityRole="header" style={styles.heading}>Dashboard</Text>
        <View style={styles.topbarActions}>
          <Button title="+ Add Task" onPress={() => setStandaloneTaskFormOpen(true)} />
          <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); void todayFollowUpsQuery.refetch(); void todayTasksQuery.refetch(); void standaloneTodayQuery.refetch(); void standaloneTodaySummaryQuery.refetch(); setNow(new Date()); }} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={17} color={palette.purple} />
            <Text style={styles.link}>Refresh</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || todayFollowUpsQuery.isRefetching || standaloneTodayQuery.isRefetching}
            onRefresh={() => { void query.refetch(); void todayFollowUpsQuery.refetch(); void todayTasksQuery.refetch(); void standaloneTodayQuery.refetch(); void standaloneTodaySummaryQuery.refetch(); setNow(new Date()); }}
            tintColor={palette.purple}
          />
        }
      >
        {query.isError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load leads: {errorMessage(query.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); }}><Text style={styles.link}>Retry</Text></Pressable>
          </View>
        ) : null}
        {todayFollowUpsQuery.isError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load lead activities: {errorMessage(todayFollowUpsQuery.error)}</Text>
          </View>
        ) : null}
        {store.error ? <Text accessibilityRole="alert" style={styles.errorText}>{store.error}</Text> : null}

        {/* Top 3 Summary Cards */}
        <View style={[styles.summaryRow, !wide && styles.stacked]}>
          <SummaryCard
            title="Today's Leads"
            icon="funnel-outline"
            count={loadedLeads ? todaysLeads.length : null}
            completed={todaysLeads.filter((lead) => lead.status === 'CONFIRM').length}
            color="#13BD37"
            soft="#E9F8ED"
            progressLabel="Completed Lead"
            change={change}
          />
          <SummaryCard
            title="Today's Followups"
            icon="paper-plane-outline"
            count={followUpCount}
            completed={followUpCompleted}
            color="#FF242F"
            soft="#FFEEEE"
            progressLabel="Completed Followup"
          />
          <SummaryCard
            title="Today's Tasks"
            icon="calendar-outline"
            count={todayTasksQuery.isLoading && !store.ready ? null : totalTasksCount}
            completed={totalTasksCompleted}
            color="#FF8A1C"
            soft="#FFF2E8"
            progressLabel="Completed Task"
          />
        </View>

        {/* Middle Row: Leads & Schedules */}
        <View style={[styles.panelRow, !wide && styles.stacked]}>
          <View style={styles.panelColumn}>
            <DashboardPanel
              title="Leads"
              icon="funnel-outline"
              selected={leadTab}
              onSelect={(key) => setLeadTab(key as LeadStatus)}
              tabs={leadTabs.map((tab) => ({ ...tab, count: leads.filter((lead) => lead.status === tab.key).length }))}
              empty={!leads.filter((lead) => lead.status === leadTab).length}
              loading={query.isLoading}
              emptyMessage={query.isError ? 'Leads are unavailable. Please retry.' : 'There Are No Leads to Display'}
            >
              {leads.filter((lead) => lead.status === leadTab).map((lead) => (
                <Pressable
                  key={lead.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open lead ${lead.name}`}
                  onPress={() => router.push({ pathname: '/lead/[id]', params: { id: lead.id } })}
                  style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>{lead.name}</Text>
                    <Text style={styles.rowMeta}>{lead.companyName || lead.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
                </Pressable>
              ))}
            </DashboardPanel>
          </View>

          <View style={styles.panelColumn}>
            <DashboardPanel
              title="Schedules"
              icon="notifications-outline"
              selected={scheduleTab}
              onSelect={(key) => setScheduleTab(key as ScheduleKind)}
              tabs={scheduleTabs.map((key) => {
                const localCount = store.entries.filter((entry) => entry.kind === key).length;
                const serverCount = key === 'Reminder'
                  ? (backendRemindersQuery.data?.total ?? 0)
                  : key === 'Meeting'
                  ? (backendMeetingsQuery.data?.total ?? 0)
                  : 0;
                return { key, label: key, count: localCount + serverCount };
              })}
              action={<IconButton label="Add schedule" icon="add-outline" disabled={!ready} onPress={() => setComposer({ kind: scheduleTab })} />}
              empty={
                !localSchedules.length &&
                (scheduleTab !== 'Reminder' || !backendRemindersQuery.data?.items?.length) &&
                (scheduleTab !== 'Meeting' || !backendMeetingsQuery.data?.items?.length)
              }
              loading={!store.ready && !store.error}
              emptyMessage="There Are No Schedules to Display"
            >
              {/* Server Reminders */}
              {scheduleTab === 'Reminder'
                ? (backendRemindersQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Reminder'))
                : null}

              {/* Server Meetings */}
              {scheduleTab === 'Meeting'
                ? (backendMeetingsQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Meeting'))
                : null}

              {/* Local Storage Schedules */}
              {localSchedules.map(entryRow)}
            </DashboardPanel>
          </View>
        </View>

        {/* Tasks Section (Today / Tomorrow with Lead Tasks + Personal Tasks) */}
        <View style={[styles.taskColumn, wide && styles.halfWidth]}>
          <DashboardPanel
            title="Tasks"
            icon="calendar-outline"
            selected={taskTab}
            onSelect={setTaskTab}
            tabs={['Today', 'Tomorrow'].map((key) => {
              const localCount = localTasks.filter((entry) => isOnDay(entry.date, key === 'Today' ? now : tomorrow)).length;
              const serverCount = key === 'Today' ? (todayTasksQuery.data?.total ?? 0) + (standaloneTodaySummaryQuery.data?.total ?? 0) : (tomorrowTasksQuery.data?.total ?? 0) + (standaloneTomorrowSummaryQuery.data?.total ?? 0);
              return { key, label: key, count: localCount + serverCount };
            })}
            action={<IconButton label="Add task" icon="add-outline" disabled={!ready} onPress={() => setComposer({ kind: 'task' })} />}
            empty={
                (taskTab === 'Today' ? !localTodaysTasks.length && !serverTodayTasks.length && !standaloneTodayTasks.length : !localTomorrowTasks.length && !serverTomorrowTasks.length && !standaloneTomorrowTasks.length)
            }
            loading={!store.ready && !store.error && (todayTasksQuery.isLoading || standaloneTodayQuery.isLoading || standaloneTodaySummaryQuery.isLoading)}
            emptyMessage="There Are No Tasks to Display"
          >
            {/* Server Lead Tasks */}
            {taskTab === 'Today'
              ? serverTodayTasks.map((t) => backendEntryRow(t, 'task'))
              : serverTomorrowTasks.map((t) => backendEntryRow(t, 'task'))}

            {taskTab === 'Today'
              ? standaloneTodayTasks.map(standaloneEntryRow)
              : standaloneTomorrowTasks.map(standaloneEntryRow)}

            {/* Local Tasks */}
            {(taskTab === 'Today' ? localTodaysTasks : localTomorrowTasks).map(entryRow)}
          </DashboardPanel>
        </View>

        {/* Sticky Notes */}
        <DashboardPanel
          title="Sticky Notes"
          icon="bookmark-outline"
          fullWidth
          empty={!localNotes.length}
          loading={!store.ready && !store.error}
          emptyMessage="There Are No Sticky Notes to Display"
          action={
            <Pressable accessibilityRole="button" accessibilityLabel="Add note" disabled={!ready} onPress={() => setComposer({ kind: 'note' })} style={[styles.addNote, !ready && styles.disabled]}>
              <Ionicons name="add-outline" size={14} color="#FFFFFF" /><Text style={styles.addNoteText}>Add Note</Text>
            </Pressable>
          }
        >
          <View style={styles.notesGrid}>
            {localNotes.map((note) => (
              <View key={note.id} style={[styles.note, !wide && styles.noteMobile]}>
                <Text style={styles.noteText}>{note.text}</Text>
                <View style={styles.noteActions}>
                  <IconButton label={`Edit note ${note.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: 'note', entry: note })} />
                  <IconButton label={`Delete note ${note.text}`} icon="trash-outline" disabled={!ready} onPress={() => setDeleteEntry(note)} />
                </View>
              </View>
            ))}
          </View>
        </DashboardPanel>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>COPYRIGHT © {now.getFullYear()} <Text style={styles.footerBrand}>Shivora CRM</Text>, All rights Reserved</Text>
      </View>

      {composer ? (
        <DashboardComposer
          key={composer.entry?.id ?? composer.kind}
          kind={composer.kind}
          entry={composer.entry}
          defaultDate={composer.kind === 'task' && taskTab === 'Tomorrow' ? tomorrow : now}
          onSave={saveEntry}
          onClose={() => setComposer(null)}
        />
      ) : null}

      <TaskFormModal
        visible={standaloneTaskFormOpen}
        task={null}
        userName={userName}
        labels={taskLabelsQuery.data ?? []}
        onClose={() => setStandaloneTaskFormOpen(false)}
        onSave={saveStandaloneTask}
        onCreateLabel={(name, colour) => taskActions.createLabel.mutateAsync({ name, colour })}
      />

      <ConfirmDialog
        visible={!!deleteEntry}
        title={`Delete ${deleteEntry?.kind === 'note' ? 'note' : 'item'}?`}
        message="This will remove this item from your dashboard."
        loading={store.saving}
        onCancel={() => setDeleteEntry(null)}
        onConfirm={async () => {
          if (deleteEntry && (await store.save(store.entries.filter((entry) => entry.id !== deleteEntry.id)))) {
            setDeleteEntry(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: '#FFFFFF' },
  heading: { fontSize: 19, fontWeight: '600', color: palette.text },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6 },
  link: { fontSize: 12, color: palette.purple },
  scroll: { flex: 1 },
  content: { padding: 18, gap: 14, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', gap: 20, maxWidth: 840, marginBottom: 10 },
  stacked: { flexDirection: 'column', gap: 14 },
  summaryCard: { flex: 1, padding: 13, minHeight: 144, borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: '#FFFFFF', boxShadow: '0 1px 5px rgba(32, 24, 65, 0.04)' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryIcon: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  summaryHeading: { flex: 1 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: palette.muted },
  summaryValue: { fontSize: 20, fontWeight: '600', color: palette.text, marginTop: 2 },
  watermark: { position: 'absolute', right: 0, top: 0 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17, marginBottom: 16 },
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '600' },
  comparison: { color: '#77737D', fontSize: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  progressLabel: { color: palette.text, fontSize: 12 },
  progressValue: { fontSize: 12 },
  progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: 5, borderRadius: 5 },
  panelRow: { flexDirection: 'row', gap: 20 },
  panelColumn: { flex: 1, minWidth: 0 },
  taskColumn: { width: '100%' },
  halfWidth: { width: '50%', paddingRight: 10 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 7, backgroundColor: '#FFFFFF' },
  rowContent: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13, color: palette.text, fontWeight: '500' },
  rowMeta: { fontSize: 11, color: palette.muted, marginTop: 4 },
  completedText: { textDecorationLine: 'line-through', color: palette.muted },
  leadTag: { backgroundColor: colors.primarySoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  leadTagText: { fontSize: 10, fontWeight: '700', color: colors.primaryText },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0EEF8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.purple, fontWeight: '600' },
  iconButton: { minWidth: 30, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  pressed: { backgroundColor: '#F4F2FA' },
  disabled: { opacity: 0.45 },
  addNote: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: palette.purple },
  addNoteText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  note: { width: 240, minHeight: 130, borderWidth: 1, borderColor: '#EFE5B4', borderRadius: 7, backgroundColor: '#FFFBE5', padding: 14 },
  noteMobile: { width: '100%' },
  noteText: { fontSize: 13, lineHeight: 20, color: palette.text, flex: 1 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  footer: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: '#FFFFFF' },
  footerText: { fontSize: 11, color: '#75717A' },
  footerBrand: { color: palette.purple },
  errorBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: 12, backgroundColor: '#FFF1F0', borderRadius: 7 },
  errorText: { color: '#B3261E', fontSize: 12 },
});
