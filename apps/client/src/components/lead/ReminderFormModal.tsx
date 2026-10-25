import React, { useState } from 'react';
import AssigneeSelect from '@/components/AssigneeSelect';
import { useAuth } from '@/context/AuthContext';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { saveActivity } from '@/api/leadActivities';
import { useActivities, useCrmMutation, useSubmissionKey } from '@/hooks/useLeadActivities';
import { ActivityRecord } from '@/types/leadActivities';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import { Choices, DateField, Field, FormShell, labelFor } from './FormControls';
import { colors } from '@/theme/colors';

type Props = {
  visible: boolean;
  leadId: string;
  record?: ActivityRecord | null;
  onSaved: () => void;
  onClose: () => void;
};

type LinkType = 'none' | 'followups' | 'meetings';

export default function ReminderFormModal({
  visible,
  leadId,
  record,
  onSaved,
  onClose,
}: Props) {
  const { userName } = useAuth();
  const [assignedTo, setAssignedTo] = useState(record?.assignedTo ?? userName);
  const [assignedToId, setAssignedToId] = useState(record?.assignedToId ?? '');
  const [title, setTitle] = useState(() => record?.title ?? '');
  const [message, setMessage] = useState(() => record?.message ?? '');
  const [remindAt, setRemindAt] = useState(() => formatDateTime(record?.remindAt));
  const [linkType, setLinkType] = useState<LinkType>(() =>
    record?.followUpId ? 'followups' : record?.meetingId ? 'meetings' : 'none'
  );
  const [linkedId, setLinkedId] = useState<string>(() =>
    record?.followUpId ?? record?.meetingId ?? ''
  );
  const [error, setError] = useState('');

  const followups = useActivities(leadId, 'followups', { pageSize: 50, status: 'PENDING' }, linkType === 'followups');
  const meetings = useActivities(leadId, 'meetings', { pageSize: 50, status: 'SCHEDULED' }, linkType === 'meetings');

  const pendingList = linkType === 'followups'
    ? followups.data?.items ?? []
    : linkType === 'meetings'
    ? meetings.data?.items ?? []
    : [];

  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) =>
    saveActivity(leadId, 'reminders', body, record ?? undefined)
  );
  const keyFor = useSubmissionKey();

  if (!visible) return null;

  async function handleSave() {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsedRemind = parseDateTimeInput(remindAt);
    if (!parsedRemind.ok || !parsedRemind.value) {
      setError('Enter a valid reminder date & time.');
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      message: message.trim() || undefined,
      remindAt: parsedRemind.value,
      assignedTo,
      assignedToId: assignedToId || undefined,
    };

    if (linkType !== 'none' && linkedId) {
      if (linkType === 'followups') body.followUpId = linkedId;
      if (linkType === 'meetings') body.meetingId = linkedId;
    }

    if (!record) {
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
      title={record ? 'Edit Reminder' : 'Add Reminder'}
      error={error || (mutation.error ? errorMessage(mutation.error) : '')}
      busy={mutation.isPending}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={record ? 'Save Changes' : 'Save Reminder'}
    >
      <Field label="Title *" value={title} onChange={setTitle} placeholder="e.g. Call client about invoice" />
      <DateField label="Alert Date & Time *" value={remindAt} onChange={setRemindAt} />
      <Field label="Message" value={message} onChange={setMessage} multiline placeholder="Reminder details..." />
      <AssigneeSelect value={assignedTo} assigneeId={assignedToId} onChange={(name, id) => { setAssignedTo(name); setAssignedToId(id); }} />

      <Choices
        label="Link to an activity (optional)"
        value={linkType}
        options={['none', 'followups', 'meetings']}
        onChange={(v) => {
          setLinkType(v as LinkType);
          setLinkedId('');
        }}
      />

      {linkType !== 'none' ? (
        <View style={styles.linkedPicker}>
          <Text style={styles.pickerLabel}>Choose Pending {labelFor(linkType)}</Text>
          {pendingList.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.pickerLabel}>Selected item</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {pendingList.map((item) => {
                    const isSelected = linkedId === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                        ]}
                        onPress={() => setLinkedId(isSelected ? '' : item.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.emptyNotice}>
              {followups.isLoading || meetings.isLoading
                ? 'Loading activities...'
                : `No pending ${linkType} found for this lead.`}
            </Text>
          )}
        </View>
      ) : null}
    </FormShell>
  );
}

const styles = StyleSheet.create({
  linkedPicker: {
    gap: 8,
    padding: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  emptyNotice: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
});
