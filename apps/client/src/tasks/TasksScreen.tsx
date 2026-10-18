import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { TaskDndProvider } from '@/context/TaskDndContext';
import { useTask, useTaskActions, useTaskBoard, useTaskHistory, useTaskLabels, useTaskReport, useTasks } from '@/hooks/useTasks';
import { Task, TaskFilters, TaskLabel } from '@/types/task';
import { colors } from '@/theme/colors';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import TaskFilterModal from '@/components/tasks/TaskFilterModal';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskList from '@/components/tasks/TaskList';
import TaskReportPanel from '@/components/tasks/TaskReportPanel';

export default function TasksScreen() {
  const { userName } = useAuth();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, pageSize: 50 });
  const [view, setView] = useState<'board' | 'list'>('board');
  const [boardLimit, setBoardLimit] = useState(20);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const actions = useTaskActions();
  const labelsQuery = useTaskLabels();
  const queryFilters = useMemo(() => ({ ...filters, search: search.trim() || undefined }), [filters, search]);
  const boardQuery = useTaskBoard({ ...queryFilters, page: 1, pageSize: boardLimit });
  const listQuery = useTasks(queryFilters);
  const reportQuery = useTaskReport(queryFilters, reportOpen);
  const selectedQuery = useTask(editId ?? detailId);
  const historyQuery = useTaskHistory(detailId);
  const selectedTask = selectedQuery.data ?? null;
  const boardColumns = boardQuery.data?.columns ?? [];
  const labels = labelsQuery.data ?? [];
  const queryError = boardQuery.error || listQuery.error || actions.create.error || actions.update.error || actions.status.error || actions.remove.error || actions.createLabel.error || actions.stopSeries.error;
  const filterCount = [filters.status, filters.priority, filters.labelId, filters.assignedTo, filters.from, filters.to, filters.overdue].filter(Boolean).length;

  useEffect(() => { const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId; if (taskId) setDetailId(taskId); }, [params.taskId]);

  function openCreate() { setEditId(null); setFormOpen(true); }
  function openEdit(id: string) { setDetailId(null); setEditId(id); setFormOpen(true); }
  function openDetail(id: string) { setEditId(null); setDetailId(id); }
  function closeForm() { if (!actions.create.isPending && !actions.update.isPending) { setFormOpen(false); setEditId(null); } }
  async function saveTask(data: Record<string, unknown>) { if (editId) await actions.update.mutateAsync({ id: editId, data }); else await actions.create.mutateAsync(data); setFormOpen(false); setEditId(null); }
  function handleDropTask(taskId: string, targetStatus: Task['status']) {
    const task = boardColumns.flatMap(column => column.items).find(item => item.id === taskId);
    if (!task || task.status === targetStatus) return;
    actions.status.mutate({ id: task.id, version: task.version, status: targetStatus });
  }
  async function createLabel(name: string, colour: string): Promise<TaskLabel | undefined> { return actions.createLabel.mutateAsync({ name, colour }); }
  async function removeTask() { if (!deleteTask) return; await actions.remove.mutateAsync({ id: deleteTask.id, version: deleteTask.version }); setDeleteTask(null); }
  async function changeStatus(status: Task['status']) { if (!selectedTask || selectedTask.status === status) return; try { await actions.status.mutateAsync({ id: selectedTask.id, version: selectedTask.version, status }); } catch { /* the readable error remains in the page banner */ } }
  async function stopRecurrence() { if (!selectedTask?.recurrenceSeries) return; try { await actions.stopSeries.mutateAsync({ id: selectedTask.recurrenceSeries.id, version: selectedTask.recurrenceSeries.version }); } catch { /* the readable error remains in the page banner */ } }

  function exportCsv() {
    const summary = reportQuery.data;
    if (!summary) return;
    const escape = (value: string | number) => { const text = String(value); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
    const rows = [['Metric', 'Value'], ['Total', summary.total], ...summary.status.map(item => [`Status: ${item.status}`, item.total]), ...summary.priority.map(item => [`Priority: ${item.priority}`, item.total]), ['Overdue', summary.overdue]];
    const csv = rows.map(row => row.map(value => escape(value)).join(',')).join('\r\n');
    if (Platform.OS !== 'web') { Alert.alert('CSV export', 'CSV export is available from the web view.'); return; }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'tasks-summary.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  return <View style={styles.page}>
    <View style={styles.toolbar}><Text style={styles.heading}>Tasks</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarControls}>
      <View style={styles.search}><Ionicons name="search-outline" size={16} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search tasks" placeholderTextColor={colors.muted} style={styles.searchInput} accessibilityLabel="Search tasks" /><Pressable accessibilityRole="button" accessibilityLabel="Clear task search" onPress={() => setSearch('')}><Ionicons name="close-circle-outline" size={16} color={colors.muted} /></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open task reports" onPress={() => setReportOpen(true)} style={styles.toolbarButton}><Text style={styles.toolbarButtonText}>Reports</Text><Ionicons name="chevron-down-outline" size={14} color={colors.primaryText} /></Pressable><Button title="+ Add Task" onPress={openCreate} /><Pressable accessibilityRole="button" accessibilityLabel="Open task filters" onPress={() => setFilterOpen(true)} style={[styles.toolbarButton, filterCount > 0 && styles.toolbarButtonActive]}><Ionicons name="filter-outline" size={16} color={colors.primaryText} /><Text style={styles.toolbarButtonText}>Filter{filterCount ? ` (${filterCount})` : ''}</Text></Pressable>
      <View style={styles.switch}><Pressable accessibilityRole="radio" accessibilityState={{ selected: view === 'board' }} onPress={() => setView('board')} style={[styles.switchOption, view === 'board' && styles.switchSelected]}><Ionicons name="grid-outline" size={15} color={view === 'board' ? colors.primaryText : colors.muted} /><Text style={styles.switchText}>Board</Text></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ selected: view === 'list' }} onPress={() => setView('list')} style={[styles.switchOption, view === 'list' && styles.switchSelected]}><Ionicons name="list-outline" size={15} color={view === 'list' ? colors.primaryText : colors.muted} /><Text style={styles.switchText}>List</Text></Pressable></View>
    </ScrollView></View>
    {queryError ? <View accessibilityRole="alert" style={styles.errorBanner}><Text style={styles.errorText}>{errorMessage(queryError)}</Text><Pressable accessibilityRole="button" onPress={() => { void boardQuery.refetch(); void listQuery.refetch(); }}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}
    <View style={styles.content}>{view === 'board' ? <TaskDndProvider onDropTask={handleDropTask}><TaskBoard columns={boardColumns} loading={boardQuery.isLoading || boardQuery.isFetching} error={queryError ? errorMessage(queryError) : undefined} onOpen={openDetail} onEdit={openEdit} onDelete={setDeleteTask} onChangeStatus={openDetail} onChangeLabel={openEdit} onLoadMore={() => setBoardLimit(current => Math.min(100, current + 20))} /></TaskDndProvider> : <TaskList tasks={listQuery.data?.items ?? []} loading={listQuery.isLoading || listQuery.isFetching} error={queryError ? errorMessage(queryError) : undefined} onOpen={openDetail} onEdit={openEdit} onDelete={setDeleteTask} onChangeStatus={openDetail} onChangeLabel={openEdit} />}</View>
    <TaskFormModal visible={formOpen && (!editId || !!selectedTask)} task={editId ? selectedTask : null} userName={userName} labels={labels} onClose={closeForm} onSave={saveTask} onCreateLabel={createLabel} />
    <TaskDetailsModal visible={!!detailId} task={detailId ? selectedTask : null} history={historyQuery.data ?? []} loading={selectedQuery.isLoading} stopping={actions.stopSeries.isPending} onClose={() => setDetailId(null)} onStatus={status => { void changeStatus(status); }} onStopRecurrence={() => { void stopRecurrence(); }} />
    <TaskFilterModal visible={filterOpen} filters={filters} labels={labels} onClose={() => setFilterOpen(false)} onApply={next => { setFilters(next); setBoardLimit(20); }} />
    <TaskReportPanel visible={reportOpen} summary={reportQuery.data} loading={reportQuery.isLoading || reportQuery.isFetching} onClose={() => setReportOpen(false)} onExport={exportCsv} />
    <ConfirmDialog visible={!!deleteTask} title="Delete task?" message={`This will remove “${deleteTask?.subject ?? 'this task'}” from active task views while preserving its history.`} loading={actions.remove.isPending} onCancel={() => setDeleteTask(null)} onConfirm={() => { void removeTask(); }} />
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.canvas }, toolbar: { minHeight: 70, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 14 }, heading: { color: colors.text, fontSize: 21, fontWeight: '800' }, toolbarControls: { flexGrow: 1, alignItems: 'center', gap: 8, paddingRight: 2 }, search: { minWidth: 180, height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, searchInput: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 0 }, toolbarButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 11, backgroundColor: colors.white }, toolbarButtonActive: { borderColor: colors.accent, backgroundColor: colors.primarySoft }, toolbarButtonText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' }, switch: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 3, gap: 3 }, switchOption: { minHeight: 32, paddingHorizontal: 9, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }, switchSelected: { backgroundColor: colors.primarySoft }, switchText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, content: { flex: 1 }, errorBanner: { margin: 12, padding: 10, borderRadius: 7, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }, errorText: { color: colors.danger, fontSize: 12, flex: 1 }, retry: { color: colors.primaryText, fontWeight: '800', fontSize: 12 },
});
