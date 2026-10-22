import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Task } from '@/types/task';
import { colors } from '@/theme/colors';
import { formatDateTime } from '@/utils/format';
import { taskStatusLabel } from './TaskStatusControl';
import { taskStatusColours } from './TaskCard';

export default function TaskList({ tasks, loading, error, onOpen, onEdit, onDelete, onChangeStatus, onChangeLabel }: { tasks: Task[]; loading: boolean; error?: string; onOpen: (id: string) => void; onEdit: (id: string) => void; onDelete: (task: Task) => void; onChangeStatus: (id: string) => void; onChangeLabel: (id: string) => void }) {
  if (loading && !tasks.length) return <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading tasks…</Text></View>;
  if (error && !tasks.length) return <View style={styles.state}><Text style={styles.error}>{error}</Text></View>;
  if (!tasks.length) return <View style={styles.state}><Text style={styles.muted}>No tasks match the current search and filters.</Text></View>;
  return <ScrollView horizontal contentContainerStyle={styles.scroll} showsHorizontalScrollIndicator><View style={styles.table}>
    <View style={[styles.row, styles.header]}>{['Subject', 'Label', 'Priority', 'Status', 'Creator', 'Assignee', 'Start Date', 'Due Date', 'Completion Date', 'Actions'].map(title => <Text key={title} style={[styles.cell, styles.headerText]}>{title}</Text>)}</View>
    {tasks.map(task => <View key={task.id} style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open task ${task.subject}`} onPress={() => onOpen(task.id)} style={styles.cell}><Text style={styles.link} numberOfLines={1}>{task.subject}</Text></Pressable>
      <Text style={styles.cell}>{task.label?.name ?? '—'}</Text><Text style={styles.cell}>{task.priority}</Text><Text style={[styles.cell, { color: taskStatusColours[task.status], fontWeight: '800' }]}>{taskStatusLabel(task.status)}</Text><Text style={styles.cell}>{task.createdByName}</Text><Text style={styles.cell}>{task.assignedTo}</Text><Text style={styles.cell}>{formatDateTime(task.startAt)}</Text><Text style={styles.cell}>{formatDateTime(task.endAt)}</Text><Text style={styles.cell}>{task.completedAt ? formatDateTime(task.completedAt) : '—'}</Text>
      <View style={[styles.cell, styles.actions]}><Action label="Edit task" icon="Edit" onPress={() => onEdit(task.id)} /><Action label="Change Status" icon="Status" onPress={() => onChangeStatus(task.id)} /><Action label="Change Label" icon="Label" onPress={() => onChangeLabel(task.id)} /><Action label="Delete task" icon="Delete" onPress={() => onDelete(task)} /></View>
    </View>)}
  </View></ScrollView>;
}
function Action({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}><Text style={styles.actionText}>{icon}</Text></Pressable>; }
const styles = StyleSheet.create({ scroll: { padding: 14 }, table: { minWidth: 1120, borderWidth: 1, borderColor: colors.border, borderRadius: 9, overflow: 'hidden' }, row: { flexDirection: 'row', minHeight: 48, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white }, header: { backgroundColor: '#0B2F7D' }, cell: { width: 112, paddingHorizontal: 8, paddingVertical: 8, color: colors.text, fontSize: 10 }, headerText: { color: colors.white, fontWeight: '800', fontSize: 10 }, link: { color: colors.primaryText, fontWeight: '800' }, actions: { width: 150, flexDirection: 'row', gap: 5 }, action: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 4 }, actionText: { color: colors.primaryText, fontSize: 9, fontWeight: '800' }, state: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8 }, muted: { color: colors.muted, fontSize: 12 }, error: { color: colors.danger, fontSize: 12 },
});
