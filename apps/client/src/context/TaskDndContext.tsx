import React, { createContext, useContext, useState } from 'react';
import { TaskStatus } from '@/types/task';

interface TaskDndContextType {
  draggingTaskId: string | null;
  startDrag: (id: string) => void;
  endDrag: () => void;
  dropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

const TaskDndContext = createContext<TaskDndContextType | null>(null);

export function TaskDndProvider({
  children,
  onDropTask,
}: {
  children: React.ReactNode;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const startDrag = (id: string) => setDraggingTaskId(id);
  const endDrag = () => setDraggingTaskId(null);
  const dropTask = (taskId: string, targetStatus: TaskStatus) => {
    setDraggingTaskId(null);
    onDropTask(taskId, targetStatus);
  };

  return <TaskDndContext.Provider value={{ draggingTaskId, startDrag, endDrag, dropTask }}>{children}</TaskDndContext.Provider>;
}

export function useTaskDnd() {
  return useContext(TaskDndContext);
}
