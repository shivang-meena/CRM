import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeTaskStatus, createTask, createTaskLabel, deleteTask, fetchTask, fetchTaskBoard, fetchTaskHistory,
  fetchTaskLabels, fetchTaskReport, fetchTasks, fetchTaskSummary, updateTask,
  stopTaskRecurrenceSeries,
} from '@/api/tasks';
import { TaskFilters, TaskStatus } from '@/types/task';

export function useTasks(filters: TaskFilters, enabled = true) {
  return useQuery({ queryKey: ['tasks', filters], queryFn: () => fetchTasks(filters), placeholderData: keepPreviousData, enabled });
}
export function useTaskBoard(filters: TaskFilters, enabled = true) {
  return useQuery({ queryKey: ['tasks-board', filters], queryFn: () => fetchTaskBoard(filters), placeholderData: keepPreviousData, enabled });
}
export function useTaskSummary(filters: TaskFilters, enabled = true) {
  return useQuery({ queryKey: ['tasks-summary', filters], queryFn: () => fetchTaskSummary(filters), placeholderData: keepPreviousData, enabled });
}
export function useTaskReport(filters: TaskFilters, enabled = true) {
  return useQuery({ queryKey: ['tasks-report', filters], queryFn: () => fetchTaskReport(filters), placeholderData: keepPreviousData, enabled });
}
export function useTask(id: string | null) { return useQuery({ queryKey: ['task', id], queryFn: () => fetchTask(id!), enabled: !!id }); }
export function useTaskHistory(id: string | null) { return useQuery({ queryKey: ['task-history', id], queryFn: () => fetchTaskHistory(id!), enabled: !!id }); }
export function useTaskLabels() { return useQuery({ queryKey: ['task-labels'], queryFn: fetchTaskLabels }); }
export function useDashboardStandaloneTasks(filters: TaskFilters) {
  return useQuery({ queryKey: ['dashboard-standalone-tasks', filters], queryFn: () => fetchTasks({ ...filters, page: 1, pageSize: 100 }), refetchInterval: 60000 });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['tasks'] });
  void qc.invalidateQueries({ queryKey: ['tasks-board'] });
  void qc.invalidateQueries({ queryKey: ['tasks-summary'] });
  void qc.invalidateQueries({ queryKey: ['tasks-report'] });
  void qc.invalidateQueries({ queryKey: ['task'] });
  void qc.invalidateQueries({ queryKey: ['task-history'] });
  void qc.invalidateQueries({ queryKey: ['task-labels'] });
  void qc.invalidateQueries({ queryKey: ['dashboard-standalone-tasks'] });
}

export function useTaskActions() {
  const qc = useQueryClient();
  const options = { onSuccess: () => invalidate(qc) };
  return {
    create: useMutation({ mutationFn: createTask, ...options }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateTask(id, data), ...options }),
    status: useMutation({ mutationFn: ({ id, version, status }: { id: string; version: number; status: TaskStatus }) => changeTaskStatus(id, version, status), ...options }),
    remove: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => deleteTask(id, version), ...options }),
    createLabel: useMutation({ mutationFn: createTaskLabel, ...options }),
    stopSeries: useMutation({ mutationFn: ({ id, version }: { id: string; version: number }) => stopTaskRecurrenceSeries(id, version), ...options }),
  };
}
