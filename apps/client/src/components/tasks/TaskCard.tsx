import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/types/task';
import { formatDateTime } from '@/utils/format';
import { colors } from '@/theme/colors';
import { useTaskDnd } from '@/context/TaskDndContext';
import { taskStatusLabel } from './TaskStatusControl';

export const taskStatusColours: Record<Task['status'], string> = {
  NEW: colors.taskNew, IN_FEEDBACK: colors.taskFeedback, COMPLETED: colors.taskCompleted, REJECTED: colors.taskRejected, PROCESSING: colors.taskProcessing,
};

export default function TaskCard({ task, onOpen, onEdit, onDelete, onChangeStatus, onChangeLabel }: {
  task: Task; onOpen: () => void; onEdit: () => void; onDelete: () => void; onChangeStatus: () => void; onChangeLabel: () => void;
}) {
  const statusColour = taskStatusColours[task.status];
  const dnd = useTaskDnd();
  const isDragging = dnd?.draggingTaskId === task.id;
  const isDraggingRef = useRef(false);
  const handleOpen = () => {
    if (isDraggingRef.current) return;
    onOpen();
  };

  const cardContent = <View style={[styles.card, isDragging && styles.cardDragging]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open task ${task.subject}`} onPress={handleOpen} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
      <View style={styles.titleRow}><Ionicons name="checkbox-outline" size={16} color={statusColour} /><Text style={styles.subject} numberOfLines={2}>{task.subject}</Text></View>
      {task.label ? <View style={[styles.label, { backgroundColor: task.label.colour + '22', borderColor: task.label.colour }]}><Text style={[styles.labelText, { color: task.label.colour }]}>{task.label.name}</Text></View> : null}
      <Meta label="BY" value={task.createdByName} />
      <Meta label="TO" value={task.assignedTo} />
      <Meta label="DUE" value={formatDateTime(task.endAt)} valueColour={task.status === 'COMPLETED' || task.status === 'REJECTED' ? colors.muted : colors.text} />
      {task.completedAt ? <Meta label="CMP" value={formatDateTime(task.completedAt)} valueColour={colors.success} /> : null}
    </Pressable>
    <View style={styles.footer}>
      <Text style={[styles.status, { color: statusColour }]}>{taskStatusLabel(task.status)}</Text>
      <View style={styles.actions}>
        <Action icon="create-outline" label={`Edit ${task.subject}`} onPress={onEdit} />
        <Action icon="swap-horizontal-outline" label={`Change Status for ${task.subject}`} onPress={onChangeStatus} />
        <Action icon="pricetag-outline" label={`Change Label for ${task.subject}`} onPress={onChangeLabel} />
        <Action icon="trash-outline" label={`Delete ${task.subject}`} onPress={onDelete} danger />
      </View>
    </View>
  </View>;

  if (Platform.OS === 'web') {
    return <div
      draggable
      onDragStart={(e) => {
        isDraggingRef.current = true;
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => dnd?.startDrag(task.id), 0);
      }}
      onDragEnd={() => {
        dnd?.endDrag();
        setTimeout(() => { isDraggingRef.current = false; }, 150);
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s ease' }}
    >
      {cardContent}
    </div>;
  }

  return cardContent;
}

function Meta({ label, value, valueColour = colors.text }: { label: string; value: string; valueColour?: string }) {
  return <View style={styles.meta}><Text style={styles.metaLabel}>{label}:</Text><Text style={[styles.metaValue, { color: valueColour }]} numberOfLines={1}>{value || '—'}</Text></View>;
}
function Action({ icon, label, onPress, danger }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={5} style={styles.action}><Ionicons name={icon} size={15} color={danger ? colors.danger : colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 9, marginBottom: 9, overflow: 'hidden', boxShadow: '0 1px 5px rgba(32,24,65,0.06)' },
  cardDragging: { borderStyle: 'dashed', borderColor: colors.primary },
  main: { padding: 11, gap: 5 }, pressed: { backgroundColor: '#FAFBFF' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 }, subject: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  label: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }, labelText: { fontSize: 9, fontWeight: '800' },
  meta: { flexDirection: 'row', gap: 4, alignItems: 'center' }, metaLabel: { width: 29, color: colors.muted, fontSize: 9, fontWeight: '800' }, metaValue: { flex: 1, fontSize: 10, color: colors.text },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, status: { flex: 1, fontSize: 10, fontWeight: '800' }, actions: { flexDirection: 'row', gap: 8 }, action: { minWidth: 22, minHeight: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
});
