// ORIGINAL IMPLEMENTATION PRESERVED BELOW AS COMMENTS.
// import React, { useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { errorMessage } from '@/api/client';
// import Button from '@/components/Button';
// import LeadDetailsModal from '@/components/lead/LeadDetailsModal';
// import { useLeads, useUpdateLead } from '@/hooks/useLeads';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { Lead, statusLabel } from '@/types/lead';
// import { LeadStatusMasterEntry } from '@/types/leadStatus';
// import { colors } from '@/theme/colors';
//
// const TABLE_MIN_WIDTH = 1120;
// const COLUMN_WIDTHS = [180, 160, 150, 220, 250, 160] as const;
//
// function cleanValue(value?: string | null) {
//   return value?.trim() || '—';
// }
//
// function findStatus(status: string, statuses: LeadStatusMasterEntry[] = []) {
//   return statuses.find((entry) => entry.code === status || entry.name.toLowerCase() === status.toLowerCase());
// }
//
// export default function LeadViewScreen() {
//   const { width } = useWindowDimensions();
//   const [searchText, setSearchText] = useState('');
//   const [search, setSearch] = useState('');
//   const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
//   const [statusLead, setStatusLead] = useState<Lead | null>(null);
//   const [statusError, setStatusError] = useState<string | null>(null);
//   const [refreshError, setRefreshError] = useState<string | null>(null);
//   const [failedLeadId, setFailedLeadId] = useState<string | null>(null);
//   const updateLead = useUpdateLead();
//   const leadsQuery = useLeads(search);
//   const statusesQuery = useLeadStatuses();
//   const leads = leadsQuery.data ?? [];
//   const statuses = useMemo(
//     () => [...(statusesQuery.data ?? [])].sort((a, b) => a.order - b.order),
//     [statusesQuery.data],
//   );
//   const activeStatuses = statuses.filter((entry) => entry.isActive);
//   const minWidth = width > TABLE_MIN_WIDTH ? width - 48 : TABLE_MIN_WIDTH;
//
//   useEffect(() => {
//     const timeout = setTimeout(() => setSearch(searchText.trim()), 300);
//     return () => clearTimeout(timeout);
//   }, [searchText]);
//
//   async function chooseStatus(nextStatus: string) {
//     const lead = statusLead;
//     setStatusLead(null);
//     if (!lead || lead.status === nextStatus) return;
//
//     setFailedLeadId(null);
//     setStatusError(null);
//     setRefreshError(null);
//     try {
//       await updateLead.mutateAsync({ id: lead.id, data: { status: nextStatus } });
//       const refreshed = await leadsQuery.refetch();
//       if (refreshed.isError) setRefreshError(errorMessage(refreshed.error));
//     } catch (error) {
//       setFailedLeadId(lead.id);
//       setStatusError(errorMessage(error));
//       const refreshed = await leadsQuery.refetch();
//       if (refreshed.isError) setRefreshError(errorMessage(refreshed.error));
//     }
//   }
//
//   const header = (
//     <View style={[styles.tableHeader, { minWidth }]}>
//       {['Company Name', 'Contact Person', 'Mobile Number', 'Remark', 'Address', 'Status'].map((label, index) => (
//         <Text key={label} numberOfLines={1} style={[styles.headerCell, { width: COLUMN_WIDTHS[index] }]}>{label}</Text>
//       ))}
//     </View>
//   );
//
//   return (
//     <View style={styles.page}>
//       <View style={styles.topbar}>
//         <View style={styles.headingRow}>
//           <View style={styles.titleBlock}>
//             <Text accessibilityRole="header" style={styles.title}>Lead View</Text>
//             <Text style={styles.count}>{search ? `${leads.length} results` : `${leads.length} total leads`}</Text>
//           </View>
//           <View style={styles.searchBox}>
//             <Ionicons name="search-outline" size={18} color={colors.muted} />
//             <TextInput
//               value={searchText}
//               onChangeText={setSearchText}
//               placeholder="Search name, phone, email, company"
//               placeholderTextColor={colors.muted}
//               accessibilityLabel="Search leads"
//               returnKeyType="search"
//               style={styles.searchInput}
//             />
//             {searchText ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchText('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
//           </View>
//         </View>
//       </View>
//
//       {statusesQuery.isError ? <View style={styles.globalNotice}><Text style={styles.errorText}>{errorMessage(statusesQuery.error)}</Text><Pressable onPress={() => { void statusesQuery.refetch(); }}><Text style={styles.link}>Retry Statuses</Text></Pressable></View> : null}
//
//       {leadsQuery.isLoading ? (
//         <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Loading leads…</Text></View>
//       ) : leadsQuery.isError ? (
//         <View style={styles.centerState}><Text accessibilityRole="alert" style={styles.errorText}>{errorMessage(leadsQuery.error)}</Text><Button title="Retry" variant="outline" onPress={() => { void leadsQuery.refetch(); }} /></View>
//       ) : leads.length === 0 ? (
//         <View style={styles.centerState}>
//           <Text style={styles.stateTitle}>{search ? 'No leads found.' : 'No leads yet.'}</Text>
//           {search ? <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} /> : null}
//         </View>
//       ) : (
//         <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalContent}>
//           <View style={[styles.table, { minWidth }]}>
//             {header}
//             {refreshError ? <View style={styles.notice}><Text style={styles.errorText}>Status saved, but the list could not refresh: {refreshError}</Text><Pressable onPress={async () => { const result = await leadsQuery.refetch(); setRefreshError(result.isError ? errorMessage(result.error) : null); }}><Text style={styles.link}>Retry refresh</Text></Pressable></View> : null}
//             {statusError && failedLeadId ? <View style={styles.notice}><Text accessibilityRole="alert" style={styles.errorText}>{statusError}</Text><Pressable onPress={() => setStatusLead(leads.find((lead) => lead.id === failedLeadId) ?? null)}><Text style={styles.link}>Choose status again</Text></Pressable></View> : null}
//             <FlatList
//               data={leads}
//               keyExtractor={(lead) => lead.id}
//               keyboardShouldPersistTaps="handled"
//               renderItem={({ item: lead }) => {
//                 const selectedStatus = findStatus(lead.status, statuses);
//                 const companyName = lead.companyName ?? lead.company;
//                 return (
//                   <View style={styles.row}>
//                     <Pressable accessibilityRole="button" accessibilityLabel={`Open lead details for ${lead.name}`} onPress={() => setSelectedLeadId(lead.id)} style={styles.rowDetails}>
//                       {[cleanValue(companyName), cleanValue(lead.name), cleanValue(lead.phone), cleanValue(lead.comment), cleanValue(lead.address)].map((value, index) => (
//                         <Text key={index} numberOfLines={index < 2 ? 2 : 3} style={[styles.cell, { width: COLUMN_WIDTHS[index] }]}>{value}</Text>
//                       ))}
//                     </Pressable>
//                     <View style={[styles.statusCell, { width: COLUMN_WIDTHS[5] }]}>
//                       {updateLead.isPending && updateLead.variables?.id === lead.id ? <Text style={styles.saving}>Saving…</Text> : (
//                         <Pressable
//                           accessibilityRole="button"
//                           accessibilityLabel={`Change status for ${lead.name}`}
//                           accessibilityState={{ disabled: statusesQuery.isLoading || statusesQuery.isError || updateLead.isPending || activeStatuses.length === 0 }}
//                           disabled={statusesQuery.isLoading || statusesQuery.isError || updateLead.isPending || activeStatuses.length === 0}
//                           onPress={() => { setStatusLead(lead); setStatusError(null); setFailedLeadId(null); }}
//                           style={[styles.statusButton, selectedStatus?.color ? { borderColor: `${selectedStatus.color}66`, backgroundColor: `${selectedStatus.color}16` } : null]}
//                         >
//                           <Text numberOfLines={1} style={[styles.statusText, selectedStatus?.color ? { color: selectedStatus.color } : null]}>{selectedStatus?.name ?? statusLabel(lead.status)}</Text>
//                           <Ionicons name="chevron-down" size={14} color={selectedStatus?.color ?? colors.muted} />
//                         </Pressable>
//                       )}
//                     </View>
//                   </View>
//                 );
//               }}
//               style={styles.list}
//             />
//             {!statusesQuery.isError && !statusesQuery.isLoading && activeStatuses.length === 0 ? <Text style={styles.noStatuses}>No active lead statuses available.</Text> : null}
//           </View>
//         </ScrollView>
//       )}
//
//       <Modal visible={!!statusLead} transparent animationType="fade" onRequestClose={() => setStatusLead(null)}>
//         <Pressable style={styles.backdrop} onPress={() => setStatusLead(null)}>
//           <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
//             <View style={styles.dialogHeader}>
//               <View style={styles.dialogHeading}>
//                 <Text accessibilityRole="header" style={styles.dialogTitle}>Change lead status</Text>
//                 <Text numberOfLines={1} style={styles.dialogSub}>{statusLead?.name} · {statusLead ? (findStatus(statusLead.status, statuses)?.name ?? statusLabel(statusLead.status)) : ''}</Text>
//               </View>
//               <Pressable accessibilityRole="button" accessibilityLabel="Close status menu" hitSlop={10} onPress={() => setStatusLead(null)}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
//             </View>
//             {activeStatuses.length === 0 ? <Text style={styles.stateText}>No active lead statuses available.</Text> : (
//               <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
//                 {activeStatuses.map((entry) => {
//                   const code = entry.code || entry.name;
//                   const selected = statusLead?.status === code || statusLead?.status.toLowerCase() === entry.name.toLowerCase();
//                   return <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { void chooseStatus(code); }} style={[styles.option, selected && styles.optionSelected]}>
//                     <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{entry.name}</Text>
//                     {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
//                   </Pressable>;
//                 })}
//               </ScrollView>
//             )}
//           </Pressable>
//         </Pressable>
//       </Modal>
//
//       <LeadDetailsModal visible={!!selectedLeadId} leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: '#F7F9FC' },
//   topbar: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   headingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
//   titleBlock: { minWidth: 150 },
//   title: { fontSize: 22, fontWeight: '800', color: colors.text },
//   count: { fontSize: 12, color: colors.muted, marginTop: 2 },
//   searchBox: { height: 42, flex: 1, minWidth: 240, maxWidth: 460, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F7F9FC' },
//   searchInput: { flex: 1, minWidth: 0, color: colors.text, paddingVertical: 0, fontSize: 14 },
//   horizontalScroll: { flex: 1 },
//   horizontalContent: { flexGrow: 1, padding: 20 },
//   table: { flex: 1, alignSelf: 'flex-start', overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
//   tableHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 46, backgroundColor: '#F1F5FA', borderBottomWidth: 1, borderBottomColor: colors.border },
//   headerCell: { paddingHorizontal: 12, color: colors.muted, fontSize: 12, fontWeight: '700' },
//   list: { flex: 1 },
//   row: { flexDirection: 'row', minHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.border },
//   rowDetails: { flexDirection: 'row', alignItems: 'center' },
//   cell: { paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 13, flexShrink: 0 },
//   statusCell: { justifyContent: 'center', paddingHorizontal: 10 },
//   statusButton: { minHeight: 38, paddingHorizontal: 9, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
//   statusText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
//   saving: { color: colors.muted, fontSize: 12, textAlign: 'center' },
//   centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
//   stateTitle: { fontSize: 16, color: colors.text, fontWeight: '700' },
//   stateText: { color: colors.muted, fontSize: 13 },
//   errorText: { color: colors.danger, fontSize: 13, textAlign: 'center' },
//   notice: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
//   globalNotice: { padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.white },
//   link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
//   noStatuses: { padding: 12, color: colors.muted, fontSize: 12 },
//   backdrop: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,27,61,0.45)' },
//   dialog: { width: '100%', maxWidth: 440, maxHeight: '80%', padding: 18, gap: 14, borderRadius: 14, backgroundColor: colors.white },
//   dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   dialogHeading: { flex: 1, gap: 3 },
//   dialogTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
//   dialogSub: { color: colors.muted, fontSize: 12 },
//   options: { flexGrow: 0, maxHeight: 420 },
//   option: { minHeight: 46, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
//   optionSelected: { backgroundColor: colors.primarySoft },
//   optionText: { color: colors.text, fontSize: 14 },
//   optionTextSelected: { color: colors.primary, fontWeight: '700' },
// });
//

// REDESIGN NOTES
//  • Logic (search debounce, status update, refetch, error notices, details modal) is unchanged.
//  • New: status filter chips with live counts (client-side), flexible columns that fill the width,
//    avatar-led rows with hover, card layout on narrow screens (no sideways scrolling),
//    skeleton loading, friendlier empty/error states, colour-coded status dialog.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import LeadDetailsModal from '@/components/lead/LeadDetailsModal';
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { Lead, statusLabel } from '@/types/lead';
import { LeadStatusMasterEntry } from '@/types/leadStatus';
import { colors } from '@/theme/colors';

/* ── Layout constants ─────────────────────────────────────────── */
const COLS = [
  { label: 'Company Name', flex: 1.3, min: 190 },
  { label: 'Contact Person', flex: 1.1, min: 150 },
  { label: 'Mobile Number', flex: 0.9, min: 130 },
  { label: 'Remark', flex: 1.5, min: 190 },
  { label: 'Address', flex: 1.7, min: 210 },
] as const;
const STATUS_COL = 180;
const TABLE_MIN_WIDTH = 1080;
const CARD_BREAKPOINT = 760;
const PAGE_BG = '#F4F6FA';

const AVATAR_TONES = [
  { bg: '#E8EFFE', fg: '#1D4ED8' },
  { bg: '#E7F6EC', fg: '#15803D' },
  { bg: '#FFF3E0', fg: '#B45309' },
  { bg: '#F3E8FF', fg: '#7E22CE' },
  { bg: '#FDE8EF', fg: '#BE185D' },
  { bg: '#E0F5F5', fg: '#0F766E' },
];

const colStyle = (i: number) => ({ flex: COLS[i].flex, minWidth: COLS[i].min });

/* ── Helpers ──────────────────────────────────────────────────── */
function cleanValue(value?: string | null) {
  return value?.trim() || '—';
}

function findStatus(status: string, statuses: LeadStatusMasterEntry[] = []) {
  return statuses.find((entry) => entry.code === status || entry.name.toLowerCase() === status.toLowerCase());
}

function leadMatches(lead: Lead, entry: LeadStatusMasterEntry) {
  return lead.status === entry.code || (lead.status ?? '').toLowerCase() === entry.name.toLowerCase();
}

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

/* ── Small presentational pieces ──────────────────────────────── */
function Avatar({ label, size = 38 }: { label: string; size?: number }) {
  const text = (label || '?').trim();
  const tone = toneFor(text);
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: tone.fg, fontWeight: '800', fontSize: size * 0.4 }}>{text.charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

function StatusPill({
  name,
  color,
  disabled,
  accessibilityLabel,
  onPress,
  onHoverIn,
}: {
  name: string;
  color?: string | null;
  disabled?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onHoverIn?: () => void;
}) {
  const tint = color || colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      style={[styles.pill, { backgroundColor: `${tint}14`, borderColor: `${tint}44` }, disabled && { opacity: 0.55 }]}
    >
      <View style={[styles.pillDot, { backgroundColor: tint }]} />
      <Text numberOfLines={1} style={[styles.pillText, { color: tint }]}>{name}</Text>
      <Ionicons name="chevron-down" size={13} color={tint} />
    </Pressable>
  );
}

function FilterChip({ label, count, active, color, onPress }: { label: string; count: number; active: boolean; color?: string | null; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} leads`}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

function StateCard({ icon, tone, title, text, children }: { icon: keyof typeof Ionicons.glyphMap; tone: 'primary' | 'danger'; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.stateCard}>
      <View style={[styles.stateIcon, { backgroundColor: tone === 'danger' ? '#FDECEA' : colors.primarySoft }]}>
        <Ionicons name={icon} size={26} color={tone === 'danger' ? colors.danger : colors.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {text ? <Text style={[styles.stateText, tone === 'danger' && { color: colors.danger }]}>{text}</Text> : null}
      {children}
    </View>
  );
}

function Skeleton({ cards }: { cards: boolean }) {
  return (
    <View accessibilityLabel="Loading leads" style={styles.skelWrap}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.skelRow, cards && styles.skelCard]}>
          <View style={styles.skelAvatar} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skelLine, { width: '45%' }]} />
            <View style={[styles.skelLine, { width: '70%', height: 9 }]} />
          </View>
          {!cards ? <View style={[styles.skelLine, { width: 110, height: 28, borderRadius: 14 }]} /> : null}
        </View>
      ))}
    </View>
  );
}

/* ── Rows ─────────────────────────────────────────────────────── */
type RowProps = {
  lead: Lead;
  entry?: LeadStatusMasterEntry;
  hovered: boolean;
  saving: boolean;
  statusDisabled: boolean;
  onOpen: () => void;
  onStatus: () => void;
  onHover: () => void;
};

function TableRow({ lead, entry, hovered, saving, statusDisabled, onOpen, onStatus, onHover }: RowProps) {
  const company = lead.companyName ?? lead.company;
  return (
    <View style={[styles.row, hovered && styles.rowHover]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open lead details for ${lead.name}`} onPress={onOpen} onHoverIn={onHover} style={styles.rowDetails}>
        <View style={[styles.cell, styles.companyCell, colStyle(0)]}>
          <Avatar label={company || lead.name} />
          <Text numberOfLines={2} style={styles.companyText}>{cleanValue(company)}</Text>
        </View>
        <Text numberOfLines={2} style={[styles.cell, styles.cellStrong, colStyle(1)]}>{cleanValue(lead.name)}</Text>
        <Text numberOfLines={1} style={[styles.cell, styles.cellStrong, colStyle(2)]}>{cleanValue(lead.phone)}</Text>
        <Text numberOfLines={2} style={[styles.cell, styles.cellMuted, colStyle(3)]}>{cleanValue(lead.comment)}</Text>
        <Text numberOfLines={2} style={[styles.cell, styles.cellMuted, colStyle(4)]}>{cleanValue(lead.address)}</Text>
      </Pressable>
      <View style={styles.statusCell}>
        {saving ? (
          <View style={styles.savingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.saving}>Saving…</Text></View>
        ) : (
          <StatusPill
            name={entry?.name ?? statusLabel(lead.status)}
            color={entry?.color}
            disabled={statusDisabled}
            accessibilityLabel={`Change status for ${lead.name}`}
            onPress={onStatus}
            onHoverIn={onHover}
          />
        )}
      </View>
    </View>
  );
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={14} color={colors.muted} style={{ marginTop: 2 }} />
      <Text style={styles.infoText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

function LeadCard({ lead, entry, saving, statusDisabled, onOpen, onStatus }: Omit<RowProps, 'hovered' | 'onHover'>) {
  const company = lead.companyName ?? lead.company;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open lead details for ${lead.name}`} onPress={onOpen} style={styles.cardTop}>
        <Avatar label={company || lead.name} size={44} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.cardTitle}>{cleanValue(company)}</Text>
          <Text numberOfLines={1} style={styles.cardSub}>{cleanValue(lead.name)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
      <View style={styles.cardBody}>
        <InfoLine icon="call-outline" text={cleanValue(lead.phone)} />
        {lead.comment?.trim() ? <InfoLine icon="chatbubble-ellipses-outline" text={lead.comment.trim()} /> : null}
        {lead.address?.trim() ? <InfoLine icon="location-outline" text={lead.address.trim()} /> : null}
      </View>
      <View style={styles.cardFoot}>
        {saving ? (
          <View style={styles.savingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.saving}>Saving…</Text></View>
        ) : (
          <StatusPill
            name={entry?.name ?? statusLabel(lead.status)}
            color={entry?.color}
            disabled={statusDisabled}
            accessibilityLabel={`Change status for ${lead.name}`}
            onPress={onStatus}
          />
        )}
      </View>
    </View>
  );
}

/* ── Screen ───────────────────────────────────────────────────── */
export default function LeadViewScreen() {
  const { width } = useWindowDimensions();
  const [pageW, setPageW] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [statusLead, setStatusLead] = useState<Lead | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [failedLeadId, setFailedLeadId] = useState<string | null>(null);
  const updateLead = useUpdateLead();
  const leadsQuery = useLeads(search);
  const statusesQuery = useLeadStatuses();
  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const statuses = useMemo(
    () => [...(statusesQuery.data ?? [])].sort((a, b) => a.order - b.order),
    [statusesQuery.data],
  );
  const activeStatuses = useMemo(() => statuses.filter((entry) => entry.isActive), [statuses]);

  const cw = pageW || width;
  const cardMode = cw < CARD_BREAKPOINT;
  const minWidth = Math.max(TABLE_MIN_WIDTH, cw - 40);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    activeStatuses.forEach((entry) => {
      map[entry.id] = leads.filter((lead) => leadMatches(lead, entry)).length;
    });
    return map;
  }, [leads, activeStatuses]);

  const filterEntry = statusFilter === 'ALL' ? undefined : activeStatuses.find((entry) => entry.id === statusFilter);
  const visibleLeads = useMemo(
    () => (filterEntry ? leads.filter((lead) => leadMatches(lead, filterEntry)) : leads),
    [leads, filterEntry],
  );

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchText.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  async function chooseStatus(nextStatus: string) {
    const lead = statusLead;
    setStatusLead(null);
    if (!lead || lead.status === nextStatus) return;

    setFailedLeadId(null);
    setStatusError(null);
    setRefreshError(null);
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status: nextStatus } });
      const refreshed = await leadsQuery.refetch();
      if (refreshed.isError) setRefreshError(errorMessage(refreshed.error));
    } catch (error) {
      setFailedLeadId(lead.id);
      setStatusError(errorMessage(error));
      const refreshed = await leadsQuery.refetch();
      if (refreshed.isError) setRefreshError(errorMessage(refreshed.error));
    }
  }

  const statusBlocked = statusesQuery.isLoading || statusesQuery.isError || updateLead.isPending || activeStatuses.length === 0;
  const openStatus = (lead: Lead) => { setStatusLead(lead); setStatusError(null); setFailedLeadId(null); };

  const subtitle = leadsQuery.isLoading
    ? 'Loading leads…'
    : search
      ? `${visibleLeads.length} ${visibleLeads.length === 1 ? 'result' : 'results'} for “${search}”`
      : filterEntry
        ? `${visibleLeads.length} in ${filterEntry.name}`
        : `${leads.length} total leads`;

  const notices = (
    <>
      {refreshError ? (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={[styles.noticeText, { flex: 1 }]}>Status saved, but the list could not refresh: {refreshError}</Text>
          <Pressable onPress={async () => { const result = await leadsQuery.refetch(); setRefreshError(result.isError ? errorMessage(result.error) : null); }}><Text style={styles.link}>Retry refresh</Text></Pressable>
        </View>
      ) : null}
      {statusError && failedLeadId ? (
        <View style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text accessibilityRole="alert" style={[styles.noticeText, { flex: 1 }]}>{statusError}</Text>
          <Pressable onPress={() => setStatusLead(leads.find((lead) => lead.id === failedLeadId) ?? null)}><Text style={styles.link}>Choose status again</Text></Pressable>
        </View>
      ) : null}
    </>
  );

  const renderItem = ({ item: lead }: { item: Lead }) => {
    const entry = findStatus(lead.status, statuses);
    const saving = updateLead.isPending && updateLead.variables?.id === lead.id;
    return cardMode ? (
      <LeadCard lead={lead} entry={entry} saving={saving} statusDisabled={statusBlocked} onOpen={() => setSelectedLeadId(lead.id)} onStatus={() => openStatus(lead)} />
    ) : (
      <TableRow
        lead={lead}
        entry={entry}
        hovered={hoverId === lead.id}
        saving={saving}
        statusDisabled={statusBlocked}
        onOpen={() => setSelectedLeadId(lead.id)}
        onStatus={() => openStatus(lead)}
        onHover={() => setHoverId(lead.id)}
      />
    );
  };

  const header = (
    <View style={[styles.tableHeader, { minWidth }]}>
      <View style={styles.headerDetails}>
        {COLS.map((col, index) => (
          <Text key={col.label} numberOfLines={1} style={[styles.headerCell, colStyle(index)]}>{col.label}</Text>
        ))}
      </View>
      <Text numberOfLines={1} style={[styles.headerCell, { width: STATUS_COL }]}>Status</Text>
    </View>
  );

  const showChips = !leadsQuery.isLoading && !leadsQuery.isError && activeStatuses.length > 0 && !search;

  let content: React.ReactNode;
  if (leadsQuery.isLoading) {
    content = <Skeleton cards={cardMode} />;
  } else if (leadsQuery.isError) {
    content = (
      <StateCard icon="alert-circle-outline" tone="danger" title="Couldn't load leads" text={errorMessage(leadsQuery.error)}>
        <Button title="Retry" variant="outline" onPress={() => { void leadsQuery.refetch(); }} />
      </StateCard>
    );
  } else if (leads.length === 0) {
    content = (
      <StateCard icon={search ? 'search-outline' : 'people-outline'} tone="primary" title={search ? 'No leads found' : 'No leads yet'} text={search ? 'Nothing matches your search. Try a different name, phone, email or company.' : 'New leads will show up here as soon as they are added.'}>
        {search ? <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} /> : null}
      </StateCard>
    );
  } else if (visibleLeads.length === 0) {
    content = (
      <StateCard icon="funnel-outline" tone="primary" title={`No leads in ${filterEntry?.name ?? 'this status'}`} text="Pick another status or show every lead.">
        <Button title="Show all leads" variant="outline" onPress={() => setStatusFilter('ALL')} />
      </StateCard>
    );
  } else if (cardMode) {
    content = (
      <>
        {notices}
        <FlatList
          data={visibleLeads}
          extraData={updateLead.isPending}
          keyExtractor={(lead) => lead.id}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          contentContainerStyle={styles.cardList}
          style={{ flex: 1 }}
        />
      </>
    );
  } else {
    content = (
      <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalContent}>
        <View style={[styles.table, { minWidth }]}>
          {header}
          {notices}
          <FlatList
            data={visibleLeads}
            extraData={`${hoverId}-${updateLead.isPending}`}
            keyExtractor={(lead) => lead.id}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
            style={styles.list}
          />
          {!statusesQuery.isError && !statusesQuery.isLoading && activeStatuses.length === 0 ? <Text style={styles.noStatuses}>No active lead statuses available.</Text> : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.page} onLayout={(event) => setPageW(event.nativeEvent.layout.width)}>
      <View style={styles.topbar}>
        <View style={styles.headingRow}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>Lead View</Text>
            <Text style={styles.count}>{subtitle}</Text>
          </View>
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search name, phone, email, company"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search leads"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchText ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearchText('')} style={styles.clearBtn}>
                <Ionicons name="close" size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {showChips ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <FilterChip label="All" count={leads.length} active={statusFilter === 'ALL'} onPress={() => setStatusFilter('ALL')} />
            {activeStatuses.map((entry) => (
              <FilterChip key={entry.id} label={entry.name} color={entry.color} count={statusCounts[entry.id] ?? 0} active={statusFilter === entry.id} onPress={() => setStatusFilter(entry.id)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {statusesQuery.isError ? (
        <View style={styles.globalNotice}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.noticeText}>{errorMessage(statusesQuery.error)}</Text>
          <Pressable onPress={() => { void statusesQuery.refetch(); }}><Text style={styles.link}>Retry statuses</Text></Pressable>
        </View>
      ) : null}

      <View style={styles.body}>{content}</View>

      <Modal visible={!!statusLead} transparent animationType="fade" onRequestClose={() => setStatusLead(null)}>
        <Pressable style={styles.backdrop} onPress={() => setStatusLead(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogHeading}>
                <Text accessibilityRole="header" style={styles.dialogTitle}>Change lead status</Text>
                <Text numberOfLines={1} style={styles.dialogSub}>{statusLead?.name} · {statusLead ? (findStatus(statusLead.status, statuses)?.name ?? statusLabel(statusLead.status)) : ''}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close status menu" hitSlop={10} onPress={() => setStatusLead(null)} style={styles.dialogClose}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>
            {activeStatuses.length === 0 ? <Text style={styles.stateText}>No active lead statuses available.</Text> : (
              <ScrollView style={styles.options} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 4 }}>
                {activeStatuses.map((entry) => {
                  const code = entry.code || entry.name;
                  const selected = statusLead?.status === code || statusLead?.status.toLowerCase() === entry.name.toLowerCase();
                  const tint = entry.color || colors.primary;
                  return (
                    <Pressable
                      key={entry.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => { void chooseStatus(code); }}
                      style={[styles.option, selected && { backgroundColor: `${tint}14`, borderColor: `${tint}44` }]}
                    >
                      <View style={[styles.optionDot, { backgroundColor: tint }]} />
                      <Text style={[styles.optionText, selected && { color: tint, fontWeight: '800' }]}>{entry.name}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color={tint} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <LeadDetailsModal visible={!!selectedLeadId} leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PAGE_BG },

  /* top bar */
  topbar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  titleBlock: { minWidth: 150 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  count: { fontSize: 13, color: colors.muted, marginTop: 2 },
  searchBox: { height: 44, flex: 1, minWidth: 240, maxWidth: 480, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: PAGE_BG },
  searchBoxFocused: { borderColor: colors.primary, backgroundColor: colors.white, boxShadow: '0 0 0 3px rgba(11,47,125,0.10)' },
  searchInput: { flex: 1, minWidth: 0, color: colors.text, paddingVertical: 0, fontSize: 14 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6ECF6' },

  /* filter chips */
  chipRow: { gap: 8, paddingRight: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 36, paddingLeft: 12, paddingRight: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text, maxWidth: 140 },
  chipTextActive: { color: colors.white },
  chipCount: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F8' },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipCountText: { fontSize: 11.5, fontWeight: '800', color: colors.muted },
  chipCountTextActive: { color: colors.white },

  body: { flex: 1 },

  /* table */
  horizontalScroll: { flex: 1 },
  horizontalContent: { flexGrow: 1, padding: 20 },
  table: { flex: 1, alignSelf: 'flex-start', overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white, boxShadow: '0 1px 2px rgba(15,27,61,0.04), 0 8px 24px rgba(15,27,61,0.05)' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 46, backgroundColor: '#F8FAFD', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerDetails: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerCell: { paddingHorizontal: 14, color: colors.muted, fontSize: 12.5, fontWeight: '700' },
  list: { flex: 1 },
  row: { flexDirection: 'row', minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#EEF1F6', backgroundColor: colors.white },
  rowHover: { backgroundColor: '#F6F9FF' },
  rowDetails: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cell: { paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 13.5 },
  companyCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  cellStrong: { fontWeight: '600' },
  cellMuted: { color: colors.muted, lineHeight: 19 },
  statusCell: { width: STATUS_COL, justifyContent: 'center', paddingHorizontal: 12 },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  saving: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  noStatuses: { padding: 12, color: colors.muted, fontSize: 12 },

  /* status pill */
  pill: { minHeight: 34, paddingHorizontal: 11, gap: 7, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', maxWidth: '100%', borderRadius: 999, borderWidth: 1 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { flexShrink: 1, fontSize: 12.5, fontWeight: '800' },

  /* cards (narrow screens) */
  cardList: { padding: 14, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,27,61,0.04), 0 6px 18px rgba(15,27,61,0.05)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  infoLine: { flexDirection: 'row', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  cardFoot: { paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#EEF1F6', backgroundColor: '#FAFBFE', flexDirection: 'row', alignItems: 'center' },

  /* skeleton */
  skelWrap: { padding: 20, gap: 10 },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E6ECF5', backgroundColor: colors.white },
  skelCard: { paddingVertical: 18 },
  skelAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E3EAF5' },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: '#E3EAF5' },

  /* states + notices */
  stateCard: { alignSelf: 'center', alignItems: 'center', width: '100%', maxWidth: 420, marginTop: 56, padding: 26, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, boxShadow: '0 6px 20px rgba(11,47,125,0.08)' },
  stateIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  stateText: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 6 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FDECEA', borderBottomWidth: 1, borderBottomColor: '#F6CFCB' },
  noticeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  globalNotice: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDECEA' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  /* status dialog */
  backdrop: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,27,61,0.5)' },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '80%', padding: 20, gap: 14, borderRadius: 18, backgroundColor: colors.white, boxShadow: '0 24px 60px rgba(15,27,61,0.3)' },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dialogHeading: { flex: 1, gap: 3 },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  dialogSub: { color: colors.muted, fontSize: 12.5 },
  dialogClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F8' },
  options: { flexGrow: 0, maxHeight: 420 },
  option: { minHeight: 48, paddingHorizontal: 12, gap: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  optionDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: '600' },
});
