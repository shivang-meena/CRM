import React, { useMemo, useState } from 'react';
import AssigneeSelect from '@/components/AssigneeSelect';
import { historyChanges } from '@/utils/history';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { DateField, Field, FormShell, labelFor, Pager, ui } from './FormControls';
import { formatDateTime, parseDateTimeInput, crmDayRange } from '@/utils/format';
import { useActivities, useCrmMutation, useHistory, useSectionSummary, useSubmissionKey } from '@/hooks/useLeadActivities';
import { ActivityKind, ActivityRecord, HistoryRecord, ListFilters, SectionSummary } from '@/types/leadActivities';
import { CreateDocument } from './LeadSectionsTypes';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { saveActivity, changeActivity } from '@/api/leadActivities';

const specs = {
  followups: { label: 'FollowUp', date: 'scheduledAt', dateLabel: 'Follow-up date & time', choices: { Channel: ['CALL','WHATSAPP','EMAIL','VISIT','OTHER'], Status: ['PENDING','COMPLETED','CANCELLED'] } },
  reminders: { label: 'Reminder', date: 'remindAt', dateLabel: 'Reminder date & time', choices: { Status: ['PENDING','TRIGGERED','DISMISSED','CANCELLED'] } },
  meetings: { label: 'Meeting', date: 'startAt', dateLabel: 'Meeting start', choices: { Mode: ['ONLINE','PHONE','IN_PERSON'], Status: ['SCHEDULED','COMPLETED','CANCELLED'] } },
} as const;
type Draft = Record<string, string> & { attendeesText: string };

function initialDraft(kind: ActivityKind, row?: ActivityRecord): Draft {
  const s = specs[kind];
  return {
    title: row?.title ?? '', assignedTo: row?.assignedTo ?? '', assignedToId: row?.assignedToId ?? '', description: row?.description ?? '',
    agenda: row?.agenda ?? '', outcome: row?.outcome ?? '', message: row?.message ?? '',
    [s.date]: formatDateTime((row?.[s.date] as string | undefined) ?? ''),
    endAt: formatDateTime(row?.endAt), channel: row?.channel ?? 'CALL',
    status: row?.status ?? 'PENDING',
    mode: row?.mode ?? 'ONLINE', location: row?.location ?? '', meetingUrl: row?.meetingUrl ?? '',
    attendeesText: row?.attendees?.map(x => x.email ? x.name + ' <' + x.email + '>' : x.name).join(', ') ?? '',
    followUpId: row?.followUpId ?? '', meetingId: row?.meetingId ?? '',
  };
}
function toIso(value: string): string | null {
  const result = parseDateTimeInput(value);
  return result.ok ? result.value : null;
}
function parseAttendees(value: string) {
  return value.split(',').map(raw => raw.trim()).filter(Boolean).map(raw => {
    const match = /^(.*?)\s*<([^<>]+)>$/.exec(raw);
    return match ? { name: match[1].trim(), email: match[2].trim() } : { name: raw };
  });
}
function ChoiceField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (x: string) => void }) {
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={ui.row}>
          {options.map((option) => (
            <Pressable
              key={option || 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: option === value }}
              style={[ui.choice, value === option && ui.choiceOn]}
              onPress={() => onChange(option)}
            >
              <Text style={ui.text}>{option ? labelFor(option) : 'All'}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ActivityForm({ leadId, kind, row, actor, onSaved, onClose }: { leadId: string; kind: ActivityKind; row?: ActivityRecord; actor: string; onSaved: () => void; onClose: () => void }) {
  const [draft, setDraft] = useState(() => initialDraft(kind, row));
  const [error, setError] = useState('');
  const [linkType, setLinkType] = useState<'none' | 'followups' | 'meetings'>(() => row?.followUpId ? 'followups' : row?.meetingId ? 'meetings' : 'none');
  const s = specs[kind];
  const set = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const followups = useActivities(leadId, 'followups', { pageSize: 100, status: 'PENDING' }, kind === 'reminders' && linkType === 'followups');
  const meetings = useActivities(leadId, 'meetings', { pageSize: 100, status: 'SCHEDULED' }, kind === 'reminders' && linkType === 'meetings');
  const choices = linkType === 'followups' ? followups.data?.items ?? [] : linkType === 'meetings' ? meetings.data?.items ?? [] : [];
  const mutation = useCrmMutation(leadId, (body: Record<string, unknown>) => saveActivity(leadId, kind, body, row));
  const keyFor = useSubmissionKey();
  async function save() {
    setError('');
    if (!draft.title.trim()) return setError('Title is required.');
    let body: Record<string, unknown> = { title: draft.title.trim(), assignedTo: draft.assignedTo.trim() || actor, assignedToId: draft.assignedToId || undefined };
    const time = toIso(draft[s.date]);
    if (!time) return setError('Enter a valid date and time using the calendar.');
    if (kind === 'followups') body = { ...body, description: draft.description.trim(), channel: draft.channel, scheduledAt: time };
    if (kind === 'meetings') {
      const end = toIso(draft.endAt);
      if (!end || new Date(end) <= new Date(time)) return setError('Meeting end time must be after its start.');
      if (draft.mode === 'IN_PERSON' && !draft.location.trim()) return setError('Add a location for an in-person meeting.');
      if (draft.mode === 'ONLINE' && draft.meetingUrl.trim() && !/^https?:\/\//i.test(draft.meetingUrl)) return setError('Meeting link must start with http:// or https://.');
      body = { ...body, agenda: draft.agenda.trim(), startAt: time, endAt: end, timezone: 'Asia/Kolkata', mode: draft.mode, location: draft.location.trim(), meetingUrl: draft.meetingUrl.trim(), attendees: parseAttendees(draft.attendeesText) };
    }
    if (kind === 'reminders') {
      const linkedField = linkType === 'followups' ? 'followUpId' : 'meetingId';
      body = { ...body, message: draft.message.trim(), remindAt: time, ...(linkType !== 'none' && draft[linkedField] ? { [linkedField]: draft[linkedField] } : {}) };
    }
    const reminderAt = draft.reminderAt ? toIso(draft.reminderAt) : null;
    if (draft.reminderAt && !reminderAt) return setError('Choose a valid linked reminder date.');
    if (kind !== 'reminders' && reminderAt) body.reminderAt = reminderAt;
    if (!row) body.requestKey = keyFor(body);
    try { await mutation.mutateAsync(body); onSaved(); } catch (e) { setError(errorMessage(e)); }
  }
  const fields = (specs[kind].choices as unknown as Record<string, string[]>);
  return <FormShell title={(row ? 'Edit ' : 'Add ') + s.label} error={error || (mutation.error ? errorMessage(mutation.error) : '')} busy={mutation.isPending} onClose={onClose} onSave={save} saveLabel={row ? 'Save Changes' : 'Save ' + s.label}>
    <Field label="Title *" value={draft.title} onChange={v => set('title', v)} />
    <AssigneeSelect value={draft.assignedTo || actor} assigneeId={draft.assignedToId} onChange={(name, id) => setDraft(current => ({ ...current, assignedTo: name, assignedToId: id }))} />
    <DateField label={s.dateLabel} value={draft[s.date]} onChange={v => set(s.date, v)} />
    {kind === 'meetings' ? <><DateField label="Meeting end" value={draft.endAt} onChange={v => set('endAt', v)} /><Field label="Agenda" value={draft.agenda} onChange={v => set('agenda', v)} multiline /><ChoiceField label="Meeting mode" value={draft.mode} options={fields.Mode} onChange={v => set('mode', v)} />{draft.mode === 'IN_PERSON' ? <Field label="Location *" value={draft.location} onChange={v => set('location', v)} /> : null}{draft.mode === 'ONLINE' ? <Field label="Meeting link" value={draft.meetingUrl} onChange={v => set('meetingUrl', v)} /> : null}<Field label="Attendees (comma-separated names or Name <email>)" value={draft.attendeesText} onChange={v => set('attendeesText', v)} multiline /></> : null}
    {kind === 'followups' ? <><ChoiceField label="Contact channel" value={draft.channel} options={fields.Channel} onChange={v => set('channel', v)} /><Field label="Notes" value={draft.description} onChange={v => set('description', v)} multiline />{row ? <Field label="Outcome" value={draft.outcome} onChange={v => set('outcome', v)} multiline /> : null}</> : null}
    {kind === 'reminders' ? <><Field label="Message" value={draft.message} onChange={v => set('message', v)} multiline /><ChoiceField label="Link to an activity (optional)" value={linkType} options={['none','followups','meetings']} onChange={v => { setLinkType(v as typeof linkType); set('followUpId',''); set('meetingId',''); }} />{linkType !== 'none' ? choices.length ? <View style={ui.field}><Text style={ui.label}>Select activity</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={ui.row}>{choices.map(c => { const field = linkType === 'followups' ? 'followUpId' : 'meetingId'; const cur = draft[field] === c.id; return <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: cur }} style={[ui.choice, cur && ui.choiceOn]} onPress={() => set(field, cur ? '' : c.id)}><Text style={ui.text}>{c.title}</Text></Pressable>; })}</View></ScrollView></View> : <Text style={ui.muted}>{followups.isLoading || meetings.isLoading ? 'Loading activities…' : 'No pending activities available.'}</Text> : null}</> : null}
    {kind !== 'reminders' && !row ? <DateField label="Optional linked reminder · IST" value={draft.reminderAt ?? ''} onChange={v => set('reminderAt', v)} /> : null}
  </FormShell>;
}

function ActionPrompt({ leadId, kind, row, action, onClose }: { leadId: string; kind: ActivityKind; row: ActivityRecord; action: string; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const mutation = useCrmMutation(leadId, () => changeActivity(leadId, kind, row, action, value));
  const outcomeRequired = action === 'complete' && kind === 'followups';
  const reasonRequired = action === 'cancel';
  async function submit() {
    if ((outcomeRequired || reasonRequired) && !value.trim()) return setError(outcomeRequired ? 'Add the call outcome.' : 'Add a reason for cancelling.');
    try { await mutation.mutateAsync(undefined); onClose(); } catch (e) { setError(errorMessage(e)); }
  }
  return <FormShell title={{ complete: 'Complete activity?', cancel: 'Cancel activity?', dismiss: 'Dismiss reminder?', delete: 'Delete activity?' }[action] ?? 'Update activity'} error={error || (mutation.error ? errorMessage(mutation.error) : '')} busy={mutation.isPending} onClose={onClose} onSave={submit} saveLabel={action === 'delete' ? 'Delete' : 'Confirm'}>
    <Text style={ui.text}>{row.title}</Text>
    {outcomeRequired || reasonRequired ? <Field label={outcomeRequired ? 'Outcome *' : 'Reason *'} value={value} onChange={setValue} multiline /> : null}
    {!outcomeRequired && !reasonRequired ? <Text style={ui.muted}>This action updates the activity and adds an entry to lead History.</Text> : null}
  </FormShell>;
}

export function ActivitySection({ leadId, kind, summary }: { leadId: string; kind: ActivityKind; summary?: SectionSummary }) {
  const [filters, setFilters] = useState<ListFilters>({ page: 1, pageSize: 20 });
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState('');
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [adding, setAdding] = useState(false);
  const [prompt, setPrompt] = useState<{ row: ActivityRecord; action: string } | null>(null);
  const { userName } = useAuth();
  const query = useActivities(leadId, kind, filters);
  function setFilter(next: Partial<ListFilters>) { setFilters(f => ({ ...f, ...next, page: 1 })); }
  const overdueCount = kind === 'followups' ? summary?.overdue.followups : undefined;
  return <View style={{ gap: 12 }}>
    <View style={ui.panel}>
      <View style={ui.row}><TextInput accessibilityLabel="Search activities" placeholder="Search title" value={searchText} onChangeText={setSearchText} style={[ui.input,{flex:1,minWidth:150}]} /><Button title="Search" variant="outline" onPress={() => setFilter({ search: searchText.trim() || undefined })} /><Button title="Clear" variant="outline" onPress={() => { setSearchText(''); setStatus(''); setOverdue(''); setFilters({page:1,pageSize:20}); }} /></View>
      {kind === 'followups' ? <View style={ui.row}><ChoiceField label="Status" value={status} options={['','PENDING','COMPLETED','CANCELLED']} onChange={v => { setStatus(v); setFilter({status:v || undefined}); }} />{overdueCount !== undefined ? <Pressable accessibilityRole="button" onPress={() => { const v = overdue === 'true' ? '' : 'true'; setOverdue(v); setFilter({overdue:v || undefined}); }} style={[ui.choice, overdue === 'true' && ui.choiceOn]}><Text style={ui.text}>Overdue{overdueCount ? ' · ' + overdueCount : ''}</Text></Pressable> : null}</View> : null}
    </View>
    {query.isLoading ? <ActivityIndicator color={colors.primary} /> : query.isError ? <View accessibilityRole="alert" style={ui.panel}><Text style={ui.error}>{errorMessage(query.error)}</Text><Button title="Retry" variant="outline" onPress={() => { void query.refetch(); }} /></View> : !query.data?.items.length ? <View style={ui.panel}><Text style={ui.muted}>No {specs[kind].label.toLowerCase()} records yet.</Text></View> : <View style={{ gap: 9 }}>
      {query.data.items.map(row => {
        const date = row.scheduledAt ?? row.dueAt ?? row.remindAt ?? row.startAt;
        const pending = ['PENDING','TODO','IN_PROGRESS','SCHEDULED'].includes(row.status);
        return <View key={row.id} style={ui.panel}>
          <View style={ui.row}><Text style={[ui.label,{flex:1}]}>{row.title}</Text><Text style={ui.muted}>{labelFor(row.status)}</Text></View>
          {date ? <Text style={ui.text}>{formatDateTime(date)} · IST</Text> : null}
          {row.endAt ? <Text style={ui.muted}>Ends {formatDateTime(row.endAt)} IST · {labelFor(row.mode ?? '')}</Text> : null}
          {row.assignedTo ? <Text style={ui.muted}>Assigned to {row.assignedTo}</Text> : null}
          {row.channel ? <Text style={ui.muted}>{labelFor(row.channel)}</Text> : null}
          {(row.description || row.agenda || row.message) ? <Text style={ui.text}>{row.description || row.agenda || row.message}</Text> : null}
          {row.outcome ? <Text style={ui.muted}>Outcome: {row.outcome}</Text> : null}
          <View style={ui.row}>
            {pending ? <Button title={kind === 'reminders' ? 'Dismiss' : 'Complete'} variant="outline" onPress={() => setPrompt({row,action:kind === 'reminders' ? 'dismiss' : 'complete'})} /> : null}
            {pending && kind !== 'reminders' ? <Button title="Edit" variant="outline" onPress={() => setEditing(row)} /> : null}
            {pending ? <Button title="Cancel" variant="outline" onPress={() => setPrompt({row,action:'cancel'})} /> : null}
            <Button title="Delete" variant="danger" onPress={() => setPrompt({row,action:'delete'})} />
          </View>
        </View>;
      })}
      <Pager page={filters.page ?? 1} total={query.data.total} pageSize={filters.pageSize} onChange={page => setFilters(f => ({ ...f,page }))} />
    </View>}
    {adding ? <ActivityForm leadId={leadId} kind={kind} actor={userName} onSaved={() => { setAdding(false); }} onClose={() => setAdding(false)} /> : null}
    {editing ? <ActivityForm key={editing.id + editing.version} leadId={leadId} kind={kind} row={editing} actor={userName} onSaved={() => setEditing(null)} onClose={() => setEditing(null)} /> : null}
    {prompt ? <ActionPrompt leadId={leadId} kind={kind} row={prompt.row} action={prompt.action} onClose={() => setPrompt(null)} /> : null}
  </View>;
}

export function ActivityAction({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>[ui.choice,{backgroundColor:pressed?colors.accentSoft:colors.white}]}><Text style={ui.text}>{icon} {label}</Text></Pressable>;
}

export function HistorySection({ leadId }: { leadId: string }) {
  const [filters, setFilters] = useState<ListFilters>({ page:1,pageSize:20 });
  const [text, setText] = useState('');
  const query = useHistory(leadId, filters);
  return <View style={{gap:12}}>
    <View style={[ui.panel,ui.row]}><TextInput accessibilityLabel="Search history" placeholder="Search history" value={text} onChangeText={setText} style={[ui.input,{flex:1}]} /><Button title="Search" variant="outline" onPress={()=>setFilters({page:1,pageSize:20,search:text.trim()||undefined})} /></View>
    {query.isLoading ? <ActivityIndicator color={colors.primary}/> : query.isError ? <View style={ui.panel}><Text accessibilityRole="alert" style={ui.error}>{errorMessage(query.error)}</Text><Button title="Retry" variant="outline" onPress={()=>{void query.refetch();}}/></View> : !query.data?.items.length ? <View style={ui.panel}><Text style={ui.muted}>History appears here when this lead changes.</Text></View> : query.data.items.map((row:HistoryRecord)=><View key={row.id} style={ui.panel}><Text style={ui.label}>{row.summary}</Text><Text style={ui.muted}>{row.actorName} · {formatDateTime(row.createdAt)} IST · {labelFor(row.action)}</Text>{historyChanges(row.changes).map(change=><Text key={change.field} style={ui.muted}>{change.label}: {change.before} → {change.after}</Text>)}</View>)}
    {query.data?.total ? <Pager page={filters.page??1} total={query.data.total} onChange={page=>setFilters(f=>({...f,page}))}/> : null}
  </View>;
}

export function SectionTabs({ selected, onSelect, summary, loading, error }: { selected: string; onSelect: (key:string)=>void; summary?: SectionSummary; loading: boolean; error: boolean }) {
  const badgeKeys: Record<string,string> = {followups:'followups',reminders:'reminders',meetings:'meetings',quotations:'quotations',invoices:'invoices'};
 return <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Lead sections" contentContainerStyle={{alignItems:'stretch',borderBottomWidth:1,borderBottomColor:colors.border}}>
   {['details','followups','history','reminders','meetings','quotations','invoices'].map(key=>{
    const active=selected===key, count=badgeKeys[key]?summary?.counts[badgeKeys[key] as keyof SectionSummary['counts']]:undefined;
    return <Pressable key={key} accessibilityRole="tab" accessibilityState={{selected:active}} onPress={()=>onSelect(key)} style={{paddingHorizontal:13,paddingVertical:12,borderBottomWidth:active?3:0,borderBottomColor:colors.accent,minHeight:48,flexDirection:'row',alignItems:'center',gap:5}}>
       <Text style={{fontSize:13,fontWeight:active?'800':'500',color:active?colors.primaryText:colors.text}}>{key==='details'?'Details':key==='followups'?'FollowUp':key==='history'?'History':key==='reminders'?'Reminder':key==='meetings'?'Meeting':key==='quotations'?'Quotation':'Invoice'}</Text>
      {badgeKeys[key]?<Text accessibilityLabel={loading?'Loading count':error?'Count unavailable':count===undefined?'Loading count':String(count)} style={{fontSize:11,fontWeight:'800',color:colors.white,backgroundColor:loading||error||count===undefined?colors.muted:colors.primaryText,overflow:'hidden',borderRadius:10,paddingHorizontal:6,paddingVertical:2}}>{loading||error||count===undefined?'…':count}</Text>:null}
    </Pressable>
  })}
 </ScrollView>;
}

