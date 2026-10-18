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

const CHANNELS = ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'OTHER'];

export default function FollowUpFormModal({
  visible,
  leadId,
  record,
  defaultAssignee,
  onSaved,
  onClose,
}: Props) {
  const [title, setTitle] = useState(() => record?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => formatDateTime(record?.scheduledAt));
  const [channel, setChannel] = useState(() => record?.channel ?? 'CALL');
  const [assignedTo, setAssignedTo] = useState(() => record?.assignedTo ?? defaultAssignee);
  const [description, setDescription] = useState(() => record?.description ?? '');
  const [outcome, setOutcome] = useState(() => record?.outcome ?? '');
  const [reminderAt, setReminderAt] = useState('');
  const [error, setError] = useState('');

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    saveActivity(leadId, 'followups', body, record ?? undefined)
  );
  const keyFor = useSubmissionKey();

  if (!visible) return null;

  async function handleSave() {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsedScheduled = parseDateTimeInput(scheduledAt);
    if (!parsedScheduled.ok || !parsedScheduled.value) {
      setError('Enter a valid scheduled date & time.');
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      scheduledAt: parsedScheduled.value,
      channel,
      assignedTo: assignedTo.trim() || defaultAssignee,
      description: description.trim() || undefined,
    };

    if (record) {
      if (outcome.trim()) body.outcome = outcome.trim();
    } else {
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
      title={record ? 'Edit Follow-up' : 'Add Follow-up'}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={record ? 'Save Changes' : 'Save Follow-up'}
    >
      <Field label="Title *" value={title} onChange={setTitle} placeholder="e.g. Discuss requirement" />
      <DateField label="Scheduled Date & Time *" value={scheduledAt} onChange={setScheduledAt} />
      <Choices label="Contact Channel *" value={channel} options={CHANNELS} onChange={setChannel} />
      <Field label="Assigned To" value={assignedTo} onChange={setAssignedTo} placeholder={defaultAssignee} />
      <Field label="Notes" value={description} onChange={setDescription} multiline placeholder="Additional notes..." />
      {record ? (
        <Field label="Outcome" value={outcome} onChange={setOutcome} multiline placeholder="Call outcome or remarks..." />
      ) : (
        <DateField label="Optional Linked Reminder" value={reminderAt} onChange={setReminderAt} />
      )}
    </FormShell>
  );
}
