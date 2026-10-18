import React, { useState } from 'react';
import { errorMessage } from '@/api/client';
import { saveActivity } from '@/api/leadActivities';
import { useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { ActivityRecord } from '@/types/leadActivities';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import { Choices, DateField, Field, FormShell } from './FormControls';

type Props = {
  visible: boolean;
  leadId: string;
  record?: ActivityRecord | null;
  defaultAssignee: string;
  onSaved: () => void;
  onClose: () => void;
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function TaskFormModal({
  visible,
  leadId,
  record,
  defaultAssignee,
  onSaved,
  onClose,
}: Props) {
  const [title, setTitle] = useState(() => record?.title ?? '');
  const [dueAt, setDueAt] = useState(() => formatDateTime(record?.dueAt));
  const [priority, setPriority] = useState(() => record?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState(() => record?.status ?? 'TODO');
  const [assignedTo, setAssignedTo] = useState(() => record?.assignedTo ?? defaultAssignee);
  const [description, setDescription] = useState(() => record?.description ?? '');
  const [reminderAt, setReminderAt] = useState('');
  const [error, setError] = useState('');

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    saveActivity(leadId, 'tasks', body, record ?? undefined)
  );
  const keyFor = useSubmissionKey();

  if (!visible) return null;

  async function handleSave() {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsedDue = parseDateTimeInput(dueAt);
    if (!parsedDue.ok || !parsedDue.value) {
      setError('Enter a valid due date & time.');
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      dueAt: parsedDue.value,
      priority,
      assignedTo: assignedTo.trim() || defaultAssignee,
      description: description.trim() || undefined,
      status,
    };

    if (!record) {
      if (reminderAt) {
        const parsedReminder = parseDateTimeInput(reminderAt);
        if (!parsedReminder.ok || !parsedReminder.value) {
          setError('Enter a valid linked reminder date & time.');
          return;
        }
        body.reminderAt = parsedReminder.value;
      }
      body.requestKey = keyFor(body);
    }

    try {
      await mutation.mutateAsync(body);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <FormShell
      title={record ? 'Edit Task' : 'Add Task'}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={record ? 'Save Changes' : 'Save Task'}
    >
      <Field label="Title *" value={title} onChange={setTitle} placeholder="e.g. Send product catalog" />
      <DateField label="Due Date & Time *" value={dueAt} onChange={setDueAt} />
      <Choices label="Priority *" value={priority} options={PRIORITIES} onChange={setPriority} />
      <Choices label="Status" value={status} options={STATUSES} onChange={setStatus} />
      <Field label="Assigned To" value={assignedTo} onChange={setAssignedTo} placeholder={defaultAssignee} />
      <Field label="Description" value={description} onChange={setDescription} multiline placeholder="Work details..." />
      {!record ? (
        <DateField label="Optional Linked Reminder" value={reminderAt} onChange={setReminderAt} />
      ) : null}
    </FormShell>
  );
}
