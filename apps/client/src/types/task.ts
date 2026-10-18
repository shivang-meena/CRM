export type TaskStatus = 'NEW' | 'IN_FEEDBACK' | 'COMPLETED' | 'REJECTED' | 'PROCESSING';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskRecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type TaskLabel = { id: string; name: string; normalizedName: string; colour: string };
export type Task = {
  id: string;
  subject: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  labelId: string | null;
  label?: TaskLabel | null;
  startAt: string;
  endAt: string;
  assignedTo: string;
  createdById: string;
  createdByName: string;
  updatedById: string | null;
  updatedByName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  recurrenceSeriesId: string | null;
  occurrenceAt: string | null;
  recurrenceSeries?: { id: string; frequency: TaskRecurrenceFrequency; interval: number; recurrenceEndsAt: string | null; active: boolean; version: number } | null;
};

export type TaskHistory = {
  id: string;
  action: string;
  actorName: string;
  changes: Record<string, { before: unknown; after: unknown }> | null;
  createdAt: string;
};

export type TaskFilters = {
  page?: number; pageSize?: number; search?: string; status?: TaskStatus; priority?: TaskPriority;
  labelId?: string; assignedTo?: string; from?: string; to?: string; overdue?: 'true' | 'false';
};
export type TaskPage = { items: Task[]; total: number; page: number; pageSize: number };
export type TaskBoardColumn = { status: TaskStatus; items: Task[]; total: number; page: number; pageSize: number };
export type TaskBoard = { columns: TaskBoardColumn[] };
export type TaskSummary = {
  total: number;
  status: { status: TaskStatus; total: number }[];
  priority: { priority: TaskPriority; total: number }[];
  overdue: number;
};
