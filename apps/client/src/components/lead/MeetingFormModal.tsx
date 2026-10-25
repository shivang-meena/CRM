import React, { useState } from 'react';
import AssigneeSelect from '@/components/AssigneeSelect';
import { errorMessage } from '@/api/client';
import { saveActivity } from '@/api/leadActivities';
import { useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { usePermissions } from '@/hooks/usePermissions';
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

const MODES = ['ONLINE', 'PHONE', 'IN_PERSON'];

function parseAttendees(raw: string) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const match = /^(.*?)\s*<([^<>]+)>$/.exec(s);
      return match ? { name: match[1].trim(), email: match[2].trim() } : { name: s };
    });
}

function attendeesToString(attendees?: { name: string; email?: string }[]) {
  if (!attendees || !attendees.length) return '';
  return attendees.map((a) => (a.email ? `${a.name} <${a.email}>` : a.name)).join(', ');
}

export default function MeetingFormModal({
  visible,
  leadId,
  record,
  defaultAssignee,
  onSaved,
  onClose,
}: Props) {
  const { canAccess } = usePermissions();
  const [title, setTitle] = useState(() => record?.title ?? '');
  const [startAt, setStartAt] = useState(() => formatDateTime(record?.startAt));
  const [endAt, setEndAt] = useState(() => formatDateTime(record?.endAt));
  const [mode, setMode] = useState(() => record?.mode ?? 'ONLINE');
  const [assignedTo, setAssignedTo] = useState(() => record?.assignedTo ?? defaultAssignee);
  const [assignedToId, setAssignedToId] = useState(record?.assignedToId ?? '');
  const [location, setLocation] = useState(() => record?.location ?? '');
  const [meetingUrl, setMeetingUrl] = useState(() => record?.meetingUrl ?? '');
  const [agenda, setAgenda] = useState(() => record?.agenda ?? '');
  const [attendeesText, setAttendeesText] = useState(() => attendeesToString(record?.attendees));
  const [outcome, setOutcome] = useState(() => record?.outcome ?? '');
  const [reminderAt, setReminderAt] = useState('');
  const [error, setError] = useState('');

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    saveActivity(leadId, 'meetings', body, record ?? undefined)
  );
  const keyFor = useSubmissionKey();

  if (!visible) return null;

  async function handleSave() {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsedStart = parseDateTimeInput(startAt);
    if (!parsedStart.ok || !parsedStart.value) {
      setError('Enter a valid meeting start date & time.');
      return;
    }
    const parsedEnd = parseDateTimeInput(endAt);
    if (!parsedEnd.ok || !parsedEnd.value) {
      setError('Enter a valid meeting end date & time.');
      return;
    }
    if (new Date(parsedEnd.value) <= new Date(parsedStart.value)) {
      setError('Meeting end time must be after its start time.');
      return;
    }
    if (mode === 'IN_PERSON' && !location.trim()) {
      setError('Please provide a location for in-person meetings.');
      return;
    }
    if (mode === 'ONLINE' && meetingUrl.trim() && !/^https?:\/\//i.test(meetingUrl.trim())) {
      setError('Meeting link must start with http:// or https://');
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      startAt: parsedStart.value,
      endAt: parsedEnd.value,
      timezone: 'Asia/Kolkata',
      mode,
      assignedTo: assignedTo.trim() || defaultAssignee,
      assignedToId: assignedToId || undefined,
      agenda: agenda.trim() || undefined,
      location: location.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      attendees: parseAttendees(attendeesText),
    };

    if (record) {
      if (outcome.trim()) body.outcome = outcome.trim();
    } else {
      if (canAccess('reminder') && reminderAt) {
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
      title={record ? 'Edit Meeting' : 'Schedule Meeting'}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={record ? 'Save Changes' : 'Schedule Meeting'}
    >
      <Field label="Title *" value={title} onChange={setTitle} placeholder="e.g. Product Demo & Proposal" />
      <DateField label="Meeting Start Time *" value={startAt} onChange={setStartAt} />
      <DateField label="Meeting End Time *" value={endAt} onChange={setEndAt} />
      <Choices label="Meeting Mode *" value={mode} options={MODES} onChange={setMode} />
      {mode === 'IN_PERSON' ? (
        <Field label="Location *" value={location} onChange={setLocation} placeholder="Office address / room" />
      ) : null}
      {mode === 'ONLINE' ? (
        <Field label="Meeting Link" value={meetingUrl} onChange={setMeetingUrl} placeholder="https://meet.google.com/..." />
      ) : null}
      <AssigneeSelect value={assignedTo} assigneeId={assignedToId} onChange={(name, id) => { setAssignedTo(name); setAssignedToId(id); }} />
      <Field label="Agenda" value={agenda} onChange={setAgenda} multiline placeholder="Meeting agenda / points..." />
      <Field
        label="Attendees (Comma-separated: John <john@example.com>, Alice)"
        value={attendeesText}
        onChange={setAttendeesText}
        multiline
        placeholder="e.g. Rajesh <rajesh@client.com>, Priya"
      />
      {record ? (
        <Field label="Outcome" value={outcome} onChange={setOutcome} multiline placeholder="Meeting outcome / minutes..." />
      ) : (
        canAccess('reminder') ? <DateField label="Optional Linked Reminder" value={reminderAt} onChange={setReminderAt} /> : null
      )}
    </FormShell>
  );
}
