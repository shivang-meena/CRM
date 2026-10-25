import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import { useModuleQuery } from '@/hooks/useModuleQuery';
import { fetchLeadServices, LEAD_SERVICES_KEY } from '@/api/serviceMaster';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { ProfileSelect } from '@/settings/ProfileFields';
import { INDIA_STATES } from '@/settings/profileOptions';
import {
  Lead, LeadInput, LeadSource, LeadStatus, SOURCE_LIST, STATUS_LIST,
} from '@/types/lead';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import Button from './Button';
import DateTimePickerModal from './DateTimePickerModal';
import Stars from './Stars';
import AssigneeSelect from './AssigneeSelect';
import { useErrorToast } from './FeedbackToast';

type Props = {
  visible: boolean;
  lead: Lead | null; // null = create mode, Lead = edit mode
  defaultAssignee: string;
  onClose: () => void;
};

type FormState = {
  name: string; companyName: string; phone: string; email: string;
  address: string; state: string; comment: string; reference: string;
  serviceId: string;
  status: LeadStatus; source: LeadSource; label: string;
  estimatedAmount: string; rating: number; followUp: string; assignedTo: string; assignedToId: string;
};

const emptyForm = (assignee: string): FormState => ({
  name: '', companyName: '', phone: '', email: '', address: '', state: '', comment: '', reference: '',
  serviceId: '',
  status: 'NEW', source: 'CUSTOMER_REFERENCE', label: '',
  estimatedAmount: '', rating: 0, followUp: '', assignedTo: assignee, assignedToId: '',
});

const fromLead = (l: Lead): FormState => ({
  name: l.name, companyName: l.companyName ?? '', phone: l.phone, email: l.email ?? '',
  address: l.address ?? '', state: l.state ?? '', comment: l.comment ?? '', reference: l.reference ?? '',
  serviceId: l.serviceId ?? '',
  status: l.status, source: l.source, label: l.label ?? '',
  estimatedAmount: String(l.estimatedAmount), rating: l.rating,
  followUp: formatDateTime(l.nextFollowUpAt), assignedTo: l.assignedTo, assignedToId: l.assignedToId ?? '',
});

function TextField(props: {
  label: string; value: string; onChangeText: (v: string) => void;
  multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }]}
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChipRow<T extends string>(props: {
  label: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.chips}>
        {props.options.map((o) => {
          const selected = o.key === props.value;
          return (
            <Pressable
              key={o.key}
              onPress={() => props.onChange(o.key)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function LeadFormModal({ visible, lead, defaultAssignee, onClose }: Props) {
  const create = useCreateLead();
  const update = useUpdateLead();
  const services = useModuleQuery('lead', { queryKey: LEAD_SERVICES_KEY, queryFn: fetchLeadServices, enabled: visible });
  const statusesQuery = useLeadStatuses();
  const activeStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
  const statusOptions = activeStatuses.length > 0
    ? activeStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
    : STATUS_LIST;

  const [f, setF] = useState<FormState>(emptyForm(defaultAssignee));
  const [err, setErr] = useState('');
  useErrorToast(err, 'Lead needs attention');
  const [showPicker, setShowPicker] = useState(false);
  const busy = create.isPending || update.isPending;

  useEffect(() => {
    if (visible) {
      setErr('');
      setShowPicker(false);
      const initial = lead ? fromLead(lead) : emptyForm(defaultAssignee);
      if (!lead && statusOptions.length > 0) {
        initial.status = statusOptions[0].key;
      }
      setF(initial);
    }
  }, [visible, lead, defaultAssignee, statusOptions.length]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim()) return setErr('Name is required.');
    if (!f.phone.trim()) return setErr('Phone is required.');
    if (f.email.trim() && !f.email.includes('@')) return setErr('Enter a valid email address.');
    const amount = f.estimatedAmount.trim() === '' ? 0 : Number(f.estimatedAmount);
    if (isNaN(amount) || amount < 0) return setErr('Estimated Amount must be a number.');
    const date = parseDateTimeInput(f.followUp);
    if (!date.ok) return setErr('Follow Up Date must look like 25-12-2026 18:30');

    const body: LeadInput = {
      name: f.name.trim(),
      companyName: f.companyName.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      address: f.address.trim(),
      state: f.state.trim() || undefined,
      comment: f.comment.trim(),
      reference: f.reference.trim(),
      serviceId: f.serviceId || null,
      status: f.status,
      source: f.source,
      label: f.label.trim(),
      estimatedAmount: amount,
      rating: f.rating,
      ...(!lead ? { nextFollowUpAt: date.value } : { version: lead.version }),
      assignedTo: f.assignedTo.trim() || defaultAssignee,
      assignedToId: f.assignedToId || undefined,
    };

    try {
      if (lead) await update.mutateAsync({ id: lead.id, data: body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>{lead ? 'Edit Lead' : 'Add Lead'}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <TextField label="Name *" value={f.name} onChangeText={(v) => set('name', v)} />
            <TextField label="Company Name" value={f.companyName} onChangeText={(v) => set('companyName', v)} />
            <View style={styles.field}>
              <ProfileSelect
                label="Service"
                allowCustom={false}
                value={services.data?.find((row) => row.id === f.serviceId)?.name || (f.serviceId === lead?.serviceId ? lead.service?.name : '') || ''}
                options={(services.data ?? []).map((row) => row.name)}
                onChange={(name) => set('serviceId', services.data?.find((row) => row.name === name)?.id ?? '')}
              />
              {services.isLoading ? <Text style={styles.label}>Loading services...</Text> : null}
              {services.isError ? <>
                <Text accessibilityRole="alert" style={styles.err}>{errorMessage(services.error)}</Text>
                <Button title="Retry Services" variant="outline" onPress={() => { void services.refetch(); }} />
              </> : null}
              {services.isSuccess && !services.data?.length ? <Text style={styles.label}>No active services. Add services in General Settings.</Text> : null}
              {f.serviceId ? <Button title="Clear Service" variant="outline" onPress={() => set('serviceId', '')} /> : null}
            </View>
            <TextField label="Phone *" value={f.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <TextField label="Email" value={f.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
            <TextField label="Address" value={f.address} onChangeText={(v) => set('address', v)} multiline />
            <View style={styles.field}>
              <ProfileSelect
                label="State"
                allowCustom={true}
                value={f.state}
                options={INDIA_STATES}
                onChange={(val) => set('state', val)}
              />
            </View>
            <TextField label="Comment" value={f.comment} onChangeText={(v) => set('comment', v)} multiline />
            <TextField label="Reference" value={f.reference} onChangeText={(v) => set('reference', v)} />
            <ChipRow label="Status" options={statusOptions} value={f.status} onChange={(v) => set('status', v)} />
            <ChipRow label="Source" options={SOURCE_LIST} value={f.source} onChange={(v) => set('source', v)} />
            <TextField label="Label" value={f.label} onChangeText={(v) => set('label', v)} />
            <TextField label="Estimated Amount (₹)" value={f.estimatedAmount} onChangeText={(v) => set('estimatedAmount', v)} keyboardType="numeric" />
            <View style={styles.field}>
              <Text style={styles.label}>Rating</Text>
              <Stars value={f.rating} size={26} onChange={(v) => set('rating', v)} />
            </View>
            {!lead ? <View style={styles.field}>
              <Text style={styles.label}>Follow Up Date & Time · IST</Text>
              <Pressable
                style={styles.pickerTrigger}
                onPress={() => setShowPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primaryText} />
                <Text style={[styles.pickerTriggerText, !f.followUp && styles.pickerPlaceholder]}>
                  {f.followUp || 'Choose Date & Time'}
                </Text>
                {!!f.followUp ? (
                  <Pressable
                    hitSlop={10}
                    onPress={(e) => {
                      e.stopPropagation();
                      set('followUp', '');
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                ) : (
                  <Ionicons name="time-outline" size={18} color={colors.muted} />
                )}
              </Pressable>
            </View>
            : <Text style={styles.label}>Next follow-up: {f.followUp || 'None'}. Manage dates in the FollowUp section.</Text>}
            <AssigneeSelect value={f.assignedTo} assigneeId={f.assignedToId} onChange={(name, id) => setF(current => ({ ...current, assignedTo: name, assignedToId: id }))} />
          </ScrollView>
          <View style={styles.footer}>
            {!!err && <Text style={styles.err}>{err}</Text>}
            <View style={styles.btnRow}>
              <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
              <Button title="Save Lead" onPress={save} loading={busy} />
            </View>
          </View>
        </View>
      </View>

      <DateTimePickerModal
        visible={showPicker}
        value={f.followUp}
        onSelect={(val) => set('followUp', val)}
        onClose={() => setShowPicker(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 12 },
  box: { width: '100%', maxWidth: 640, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 8, overflow: 'hidden' },
  titleBar: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingVertical: 14 },
  titleText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  body: { padding: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text, backgroundColor: colors.white,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  pickerTriggerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  pickerPlaceholder: {
    color: colors.muted,
    fontWeight: '400',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  err: { color: colors.danger, fontSize: 13 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
