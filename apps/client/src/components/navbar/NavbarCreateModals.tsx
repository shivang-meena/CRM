import React from 'react';
import LeadFormModal from '@/components/LeadFormModal';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import NoteFormModal from '@/components/notes/NoteFormModal';
import StandaloneMeetingFormModal from '@/components/meetings/StandaloneMeetingFormModal';
import StandaloneReminderFormModal from '@/components/reminders/StandaloneReminderFormModal';
import { useAuth } from '@/context/AuthContext';
import { useNoteActions } from '@/hooks/useNotes';
import { useStandaloneActivityActions } from '@/hooks/useStandaloneActivities';
import { useTaskActions, useTaskLabels } from '@/hooks/useTasks';

export type CreateAction = 'lead' | 'task' | 'reminder' | 'meeting' | 'note';

type Props = { action: CreateAction | null; onClose: () => void };

export default function NavbarCreateModals({ action, onClose }: Props) {
  const { userName } = useAuth();
  const taskLabels = useTaskLabels();
  const taskActions = useTaskActions();
  const noteActions = useNoteActions();
  const standaloneActions = useStandaloneActivityActions();

  return <>
    {action === 'lead' ? <LeadFormModal visible lead={null} defaultAssignee={userName} onClose={onClose} /> : null}
    {action === 'task' ? <TaskFormModal visible task={null} userName={userName} labels={taskLabels.data ?? []} onClose={onClose} onSave={async (data) => { await taskActions.create.mutateAsync(data); onClose(); }} onCreateLabel={async (name, colour) => taskActions.createLabel.mutateAsync({ name, colour })} /> : null}
    {action === 'meeting' ? <StandaloneMeetingFormModal visible record={null} userName={userName} onClose={onClose} onSave={async (data) => { await standaloneActions.createMeeting.mutateAsync(data); }} /> : null}
    {action === 'reminder' ? <StandaloneReminderFormModal visible record={null} onClose={onClose} onSave={async (data) => { await standaloneActions.createReminder.mutateAsync(data); }} /> : null}
    {action === 'note' ? <NoteFormModal visible note={null} onClose={onClose} onSave={async (content) => { await noteActions.create.mutateAsync({ content, requestKey: 'note_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10) }); onClose(); }} /> : null}
  </>;
}
