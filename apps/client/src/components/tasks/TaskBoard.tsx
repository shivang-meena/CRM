import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TaskBoardColumn, TaskStatus } from '@/types/task';
import { colors } from '@/theme/colors';
import { useTaskDnd } from '@/context/TaskDndContext';
import { Ionicons } from '@expo/vector-icons';
import TaskCard, { taskStatusColours } from './TaskCard';
import { taskStatusLabel } from './TaskStatusControl';

export default function TaskBoard({ columns, loading, error, onOpen, onEdit, onDelete, onChangeStatus, onChangeLabel, onLoadMore }: {
  columns: TaskBoardColumn[]; loading: boolean; error?: string; onOpen: (id: string) => void; onEdit: (id: string) => void; onDelete: (task: TaskBoardColumn['items'][number]) => void;
  onChangeStatus: (id: string) => void; onChangeLabel: (id: string) => void; onLoadMore: () => void;
}) {
  if (loading && !columns.length) return <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading tasks…</Text></View>;
  if (error && !columns.length) return <View style={styles.state}><Text style={styles.error}>{error}</Text></View>;
  return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.row}>
    {columns.map(column => <TaskBoardStatusColumn key={column.status} column={column} loading={loading} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onChangeStatus={onChangeStatus} onChangeLabel={onChangeLabel} onLoadMore={onLoadMore} />)}
  </ScrollView>;
}

function TaskBoardStatusColumn({ column, loading, onOpen, onEdit, onDelete, onChangeStatus, onChangeLabel, onLoadMore }: {
  column: TaskBoardColumn; loading: boolean; onOpen: (id: string) => void; onEdit: (id: string) => void; onDelete: (task: TaskBoardColumn['items'][number]) => void;
  onChangeStatus: (id: string) => void; onChangeLabel: (id: string) => void; onLoadMore: () => void;
}) {
  const dnd = useTaskDnd();
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useRef(0);
  const title = taskStatusLabel(column.status);

  useEffect(() => {
    if (!dnd?.draggingTaskId) {
      dragCounter.current = 0;
      setIsOver(false);
    }
  }, [dnd?.draggingTaskId]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsOver(false);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsOver(false);
    const taskId = e.dataTransfer?.getData('text/plain') || dnd?.draggingTaskId;
    if (taskId) dnd?.dropTask(taskId, column.status);
  };

  const content = <View style={[styles.column, isOver && styles.columnOver]}>
    <View style={[styles.columnHeader, isOver && styles.columnHeaderOver]}><View style={styles.titleRow}><View style={[styles.dot, { backgroundColor: taskStatusColours[column.status] }]} /><Text style={styles.title}>{title}</Text></View><View style={[styles.count, isOver && styles.countOver]}><Text style={styles.countText}>{column.total}</Text></View></View>
    {loading ? <ActivityIndicator color={taskStatusColours[column.status]} /> : null}
    {!loading && !column.items.length ? <View style={[styles.emptyBox, isOver && styles.emptyBoxOver]}><Ionicons name={isOver ? 'arrow-down-circle' : 'layers-outline'} size={22} color={isOver ? colors.primary : colors.muted} /><Text style={[styles.empty, isOver && styles.emptyOver]}>{isOver ? `Drop task here for ${title}` : 'No tasks'}</Text></View> : null}
    {column.items.map(task => <TaskCard key={task.id} task={task} onOpen={() => onOpen(task.id)} onEdit={() => onEdit(task.id)} onDelete={() => onDelete(task)} onChangeStatus={() => onChangeStatus(task.id)} onChangeLabel={() => onChangeLabel(task.id)} />)}
    {isOver && column.items.length ? <View style={styles.dropZonePlaceholder}><Ionicons name="arrow-down-circle-outline" size={17} color={colors.primary} /><Text style={styles.dropZonePlaceholderText}>Drop to move to {title}</Text></View> : null}
    {column.total > column.items.length ? <Pressable accessibilityRole="button" accessibilityLabel={`Load more ${title} tasks`} onPress={onLoadMore} style={styles.loadMore}><Text style={styles.loadMoreText}>Load more</Text></Pressable> : null}
  </View>;

  if (Platform.OS === 'web') return <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{content}</div>;
  return content;
}

const styles = StyleSheet.create({
  row: { padding: 14, gap: 12, alignItems: 'flex-start' }, column: { width: 238, minHeight: 180, backgroundColor: '#F9FAFD', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 9 }, columnOver: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  columnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, columnHeaderOver: { backgroundColor: colors.primarySoft }, titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 8, height: 8, borderRadius: 4 }, title: { color: colors.text, fontSize: 13, fontWeight: '800' }, count: { minWidth: 22, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7B7C9' }, countOver: { transform: [{ scale: 1.1 }] }, countText: { color: '#8E2147', fontSize: 10, fontWeight: '800' }, emptyBox: { minHeight: 105, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 7, borderWidth: 1, borderColor: 'transparent' }, emptyBoxOver: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderStyle: 'dashed' }, empty: { color: colors.muted, fontSize: 11, textAlign: 'center' }, emptyOver: { color: colors.primaryText, fontWeight: '700' }, dropZonePlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, borderRadius: 7, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.primarySoft }, dropZonePlaceholderText: { color: colors.primaryText, fontSize: 10, fontWeight: '700' }, loadMore: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingVertical: 7, alignItems: 'center', backgroundColor: colors.white }, loadMoreText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' }, state: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8 }, muted: { color: colors.muted, fontSize: 12 }, error: { color: colors.danger, fontSize: 12 },
});
