import { api } from './client';
import { Task, TaskBoard, TaskFilters, TaskHistory, TaskLabel, TaskPage, TaskStatus, TaskSummary } from '@/types/task';

export async function fetchTasks(filters: TaskFilters) { return (await api.get<TaskPage>('/tasks', { params: filters })).data; }
export async function fetchTaskBoard(filters: TaskFilters) { return (await api.get<TaskBoard>('/tasks/board', { params: filters })).data; }
export async function fetchTaskSummary(filters: TaskFilters) { return (await api.get<TaskSummary>('/tasks/summary', { params: filters })).data; }
export async function fetchTaskReport(filters: TaskFilters) { return (await api.get<TaskSummary>('/tasks/reports/summary', { params: filters })).data; }
export async function fetchTask(id: string) { return (await api.get<Task>(`/tasks/${id}`)).data; }
export async function fetchTaskHistory(id: string) { return (await api.get<TaskHistory[]>(`/tasks/${id}/history`)).data; }
export async function createTask(data: Record<string, unknown>) { return (await api.post<Task>('/tasks', data)).data; }
export async function updateTask(id: string, data: Record<string, unknown>) { return (await api.patch<Task>(`/tasks/${id}`, data)).data; }
export async function changeTaskStatus(id: string, version: number, status: TaskStatus) { return (await api.patch<Task>(`/tasks/${id}/status`, { version, status })).data; }
export async function deleteTask(id: string, version: number) { return (await api.delete(`/tasks/${id}`, { data: { version } })).data; }
export async function fetchTaskLabels() { return (await api.get<TaskLabel[]>('/task-labels')).data; }
export async function createTaskLabel(data: { name: string; colour: string }) { return (await api.post<TaskLabel>('/task-labels', data)).data; }
export async function stopTaskRecurrenceSeries(id: string, version: number) { return (await api.post(`/task-recurrence-series/${id}/stop`, { version })).data; }
