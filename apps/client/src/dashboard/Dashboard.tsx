// import React, { useEffect, useState } from 'react';
// import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useAuth } from '@/context/AuthContext';
// import { usePermissions } from '@/hooks/usePermissions';
// import { useLeads } from '@/hooks/useLeads';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { useDashboardActivities } from '@/hooks/useLeadActivities';
// import { useDashboardStandaloneTasks, useTaskActions, useTaskLabels, useTaskSummary } from '@/hooks/useTasks';
// import { Task as StandaloneTask } from '@/types/task';
// import { ActivityRecord } from '@/types/leadActivities';
// import { errorMessage } from '@/api/client';
// import { crmDayRange, formatDateTime } from '@/utils/format';
// import type { LeadStatus } from '@/types/lead';
// import ConfirmDialog from '@/components/ConfirmDialog';
// import Button from '@/components/Button';
// import TaskFormModal from '@/components/tasks/TaskFormModal';
// import { colors } from '@/theme/colors';
// import DashboardPanel, { dashboardColors as palette, IconName } from './DashboardPanel';
// import DashboardComposer from './DashboardComposer';
// import useDashboardEntries from './useDashboardEntries';
// import { completionPercent, DashboardEntry, isOnDay, ScheduleKind } from './model';

// const leadTabs: { key: LeadStatus; label: string }[] = [
//   { key: 'NEW', label: 'New' }, { key: 'PROCESSING', label: 'Processing' }, { key: 'CLOSE_BY', label: 'Close-by' },
// ];
// const scheduleTabs: ScheduleKind[] = ['Reminder', 'Meeting', 'Events'];

// function SummaryCard({ title, icon, count, completed, color, soft, progressLabel, change }: {
//   title: string; icon: IconName; count: number | null; completed: number; color: string; soft: string;
//   progressLabel: string; change?: number | null;
// }) {
//   const percent = completionPercent(completed, count ?? 0);
//   return (
//     <View style={styles.summaryCard}>
//       <View style={styles.summaryTop}>
//         <View style={[styles.summaryIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={23} color={color} /></View>
//         <View style={styles.summaryHeading}><Text style={styles.summaryLabel}>{title}</Text><Text style={styles.summaryValue}>{count === null ? '—' : count}</Text></View>
//         <View style={styles.watermark}><Ionicons name={icon} size={39} color={soft} /></View>
//       </View>
//       <View style={styles.summaryMeta}>
//         <View style={[styles.badge, { backgroundColor: soft }]}><Text style={[styles.badgeText, { color }]}>{count === null ? 'Unavailable' : change !== undefined
//           ? change === null ? 'New activity' : `${Math.abs(change).toFixed(2)} % ${change < 0 ? 'Decrease' : 'Increase'}` : `${completed} Completed`}</Text></View>
//         <Text style={styles.comparison}>{change !== undefined ? 'vs Yesterday' : count === null ? '—' : count}</Text>
//       </View>
//       <View style={styles.progressLabels}><Text style={styles.progressLabel}>{progressLabel}</Text><Text style={[styles.progressValue, { color }]}>{count === null ? '—' : `${percent.toFixed(2)} %`}</Text></View>
//       <View accessibilityRole="progressbar" accessibilityLabel={progressLabel} accessibilityValue={{ min: 0, max: 100, now: percent }} style={[styles.progressTrack, { backgroundColor: soft }]}>
//         <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: color }]} />
//       </View>
//     </View>
//   );
// }

// function IconButton({ label, icon, onPress, disabled }: { label: string; icon: IconName; onPress: () => void; disabled?: boolean }) {
//   return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
//     style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, disabled && styles.disabled]}><Ionicons name={icon} size={18} color={palette.purple} /></Pressable>;
// }

// export default function Dashboard() {
//   const router = useRouter();
//   const { userName } = useAuth();
//   const { canAccess } = usePermissions();
//   const visibleScheduleTabs = scheduleTabs.filter(kind => canAccess(kind === 'Reminder' ? 'reminder' : kind === 'Meeting' ? 'meeting' : 'calendar'));
//   const query = useLeads('');
//   const statusesQuery = useLeadStatuses();
//   const activeLeadStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
//   const currentLeadTabs = activeLeadStatuses.length > 0
//     ? activeLeadStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
//     : leadTabs;

//   const store = useDashboardEntries(userName);
//   const taskActions = useTaskActions();
//   const taskLabelsQuery = useTaskLabels();
//   const [contentWidth, setContentWidth] = useState(0);
//   const [now, setNow] = useState(() => new Date());
//   const [leadTab, setLeadTab] = useState<LeadStatus>('NEW');
//   const [selectedScheduleTab, setScheduleTab] = useState<ScheduleKind>('Reminder');
//   const scheduleTab = visibleScheduleTabs.includes(selectedScheduleTab) ? selectedScheduleTab : visibleScheduleTabs[0] ?? 'Events';
//   const [taskTab, setTaskTab] = useState('Today');
//   const [composer, setComposer] = useState<{ kind: DashboardEntry['kind']; entry?: DashboardEntry } | null>(null);
//   const [deleteEntry, setDeleteEntry] = useState<DashboardEntry | null>(null);
//   const [standaloneTaskFormOpen, setStandaloneTaskFormOpen] = useState(false);

//   useEffect(() => {
//     const timer = setInterval(() => setNow(new Date()), 60000);
//     return () => clearInterval(timer);
//   }, []);

//   // Asia/Kolkata day boundaries for Today and Tomorrow
//   const todayRange = crmDayRange(now);
//   const tomorrowIST = new Date(now.getTime() + 86400000);
//   const tomorrowRange = crmDayRange(tomorrowIST);

//   // Backend lead activities queries
//   const todayFollowUpsQuery = useDashboardActivities('followups', { from: todayRange.from, to: todayRange.to });
//   const todayTasksQuery = useDashboardActivities('tasks', { from: todayRange.from, to: todayRange.to });
//   const tomorrowTasksQuery = useDashboardActivities('tasks', { from: tomorrowRange.from, to: tomorrowRange.to });
//   const standaloneTodayQuery = useDashboardStandaloneTasks({ from: todayRange.from, to: todayRange.to });
//   const standaloneTomorrowQuery = useDashboardStandaloneTasks({ from: tomorrowRange.from, to: tomorrowRange.to });
//   const standaloneTodaySummaryQuery = useTaskSummary({ from: todayRange.from, to: todayRange.to });
//   const standaloneTomorrowSummaryQuery = useTaskSummary({ from: tomorrowRange.from, to: tomorrowRange.to });
//   const backendRemindersQuery = useDashboardActivities('reminders', { status: 'PENDING' });
//   const backendMeetingsQuery = useDashboardActivities('meetings', { status: 'SCHEDULED' });

//   const leads = query.data ?? [];
//   const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
//   const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
//   const todaysLeads = leads.filter((lead) => isOnDay(lead.createdAt, now));
//   const yesterdayCount = leads.filter((lead) => isOnDay(lead.createdAt, yesterday)).length;
//   const change = yesterdayCount === 0 ? (todaysLeads.length ? null : 0) : (todaysLeads.length - yesterdayCount) / yesterdayCount * 100;

//   // Local storage personal entries
//   const localTasks = store.entries.filter((entry) => entry.kind === 'task');
//   const localTodaysTasks = localTasks.filter((entry) => isOnDay(entry.date, now));
//   const localTomorrowTasks = localTasks.filter((entry) => isOnDay(entry.date, tomorrow));
//   const localNotes = store.entries.filter((entry) => entry.kind === 'note');
//   const localSchedules = store.entries.filter((entry) => entry.kind === scheduleTab).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

//   // Server task items
//   const serverTodayTasks = todayTasksQuery.data?.items ?? [];
//   const serverTomorrowTasks = tomorrowTasksQuery.data?.items ?? [];
//   const standaloneTodayTasks = standaloneTodayQuery.data?.items ?? [];
//   const standaloneTomorrowTasks = standaloneTomorrowQuery.data?.items ?? [];

//   // Summary card counts combining server and local
//   const followUpCount = todayFollowUpsQuery.isLoading ? null : (todayFollowUpsQuery.data?.total ?? 0);
//   const followUpCompleted = todayFollowUpsQuery.data?.completed ?? 0;

//   const totalTasksCount = (store.ready ? localTodaysTasks.length : 0) + (todayTasksQuery.data?.total ?? 0) + (standaloneTodaySummaryQuery.data?.total ?? 0);
//   const totalTasksCompleted = localTodaysTasks.filter((entry) => entry.completed).length + (todayTasksQuery.data?.completed ?? 0) + (standaloneTodaySummaryQuery.data?.status.find(item => item.status === 'COMPLETED')?.total ?? 0);

//   const ready = store.ready && !store.saving;
//   const wide = contentWidth >= 760;
//   const loadedLeads = !query.isLoading && !query.isError;
//   const canCompose = (kind: DashboardEntry['kind']) => canAccess(kind === 'Events' ? 'calendar' : kind === 'Reminder' ? 'reminder' : kind === 'Meeting' ? 'meeting' : kind);

//   async function saveEntry(entry: DashboardEntry) {
//     if (!canCompose(entry.kind)) return false;
//     const saved = await store.save([entry, ...store.entries.filter((item) => item.id !== entry.id)]);
//     if (saved && entry.kind !== 'note' && entry.kind !== 'task') setScheduleTab(entry.kind);
//     return saved;
//   }

//   async function saveStandaloneTask(data: Record<string, unknown>) {
//     await taskActions.create.mutateAsync(data);
//     setStandaloneTaskFormOpen(false);
//   }

//   function entryRow(entry: DashboardEntry) {
//     return (
//       <View key={entry.id} style={styles.entryRow}>
//         {entry.kind === 'task' ? (
//           <Pressable
//             accessibilityRole="checkbox"
//             accessibilityLabel={`Complete ${entry.text}`}
//             accessibilityState={{ checked: entry.completed, disabled: !ready }}
//             disabled={!ready}
//             onPress={() => { void saveEntry({ ...entry, completed: !entry.completed }); }}
//             style={styles.iconButton}
//           >
//             <Ionicons name={entry.completed ? 'checkbox' : 'square-outline'} size={20} color={palette.purple} />
//           </Pressable>
//         ) : (
//           <Ionicons name={entry.kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'} size={18} color={palette.purple} />
//         )}
//         <View style={styles.rowContent}>
//           <Text style={[styles.rowTitle, entry.completed && styles.completedText]}>{entry.text}</Text>
//           <Text style={styles.rowMeta}>{formatDateTime(entry.date)} • Personal</Text>
//         </View>
//         <IconButton label={`Edit ${entry.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: entry.kind, entry })} />
//         <IconButton label={`Delete ${entry.text}`} icon="trash-outline" disabled={!ready} onPress={() => setDeleteEntry(entry)} />
//       </View>
//     );
//   }

//   function backendEntryRow(item: ActivityRecord, kind: 'task' | 'Reminder' | 'Meeting') {
//     return (
//       <Pressable
//         key={`backend-${item.id}`}
//         accessibilityRole="button"
//         accessibilityLabel={`Open ${item.title} for ${item.independent ? 'standalone activity' : item.lead?.name ?? 'lead'}`}
//         onPress={() => item.independent || !canAccess('lead')
//           ? router.push(kind === 'task' ? '/tasks' : kind === 'Reminder' ? '/reminders' : '/meetings')
//           : item.leadId ? router.push({
//             pathname: '/lead/[id]',
//             params: {
//               id: item.leadId,
//               section: kind === 'task' ? 'tasks' : kind === 'Reminder' ? 'reminders' : 'meetings',
//             },
//           }) : undefined}
//         style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
//       >
//         <Ionicons
//           name={kind === 'task' ? 'checkbox-outline' : kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'}
//           size={18}
//           color={palette.purple}
//         />
//         <View style={styles.rowContent}>
//           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
//             <Text style={styles.rowTitle}>{item.title}</Text>
//             {item.lead?.name ? (
//               <View style={styles.leadTag}>
//                 <Text style={styles.leadTagText}>{item.lead.name}</Text>
//               </View>
//             ) : null}
//           </View>
//           <Text style={styles.rowMeta}>
//             {formatDateTime(item.scheduledAt ?? item.dueAt ?? item.remindAt ?? item.startAt)} • Lead Activity
//           </Text>
//         </View>
//         <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
//       </Pressable>
//     );
//   }

//   function standaloneEntryRow(item: StandaloneTask) {
//     return (
//       <Pressable
//         key={`standalone-${item.id}`}
//         accessibilityRole="button"
//         accessibilityLabel={`Open ${item.subject}`}
//         onPress={() => router.push({ pathname: '/tasks', params: { taskId: item.id } })}
//         style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
//       >
//         <Ionicons name="checkbox-outline" size={18} color={palette.purple} />
//         <View style={styles.rowContent}>
//           <Text style={styles.rowTitle}>{item.subject}</Text>
//           <Text style={styles.rowMeta}>{formatDateTime(item.endAt)} • Standalone Task</Text>
//         </View>
//         <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
//       </Pressable>
//     );
//   }

//   return (
//     <View style={styles.page} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
//       <View style={styles.topbar}>
//         <Text accessibilityRole="header" style={styles.heading}>Dashboard</Text>
//         <View style={styles.topbarActions}>
//           {canAccess('task') ? <Button title="+ Add Task" onPress={() => setStandaloneTaskFormOpen(true)} /> : null}
//           <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); void todayFollowUpsQuery.refetch(); void todayTasksQuery.refetch(); void standaloneTodayQuery.refetch(); void standaloneTodaySummaryQuery.refetch(); setNow(new Date()); }} style={styles.refreshButton}>
//             <Ionicons name="refresh-outline" size={17} color={palette.purple} />
//             <Text style={styles.link}>Refresh</Text>
//           </Pressable>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.content}
//         refreshControl={
//           <RefreshControl
//             refreshing={query.isRefetching || todayFollowUpsQuery.isRefetching || standaloneTodayQuery.isRefetching}
//             onRefresh={() => { void query.refetch(); void todayFollowUpsQuery.refetch(); void todayTasksQuery.refetch(); void standaloneTodayQuery.refetch(); void standaloneTodaySummaryQuery.refetch(); setNow(new Date()); }}
//             tintColor={palette.purple}
//           />
//         }
//       >
//         {canAccess('lead') && query.isError ? (
//           <View accessibilityRole="alert" style={styles.errorBox}>
//             <Text style={styles.errorText}>Could not load leads: {errorMessage(query.error)}</Text>
//             <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); }}><Text style={styles.link}>Retry</Text></Pressable>
//           </View>
//         ) : null}
//         {canAccess('lead') && todayFollowUpsQuery.isError ? (
//           <View accessibilityRole="alert" style={styles.errorBox}>
//             <Text style={styles.errorText}>Could not load lead activities: {errorMessage(todayFollowUpsQuery.error)}</Text>
//           </View>
//         ) : null}
//         {store.error ? <Text accessibilityRole="alert" style={styles.errorText}>{store.error}</Text> : null}

//         {/* Top 3 Summary Cards */}
//         <View style={[styles.summaryRow, !wide && styles.stacked]}>
//           {canAccess('lead') ? <SummaryCard
//             title="Today's Leads"
//             icon="funnel-outline"
//             count={loadedLeads ? todaysLeads.length : null}
//             completed={todaysLeads.filter((lead) => lead.status === 'CONFIRM').length}
//             color="#1D5FD6"
//             soft="#E4EFFD"
//             progressLabel="Completed Lead"
//             change={change}
//           /> : null}
//           {canAccess('lead') ? <SummaryCard
//             title="Today's Followups"
//             icon="paper-plane-outline"
//             count={followUpCount}
//             completed={followUpCompleted}
//             color="#2BB5F5"
//             soft="#E8F3FD"
//             progressLabel="Completed Followup"
//           /> : null}
//           {canAccess('task') ? <SummaryCard
//             title="Today's Tasks"
//             icon="calendar-outline"
//             count={todayTasksQuery.isLoading && !store.ready ? null : totalTasksCount}
//             completed={totalTasksCompleted}
//             color="#0B2F7D"
//             soft="#E4EFFD"
//             progressLabel="Completed Task"
//           /> : null}
//         </View>

//         {/* Middle Row: Leads & Schedules */}
//         <View style={[styles.panelRow, !wide && styles.stacked]}>
//           {canAccess('lead') ? <View style={styles.panelColumn}>
//             <DashboardPanel
//               title="Leads"
//               icon="funnel-outline"
//               selected={leadTab}
//               onSelect={(key) => setLeadTab(key as LeadStatus)}
//               tabs={currentLeadTabs.map((tab) => ({ ...tab, count: leads.filter((lead) => lead.status === tab.key || (lead.status && lead.status.toLowerCase() === tab.label.toLowerCase())).length }))}
//               empty={!leads.filter((lead) => lead.status === leadTab || (lead.status && lead.status.toLowerCase() === currentLeadTabs.find(t => t.key === leadTab)?.label.toLowerCase())).length}
//               loading={query.isLoading}
//               emptyMessage={query.isError ? 'Leads are unavailable. Please retry.' : 'There Are No Leads to Display'}
//             >
//               {leads.filter((lead) => lead.status === leadTab || (lead.status && lead.status.toLowerCase() === currentLeadTabs.find(t => t.key === leadTab)?.label.toLowerCase())).map((lead) => (
//                 <Pressable
//                   key={lead.id}
//                   accessibilityRole="button"
//                   accessibilityLabel={`Open lead ${lead.name}`}
//                   onPress={() => router.push({ pathname: '/lead/[id]', params: { id: lead.id } })}
//                   style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
//                 >
//                   <View style={styles.avatar}>
//                     <Text style={styles.avatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
//                   </View>
//                   <View style={styles.rowContent}>
//                     <Text style={styles.rowTitle}>{lead.name}</Text>
//                     <Text style={styles.rowMeta}>{lead.companyName || lead.phone}</Text>
//                   </View>
//                   <Ionicons name="chevron-forward-outline" size={16} color={palette.muted} />
//                 </Pressable>
//               ))}
//             </DashboardPanel>
//           </View> : null}

//           {visibleScheduleTabs.length > 0 ? <View style={styles.panelColumn}>
//             <DashboardPanel
//               title="Schedules"
//               icon="notifications-outline"
//               selected={scheduleTab}
//               onSelect={(key) => setScheduleTab(key as ScheduleKind)}
//               tabs={visibleScheduleTabs.map((key) => {
//                 const localCount = store.entries.filter((entry) => entry.kind === key).length;
//                 const serverCount = key === 'Reminder'
//                   ? (backendRemindersQuery.data?.total ?? 0)
//                   : key === 'Meeting'
//                   ? (backendMeetingsQuery.data?.total ?? 0)
//                   : 0;
//                 return { key, label: key, count: localCount + serverCount };
//               })}
//               action={<IconButton label="Add schedule" icon="add-outline" disabled={!ready} onPress={() => setComposer({ kind: scheduleTab })} />}
//               empty={
//                 !localSchedules.length &&
//                 (scheduleTab !== 'Reminder' || !backendRemindersQuery.data?.items?.length) &&
//                 (scheduleTab !== 'Meeting' || !backendMeetingsQuery.data?.items?.length)
//               }
//               loading={!store.ready && !store.error}
//               emptyMessage="There Are No Schedules to Display"
//             >
//               {/* Server Reminders */}
//               {scheduleTab === 'Reminder'
//                 ? (backendRemindersQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Reminder'))
//                 : null}

//               {/* Server Meetings */}
//               {scheduleTab === 'Meeting'
//                 ? (backendMeetingsQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Meeting'))
//                 : null}

//               {/* Local Storage Schedules */}
//               {localSchedules.map(entryRow)}
//             </DashboardPanel>
//           </View> : null}
//         </View>

//         {/* Tasks Section (Today / Tomorrow with Lead Tasks + Personal Tasks) */}
//         {canAccess('task') ? <View style={[styles.taskColumn, wide && styles.halfWidth]}>
//           <DashboardPanel
//             title="Tasks"
//             icon="calendar-outline"
//             selected={taskTab}
//             onSelect={setTaskTab}
//             tabs={['Today', 'Tomorrow'].map((key) => {
//               const localCount = localTasks.filter((entry) => isOnDay(entry.date, key === 'Today' ? now : tomorrow)).length;
//               const serverCount = key === 'Today' ? (todayTasksQuery.data?.total ?? 0) + (standaloneTodaySummaryQuery.data?.total ?? 0) : (tomorrowTasksQuery.data?.total ?? 0) + (standaloneTomorrowSummaryQuery.data?.total ?? 0);
//               return { key, label: key, count: localCount + serverCount };
//             })}
//             action={<IconButton label="Add task" icon="add-outline" disabled={!ready} onPress={() => setComposer({ kind: 'task' })} />}
//             empty={
//                 (taskTab === 'Today' ? !localTodaysTasks.length && !serverTodayTasks.length && !standaloneTodayTasks.length : !localTomorrowTasks.length && !serverTomorrowTasks.length && !standaloneTomorrowTasks.length)
//             }
//             loading={!store.ready && !store.error && (todayTasksQuery.isLoading || standaloneTodayQuery.isLoading || standaloneTodaySummaryQuery.isLoading)}
//             emptyMessage="There Are No Tasks to Display"
//           >
//             {/* Server Lead Tasks */}
//             {taskTab === 'Today'
//               ? serverTodayTasks.map((t) => backendEntryRow(t, 'task'))
//               : serverTomorrowTasks.map((t) => backendEntryRow(t, 'task'))}

//             {taskTab === 'Today'
//               ? standaloneTodayTasks.map(standaloneEntryRow)
//               : standaloneTomorrowTasks.map(standaloneEntryRow)}

//             {/* Local Tasks */}
//             {(taskTab === 'Today' ? localTodaysTasks : localTomorrowTasks).map(entryRow)}
//           </DashboardPanel>
//         </View> : null}

//         {/* Sticky Notes */}
//         {canAccess('note') ? <DashboardPanel
//           title="Sticky Notes"
//           icon="bookmark-outline"
//           fullWidth
//           empty={!localNotes.length}
//           loading={!store.ready && !store.error}
//           emptyMessage="There Are No Sticky Notes to Display"
//           action={
//             <Pressable accessibilityRole="button" accessibilityLabel="Add note" disabled={!ready} onPress={() => setComposer({ kind: 'note' })} style={[styles.addNote, !ready && styles.disabled]}>
//               <Ionicons name="add-outline" size={14} color="#FFFFFF" /><Text style={styles.addNoteText}>Add Note</Text>
//             </Pressable>
//           }
//         >
//           <View style={styles.notesGrid}>
//             {localNotes.map((note) => (
//               <View key={note.id} style={[styles.note, !wide && styles.noteMobile]}>
//                 <Text style={styles.noteText}>{note.text}</Text>
//                 <View style={styles.noteActions}>
//                   <IconButton label={`Edit note ${note.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: 'note', entry: note })} />
//                   <IconButton label={`Delete note ${note.text}`} icon="trash-outline" disabled={!ready} onPress={() => setDeleteEntry(note)} />
//                 </View>
//               </View>
//             ))}
//           </View>
//         </DashboardPanel> : null}
//       </ScrollView>

//       <View style={styles.footer}>
//         <Text style={styles.footerText}>COPYRIGHT © {now.getFullYear()} <Text style={styles.footerBrand}>Shivora CRM</Text>, All rights Reserved</Text>
//       </View>

//       {composer && canCompose(composer.kind) ? (
//         <DashboardComposer
//           key={composer.entry?.id ?? composer.kind}
//           kind={composer.kind}
//           entry={composer.entry}
//           defaultDate={composer.kind === 'task' && taskTab === 'Tomorrow' ? tomorrow : now}
//           onSave={saveEntry}
//           onClose={() => setComposer(null)}
//         />
//       ) : null}

//       <TaskFormModal
//         visible={standaloneTaskFormOpen && canAccess('task')}
//         task={null}
//         userName={userName}
//         labels={taskLabelsQuery.data ?? []}
//         onClose={() => setStandaloneTaskFormOpen(false)}
//         onSave={saveStandaloneTask}
//         onCreateLabel={(name, colour) => taskActions.createLabel.mutateAsync({ name, colour })}
//       />

//       <ConfirmDialog
//         visible={!!deleteEntry && canCompose(deleteEntry.kind)}
//         title={`Delete ${deleteEntry?.kind === 'note' ? 'note' : 'item'}?`}
//         message="This will remove this item from your dashboard."
//         loading={store.saving}
//         onCancel={() => setDeleteEntry(null)}
//         onConfirm={async () => {
//           if (deleteEntry && (await store.save(store.entries.filter((entry) => entry.id !== deleteEntry.id)))) {
//             setDeleteEntry(null);
//           }
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: '#F7F9FC' },
//   topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: '#FFFFFF' },
//   heading: { fontSize: 19, fontWeight: '600', color: '#0E1B3D' },
//   topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6 },
//   link: { fontSize: 12, color: '#0B2F7D' },
//   scroll: { flex: 1 },
//   content: { padding: 18, gap: 14, paddingBottom: 24 },
//   summaryRow: { flexDirection: 'row', gap: 20, maxWidth: 840, marginBottom: 10 },
//   stacked: { flexDirection: 'column', gap: 14 },
//   summaryCard: { flex: 1, padding: 13, minHeight: 144, borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(11,47,125,0.06)' },
//   summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
//   summaryIcon: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
//   summaryHeading: { flex: 1 },
//   summaryLabel: { fontSize: 12, fontWeight: '600', color: palette.muted },
//   summaryValue: { fontSize: 20, fontWeight: '600', color: palette.text, marginTop: 2 },
//   watermark: { position: 'absolute', right: 0, top: 0 },
//   summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17, marginBottom: 16 },
//   badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
//   badgeText: { fontSize: 9, fontWeight: '600' },
//   comparison: { color: '#77737D', fontSize: 10 },
//   progressLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
//   progressLabel: { color: palette.text, fontSize: 12 },
//   progressValue: { fontSize: 12 },
//   progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden' },
//   progressBar: { height: 5, borderRadius: 5 },
//   panelRow: { flexDirection: 'row', gap: 20 },
//   panelColumn: { flex: 1, minWidth: 0 },
//   taskColumn: { width: '100%' },
//   halfWidth: { width: '50%', paddingRight: 10 },
//   entryRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 7, backgroundColor: '#FFFFFF' },
//   rowContent: { flex: 1, minWidth: 0 },
//   rowTitle: { fontSize: 13, color: palette.text, fontWeight: '500' },
//   rowMeta: { fontSize: 11, color: palette.muted, marginTop: 4 },
//   completedText: { textDecorationLine: 'line-through', color: palette.muted },
//   leadTag: { backgroundColor: colors.primarySoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
//   leadTagText: { fontSize: 10, fontWeight: '700', color: colors.primaryText },
//   avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E4EFFD', alignItems: 'center', justifyContent: 'center' },
//   avatarText: { color: '#0B2F7D', fontWeight: '600' },
//   iconButton: { minWidth: 30, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
//   pressed: { backgroundColor: '#F4F7FC' },
//   disabled: { opacity: 0.45 },
//   addNote: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#0B2F7D' },
//   addNoteText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
//   notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
//   note: { width: 240, minHeight: 130, borderWidth: 1, borderColor: '#EFE5B4', borderRadius: 7, backgroundColor: '#FFFBE5', padding: 14 },
//   noteMobile: { width: '100%' },
//   noteText: { fontSize: 13, lineHeight: 20, color: palette.text, flex: 1 },
//   noteActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
//   footer: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: '#FFFFFF' },
//   footerText: { fontSize: 11, color: '#75717A' },
//   footerBrand: { color: '#0B2F7D' },
//   errorBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: 12, backgroundColor: '#FFF1F0', borderRadius: 7 },
//   errorText: { color: '#B3261E', fontSize: 12 },
// });

import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useLeads } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useDashboardActivities } from '@/hooks/useLeadActivities';
import { ActivityRecord } from '@/types/leadActivities';
import { errorMessage } from '@/api/client';
import { crmDayRange, formatDateTime } from '@/utils/format';
import type { LeadStatus } from '@/types/lead';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/Button';
import { colors } from '@/theme/colors';
import DashboardPanel, { dashboardColors as palette, IconName } from './DashboardPanel';
import DashboardComposer from './DashboardComposer';
import useDashboardEntries from './useDashboardEntries';
import { completionPercent, DashboardEntry, isOnDay, ScheduleKind } from './model';

const leadTabs: { key: LeadStatus; label: string }[] = [
  { key: 'NEW', label: 'New' }, { key: 'PROCESSING', label: 'Processing' }, { key: 'CLOSE_BY', label: 'Close-by' },
];
const scheduleTabs: ScheduleKind[] = ['Reminder', 'Meeting', 'Events'];

// Existing brand colours, reused as per-type accents so rows are scannable at a glance.
const tones: Record<string, { color: string; soft: string }> = {
  Reminder: { color: '#2BB5F5', soft: '#E8F3FD' },
  Meeting: { color: '#0B2F7D', soft: '#E4EFFD' },
  Events: { color: '#1D5FD6', soft: '#E4EFFD' },
};
const DANGER = '#B3261E';
const DANGER_SOFT = '#FFF1F0';

function greeting(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

/* ---------- Small building blocks ---------- */

function SummaryCard({ title, icon, count, completed, color, soft, progressLabel, change }: {
  title: string; icon: IconName; count: number | null; completed: number; color: string; soft: string;
  progressLabel: string; change?: number | null;
}) {
  const percent = completionPercent(completed, count ?? 0);
  const hasTrend = change !== undefined && change !== null && change !== 0 && count !== null;
  const down = typeof change === 'number' && change < 0;

  let badgeText = `${completed} completed`;
  if (count === null) badgeText = 'Unavailable';
  else if (change === null) badgeText = 'New activity';
  else if (change === 0) badgeText = 'No change';
  else if (typeof change === 'number') badgeText = `${Math.abs(change).toFixed(1)}%`;

  const badgeColor = down ? DANGER : color;
  const badgeBg = down ? DANGER_SOFT : soft;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.watermark} pointerEvents="none"><Ionicons name={icon} size={84} color={soft} /></View>

      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={22} color={color} /></View>
        <Text style={styles.summaryLabel}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.summaryValue}>{count === null ? '—' : count}</Text>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          {hasTrend ? <Ionicons name={down ? 'trending-down-outline' : 'trending-up-outline'} size={12} color={badgeColor} /> : null}
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
        {change !== undefined && count !== null ? <Text style={styles.comparison}>vs yesterday</Text> : null}
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
          <Text style={[styles.progressValue, { color }]}>
            {count === null ? '—' : `${completed}/${count}  ${Math.round(percent)}%`}
          </Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel={progressLabel} accessibilityValue={{ min: 0, max: 100, now: percent }} style={[styles.progressTrack, { backgroundColor: soft }]}>
          <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

function IconButton({ label, icon, onPress, disabled, danger }: { label: string; icon: IconName; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && (danger ? styles.pressedDanger : styles.pressed), disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={17} color={danger ? DANGER : palette.purple} />
    </Pressable>
  );
}

function KindIcon({ name, kind }: { name: IconName; kind: string }) {
  const tone = tones[kind] ?? tones.Reminder;
  return <View style={[styles.kindIcon, { backgroundColor: tone.soft }]}><Ionicons name={name} size={18} color={tone.color} /></View>;
}

function RowMeta({ when, source }: { when: string; source: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name="time-outline" size={12} color={palette.muted} />
      <Text style={styles.rowMeta}>{when}</Text>
      <View style={styles.sourcePill}><Text style={styles.sourcePillText}>{source}</Text></View>
    </View>
  );
}

/* ---------- Screen ---------- */

export default function Dashboard() {
  const router = useRouter();
  const { userName } = useAuth();
  const { canAccess } = usePermissions();
  const visibleScheduleTabs = scheduleTabs.filter(kind => canAccess(kind === 'Reminder' ? 'reminder' : kind === 'Meeting' ? 'meeting' : 'calendar'));
  const query = useLeads('');
  const statusesQuery = useLeadStatuses();
  const activeLeadStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
  const currentLeadTabs = activeLeadStatuses.length > 0
    ? activeLeadStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
    : leadTabs;

  const store = useDashboardEntries(userName);
  const [contentWidth, setContentWidth] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [leadTab, setLeadTab] = useState<LeadStatus>('NEW');
  const [selectedScheduleTab, setScheduleTab] = useState<ScheduleKind>('Reminder');
  const scheduleTab = visibleScheduleTabs.includes(selectedScheduleTab) ? selectedScheduleTab : visibleScheduleTabs[0] ?? 'Events';
  const [composer, setComposer] = useState<{ kind: DashboardEntry['kind']; entry?: DashboardEntry } | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<DashboardEntry | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Asia/Kolkata day boundaries for Today and Tomorrow
  const todayRange = crmDayRange(now);

  // Backend lead activities queries
  const todayFollowUpsQuery = useDashboardActivities('followups', { from: todayRange.from, to: todayRange.to });
  const backendRemindersQuery = useDashboardActivities('reminders', { status: 'PENDING' });
  const backendMeetingsQuery = useDashboardActivities('meetings', { status: 'SCHEDULED' });

  const leads = query.data ?? [];
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const todaysLeads = leads.filter((lead) => isOnDay(lead.createdAt, now));
  const yesterdayCount = leads.filter((lead) => isOnDay(lead.createdAt, yesterday)).length;
  const change = yesterdayCount === 0 ? (todaysLeads.length ? null : 0) : (todaysLeads.length - yesterdayCount) / yesterdayCount * 100;

  // Leads for the selected tab (computed once, reused for empty state + list)
  const activeTabLabel = currentLeadTabs.find((t) => t.key === leadTab)?.label.toLowerCase();
  const visibleLeads = leads.filter((lead) => lead.status === leadTab || (lead.status && lead.status.toLowerCase() === activeTabLabel));

  // Local storage personal entries
  const localNotes = store.entries.filter((entry) => entry.kind === 'note');
  const localSchedules = store.entries.filter((entry) => entry.kind === scheduleTab).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const followUpCount = todayFollowUpsQuery.isLoading ? null : (todayFollowUpsQuery.data?.total ?? 0);
  const followUpCompleted = todayFollowUpsQuery.data?.completed ?? 0;

  const ready = store.ready && !store.saving;
  const wide = contentWidth >= 760;
  const loadedLeads = !query.isLoading && !query.isError;
  const canCompose = (kind: DashboardEntry['kind']) => canAccess(kind === 'Events' ? 'calendar' : kind === 'Reminder' ? 'reminder' : kind === 'Meeting' ? 'meeting' : kind);
  const firstName = userName ? String(userName).trim().split(' ')[0] : '';
  const column = [styles.panelColumn, !wide && styles.panelColumnStacked];

  function refreshAll() {
    void query.refetch();
    void todayFollowUpsQuery.refetch();
    setNow(new Date());
  }

  async function saveEntry(entry: DashboardEntry) {
    if (!canCompose(entry.kind)) return false;
    const saved = await store.save([entry, ...store.entries.filter((item) => item.id !== entry.id)]);
    if (saved && entry.kind !== 'note') setScheduleTab(entry.kind);
    return saved;
  }

  function entryRow(entry: DashboardEntry) {
    return (
      <View key={entry.id} style={styles.entryRow}>
        <KindIcon name={entry.kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'} kind={entry.kind} />
        <View style={styles.rowContent}>
          <Text numberOfLines={2} style={[styles.rowTitle, entry.completed && styles.completedText]}>{entry.text}</Text>
          <RowMeta when={formatDateTime(entry.date)} source="Personal" />
        </View>
        <View style={styles.rowActions}>
          <IconButton label={`Edit ${entry.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: entry.kind, entry })} />
          <IconButton label={`Delete ${entry.text}`} icon="trash-outline" danger disabled={!ready} onPress={() => setDeleteEntry(entry)} />
        </View>
      </View>
    );
  }

  function backendEntryRow(item: ActivityRecord, kind: 'Reminder' | 'Meeting') {
    return (
      <Pressable
        key={`backend-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title} for ${item.independent ? 'standalone activity' : item.lead?.name ?? 'lead'}`}
        onPress={() => item.independent || !canAccess('lead')
          ? router.push(kind === 'Reminder' ? '/reminders' : '/meetings')
          : item.leadId ? router.push({
            pathname: '/lead/[id]',
            params: {
              id: item.leadId,
              section: kind === 'Reminder' ? 'reminders' : 'meetings',
            },
          }) : undefined}
        style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
      >
        <KindIcon
          name={kind === 'Reminder' ? 'notifications-outline' : 'calendar-outline'}
          kind={kind}
        />
        <View style={styles.rowContent}>
          <View style={styles.titleLine}>
            <Text numberOfLines={1} style={[styles.rowTitle, styles.titleFlex]}>{item.title}</Text>
            {item.lead?.name ? (
              <View style={styles.leadTag}>
                <Text numberOfLines={1} style={styles.leadTagText}>{item.lead.name}</Text>
              </View>
            ) : null}
          </View>
          <RowMeta when={formatDateTime(item.scheduledAt ?? item.dueAt ?? item.remindAt ?? item.startAt)} source="Lead activity" />
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.muted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.page} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
      <View style={styles.topbar}>
        <View style={styles.titleBlock}>
          <Text accessibilityRole="header" style={styles.heading}>Dashboard</Text>
          <Text numberOfLines={1} style={styles.subheading}>{greeting(now)}{firstName ? `, ${firstName}` : ''}</Text>
        </View>
        <View style={styles.topbarActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh dashboard" onPress={refreshAll} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={18} color={palette.purple} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || todayFollowUpsQuery.isRefetching}
            onRefresh={refreshAll}
            tintColor={palette.purple}
          />
        }
      >
        {canAccess('lead') && query.isError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
            <Text style={[styles.errorText, styles.errorFlex]}>Could not load leads: {errorMessage(query.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); }}><Text style={styles.retry}>Retry</Text></Pressable>
          </View>
        ) : null}
        {canAccess('lead') && todayFollowUpsQuery.isError ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
            <Text style={[styles.errorText, styles.errorFlex]}>Could not load lead activities: {errorMessage(todayFollowUpsQuery.error)}</Text>
          </View>
        ) : null}
        {store.error ? <View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{store.error}</Text></View> : null}

        {/* Summary cards */}
        <View style={[styles.summaryRow, !wide && styles.stacked]}>
          {canAccess('lead') ? <SummaryCard
            title="Today's Leads"
            icon="funnel-outline"
            count={loadedLeads ? todaysLeads.length : null}
            completed={todaysLeads.filter((lead) => lead.status === 'CONFIRM').length}
            color="#1D5FD6"
            soft="#E4EFFD"
            progressLabel="Completed Lead"
            change={change}
          /> : null}
          {canAccess('lead') ? <SummaryCard
            title="Today's Followups"
            icon="paper-plane-outline"
            count={followUpCount}
            completed={followUpCompleted}
            color="#2BB5F5"
            soft="#E8F3FD"
            progressLabel="Completed Followup"
          /> : null}
        </View>

        {/* Leads & Schedules */}
        <View style={[styles.panelRow, !wide && styles.stacked]}>
          {canAccess('lead') ? <View style={column}>
            <DashboardPanel
              title="Leads"
              icon="funnel-outline"
              selected={leadTab}
              onSelect={(key) => setLeadTab(key as LeadStatus)}
              tabs={currentLeadTabs.map((tab) => ({ ...tab, count: leads.filter((lead) => lead.status === tab.key || (lead.status && lead.status.toLowerCase() === tab.label.toLowerCase())).length }))}
              empty={!visibleLeads.length}
              loading={query.isLoading}
              emptyMessage={query.isError ? 'Leads are unavailable. Please retry.' : 'There Are No Leads to Display'}
            >
              {visibleLeads.map((lead) => (
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
                    <Text numberOfLines={1} style={styles.rowTitle}>{lead.name}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name={lead.companyName ? 'business-outline' : 'call-outline'} size={12} color={palette.muted} />
                      <Text numberOfLines={1} style={styles.rowMeta}>{lead.companyName || lead.phone}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={palette.muted} />
                </Pressable>
              ))}
            </DashboardPanel>
          </View> : null}

          {visibleScheduleTabs.length > 0 ? <View style={column}>
            <DashboardPanel
              title="Schedules"
              icon="notifications-outline"
              selected={scheduleTab}
              onSelect={(key) => setScheduleTab(key as ScheduleKind)}
              tabs={visibleScheduleTabs.map((key) => {
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
              {scheduleTab === 'Reminder'
                ? (backendRemindersQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Reminder'))
                : null}
              {scheduleTab === 'Meeting'
                ? (backendMeetingsQuery.data?.items ?? []).map((item) => backendEntryRow(item, 'Meeting'))
                : null}
              {localSchedules.map(entryRow)}
            </DashboardPanel>
          </View> : null}
        </View>

        {/* Sticky notes */}
        {canAccess('note') ? <View style={[styles.panelRow, !wide && styles.stacked]}>
          <View style={column}>
            <DashboardPanel
              title="Sticky Notes"
              icon="bookmark-outline"
              empty={!localNotes.length}
              loading={!store.ready && !store.error}
              emptyMessage="There Are No Sticky Notes to Display"
              action={
                <Pressable accessibilityRole="button" accessibilityLabel="Add note" disabled={!ready} onPress={() => setComposer({ kind: 'note' })} style={[styles.addNote, !ready && styles.disabled]}>
                  <Ionicons name="add" size={14} color="#FFFFFF" /><Text style={styles.addNoteText}>Add Note</Text>
                </Pressable>
              }
            >
              <View style={styles.notesGrid}>
                {localNotes.map((note) => (
                  <View key={note.id} style={[styles.note, !wide && styles.noteMobile]}>
                    <Text style={styles.noteText}>{note.text}</Text>
                    <View style={styles.noteActions}>
                      <IconButton label={`Edit note ${note.text}`} icon="create-outline" disabled={!ready} onPress={() => setComposer({ kind: 'note', entry: note })} />
                      <IconButton label={`Delete note ${note.text}`} icon="trash-outline" danger disabled={!ready} onPress={() => setDeleteEntry(note)} />
                    </View>
                  </View>
                ))}
              </View>
            </DashboardPanel>
          </View>
        </View> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>COPYRIGHT © {now.getFullYear()} <Text style={styles.footerBrand}>Shivora CRM</Text>, All rights Reserved</Text>
        </View>
      </ScrollView>

      {composer && canCompose(composer.kind) ? (
        <DashboardComposer
          key={composer.entry?.id ?? composer.kind}
          kind={composer.kind}
          entry={composer.entry}
          defaultDate={now}
          onSave={saveEntry}
          onClose={() => setComposer(null)}
        />
      ) : null}

      <ConfirmDialog
        visible={!!deleteEntry && canCompose(deleteEntry.kind)}
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
  page: { flex: 1, backgroundColor: '#F7F9FC' },

  /* Top bar */
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: '#FFFFFF' },
  titleBlock: { flex: 1, minWidth: 0 },
  heading: { fontSize: 22, fontWeight: '700', color: '#0E1B3D', letterSpacing: -0.3 },
  subheading: { fontSize: 12, color: palette.muted, marginTop: 2 },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refreshButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF' },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 12 },

  /* Layout */
  summaryRow: { flexDirection: 'row', gap: 16 },
  stacked: { flexDirection: 'column', alignItems: 'stretch', gap: 16 },
  panelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  panelColumn: { flex: 1, minWidth: 0 },
  panelColumnStacked: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' },

  /* Summary cards: the one bold moment on the page */
  summaryCard: { flex: 1, padding: 18, borderWidth: 1, borderColor: palette.border, borderRadius: 18, backgroundColor: '#FFFFFF', overflow: 'hidden', boxShadow: '0 4px 14px rgba(11,47,125,0.07)' },
  watermark: { position: 'absolute', right: -12, top: -10 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  summaryLabel: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: palette.muted },
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, marginTop: 16, marginBottom: 18 },
  summaryValue: { fontSize: 34, lineHeight: 38, fontWeight: '700', color: palette.text, letterSpacing: -0.8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  comparison: { color: '#77737D', fontSize: 11, marginBottom: 6 },
  progressBlock: { paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EEF2F8' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressLabel: { color: palette.muted, fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 6, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 6 },

  /* Rows (quiet, tinted, so panels stay calm) */
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EAF0F8', borderRadius: 12, backgroundColor: '#FAFCFF' },
  rowContent: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleFlex: { flexShrink: 1 },
  rowTitle: { fontSize: 14, color: palette.text, fontWeight: '600', lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  rowMeta: { fontSize: 11.5, color: palette.muted, flexShrink: 1 },
  completedText: { textDecorationLine: 'line-through', color: palette.muted },
  sourcePill: { marginLeft: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#EEF3FA' },
  sourcePillText: { fontSize: 10, fontWeight: '600', color: palette.muted },
  leadTag: { flexShrink: 1, maxWidth: 130, backgroundColor: colors.primarySoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  leadTagText: { fontSize: 10, fontWeight: '700', color: colors.primaryText },
  kindIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E4EFFD', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0B2F7D', fontWeight: '700', fontSize: 15 },
  checkbox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rowActions: { flexDirection: 'row', alignItems: 'center' },

  iconButton: { minWidth: 34, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  pressed: { backgroundColor: '#F0F5FD' },
  pressedDanger: { backgroundColor: DANGER_SOFT },
  disabled: { opacity: 0.45 },

  /* Sticky notes */
  addNote: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0B2F7D' },
  addNoteText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  note: { width: '48%', flexGrow: 1, minHeight: 124, borderWidth: 1, borderColor: '#EFE5B4', borderRadius: 12, backgroundColor: '#FFFBE5', paddingTop: 14, paddingHorizontal: 14, paddingBottom: 6 },
  noteMobile: { width: '100%' },
  noteText: { fontSize: 13.5, lineHeight: 21, color: palette.text, flex: 1 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F3EBC2' },

  /* Errors */
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: DANGER_SOFT, borderWidth: 1, borderColor: '#F7D5D2', borderRadius: 12 },
  errorFlex: { flex: 1 },
  errorText: { color: DANGER, fontSize: 12.5 },
  retry: { fontSize: 12.5, fontWeight: '700', color: '#0B2F7D' },

  /* Footer */
  footer: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  footerText: { fontSize: 11, color: '#75717A', textAlign: 'center' },
  footerBrand: { color: '#0B2F7D', fontWeight: '600' },
});
