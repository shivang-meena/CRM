# Lead View UI — consolidated source reference

This file collects the current source for the Lead View screen and its detail view so it can be shared with an AI for a visual redesign. Each section names the original repository file. Styles are defined inside the TSX files with React Native `StyleSheet.create`; there is no separate CSS file for these screens.

The main Lead View route is `apps/client/app/(app)/lead-view.tsx`, implemented by `apps/client/src/leads/LeadViewScreen.tsx`. Clicking a lead opens `LeadDetailsModal`, whose design is split across `LeadHeader`, `LeadActionBar`, `LeadSectionTabs`, and `LeadDetailsSection`. The standalone `/lead/[id]` route and the existing `/leads` screen are included as additional entry points that use the shared detail UI.

These are copied source snapshots for reference. Edit the original files in the repository to implement a redesign; this consolidated document itself is not application code.

---

## `apps/client/app/(app)/lead-view.tsx`

```tsx
import LeadViewScreen from '@/leads/LeadViewScreen';

export default function LeadViewRoute() {
  return <LeadViewScreen />;
}
```

---

## `apps/client/src/leads/LeadViewScreen.tsx`

```tsx
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

const TABLE_MIN_WIDTH = 1120;
const COLUMN_WIDTHS = [180, 160, 150, 220, 250, 160] as const;

function cleanValue(value?: string | null) {
  return value?.trim() || '—';
}

function findStatus(status: string, statuses: LeadStatusMasterEntry[] = []) {
  return statuses.find((entry) => entry.code === status || entry.name.toLowerCase() === status.toLowerCase());
}

export default function LeadViewScreen() {
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [statusLead, setStatusLead] = useState<Lead | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [failedLeadId, setFailedLeadId] = useState<string | null>(null);
  const updateLead = useUpdateLead();
  const leadsQuery = useLeads(search);
  const statusesQuery = useLeadStatuses();
  const leads = leadsQuery.data ?? [];
  const statuses = useMemo(
    () => [...(statusesQuery.data ?? [])].sort((a, b) => a.order - b.order),
    [statusesQuery.data],
  );
  const activeStatuses = statuses.filter((entry) => entry.isActive);
  const minWidth = width > TABLE_MIN_WIDTH ? width - 48 : TABLE_MIN_WIDTH;

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

  const header = (
    <View style={[styles.tableHeader, { minWidth }]}>
      {['Company Name', 'Contact Person', 'Mobile Number', 'Remark', 'Address', 'Status'].map((label, index) => (
        <Text key={label} numberOfLines={1} style={[styles.headerCell, { width: COLUMN_WIDTHS[index] }]}>{label}</Text>
      ))}
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View style={styles.headingRow}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>Lead View</Text>
            <Text style={styles.count}>{search ? `${leads.length} results` : `${leads.length} total leads`}</Text>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search name, phone, email, company"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search leads"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchText ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchText('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
          </View>
        </View>
      </View>

      {statusesQuery.isError ? <View style={styles.globalNotice}><Text style={styles.errorText}>{errorMessage(statusesQuery.error)}</Text><Pressable onPress={() => { void statusesQuery.refetch(); }}><Text style={styles.link}>Retry Statuses</Text></Pressable></View> : null}

      {leadsQuery.isLoading ? (
        <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Loading leads…</Text></View>
      ) : leadsQuery.isError ? (
        <View style={styles.centerState}><Text accessibilityRole="alert" style={styles.errorText}>{errorMessage(leadsQuery.error)}</Text><Button title="Retry" variant="outline" onPress={() => { void leadsQuery.refetch(); }} /></View>
      ) : leads.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>{search ? 'No leads found.' : 'No leads yet.'}</Text>
          {search ? <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} /> : null}
        </View>
      ) : (
        <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalContent}>
          <View style={[styles.table, { minWidth }]}>
            {header}
            {refreshError ? <View style={styles.notice}><Text style={styles.errorText}>Status saved, but the list could not refresh: {refreshError}</Text><Pressable onPress={async () => { const result = await leadsQuery.refetch(); setRefreshError(result.isError ? errorMessage(result.error) : null); }}><Text style={styles.link}>Retry refresh</Text></Pressable></View> : null}
            {statusError && failedLeadId ? <View style={styles.notice}><Text accessibilityRole="alert" style={styles.errorText}>{statusError}</Text><Pressable onPress={() => setStatusLead(leads.find((lead) => lead.id === failedLeadId) ?? null)}><Text style={styles.link}>Choose status again</Text></Pressable></View> : null}
            <FlatList
              data={leads}
              keyExtractor={(lead) => lead.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: lead }) => {
                const selectedStatus = findStatus(lead.status, statuses);
                const companyName = lead.companyName ?? lead.company;
                return (
                  <View style={styles.row}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Open lead details for ${lead.name}`} onPress={() => setSelectedLeadId(lead.id)} style={styles.rowDetails}>
                      {[cleanValue(companyName), cleanValue(lead.name), cleanValue(lead.phone), cleanValue(lead.comment), cleanValue(lead.address)].map((value, index) => (
                        <Text key={index} numberOfLines={index < 2 ? 2 : 3} style={[styles.cell, { width: COLUMN_WIDTHS[index] }]}>{value}</Text>
                      ))}
                    </Pressable>
                    <View style={[styles.statusCell, { width: COLUMN_WIDTHS[5] }]}>
                      {updateLead.isPending && updateLead.variables?.id === lead.id ? <Text style={styles.saving}>Saving…</Text> : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Change status for ${lead.name}`}
                          accessibilityState={{ disabled: statusesQuery.isLoading || statusesQuery.isError || updateLead.isPending || activeStatuses.length === 0 }}
                          disabled={statusesQuery.isLoading || statusesQuery.isError || updateLead.isPending || activeStatuses.length === 0}
                          onPress={() => { setStatusLead(lead); setStatusError(null); setFailedLeadId(null); }}
                          style={[styles.statusButton, selectedStatus?.color ? { borderColor: `${selectedStatus.color}66`, backgroundColor: `${selectedStatus.color}16` } : null]}
                        >
                          <Text numberOfLines={1} style={[styles.statusText, selectedStatus?.color ? { color: selectedStatus.color } : null]}>{selectedStatus?.name ?? statusLabel(lead.status)}</Text>
                          <Ionicons name="chevron-down" size={14} color={selectedStatus?.color ?? colors.muted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              }}
              style={styles.list}
            />
            {!statusesQuery.isError && !statusesQuery.isLoading && activeStatuses.length === 0 ? <Text style={styles.noStatuses}>No active lead statuses available.</Text> : null}
          </View>
        </ScrollView>
      )}

      <Modal visible={!!statusLead} transparent animationType="fade" onRequestClose={() => setStatusLead(null)}>
        <Pressable style={styles.backdrop} onPress={() => setStatusLead(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogHeading}>
                <Text accessibilityRole="header" style={styles.dialogTitle}>Change lead status</Text>
                <Text numberOfLines={1} style={styles.dialogSub}>{statusLead?.name} · {statusLead ? (findStatus(statusLead.status, statuses)?.name ?? statusLabel(statusLead.status)) : ''}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close status menu" hitSlop={10} onPress={() => setStatusLead(null)}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
            </View>
            {activeStatuses.length === 0 ? <Text style={styles.stateText}>No active lead statuses available.</Text> : (
              <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
                {activeStatuses.map((entry) => {
                  const code = entry.code || entry.name;
                  const selected = statusLead?.status === code || statusLead?.status.toLowerCase() === entry.name.toLowerCase();
                  return <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { void chooseStatus(code); }} style={[styles.option, selected && styles.optionSelected]}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{entry.name}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                  </Pressable>;
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
  page: { flex: 1, backgroundColor: '#F7F9FC' },
  topbar: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  titleBlock: { minWidth: 150 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  count: { fontSize: 12, color: colors.muted, marginTop: 2 },
  searchBox: { height: 42, flex: 1, minWidth: 240, maxWidth: 460, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F7F9FC' },
  searchInput: { flex: 1, minWidth: 0, color: colors.text, paddingVertical: 0, fontSize: 14 },
  horizontalScroll: { flex: 1 },
  horizontalContent: { flexGrow: 1, padding: 20 },
  table: { flex: 1, alignSelf: 'flex-start', overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white },
  tableHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 46, backgroundColor: '#F1F5FA', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCell: { paddingHorizontal: 12, color: colors.muted, fontSize: 12, fontWeight: '700' },
  list: { flex: 1 },
  row: { flexDirection: 'row', minHeight: 60, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowDetails: { flexDirection: 'row', alignItems: 'center' },
  cell: { paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 13, flexShrink: 0 },
  statusCell: { justifyContent: 'center', paddingHorizontal: 10 },
  statusButton: { minHeight: 38, paddingHorizontal: 9, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  statusText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
  saving: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  stateTitle: { fontSize: 16, color: colors.text, fontWeight: '700' },
  stateText: { color: colors.muted, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  notice: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  globalNotice: { padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.white },
  link: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  noStatuses: { padding: 12, color: colors.muted, fontSize: 12 },
  backdrop: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,27,61,0.45)' },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '80%', padding: 18, gap: 14, borderRadius: 14, backgroundColor: colors.white },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dialogHeading: { flex: 1, gap: 3 },
  dialogTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  dialogSub: { color: colors.muted, fontSize: 12 },
  options: { flexGrow: 0, maxHeight: 420 },
  option: { minHeight: 46, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  optionSelected: { backgroundColor: colors.primarySoft },
  optionText: { color: colors.text, fontSize: 14 },
  optionTextSelected: { color: colors.primary, fontWeight: '700' },
});
```

---

## `apps/client/src/components/lead/LeadDetailsModal.tsx`

```tsx
// // apps/client/src/components/lead/LeadDetailsModal.tsx
// import React, { useState } from 'react';
// import {
//   ActivityIndicator,
//   Modal,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { colors } from '@/theme/colors';
// import { useAuth } from '@/context/AuthContext';
// import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';
// import { useDeleteLead, useLead } from '@/hooks/useLeads';
// import { useSectionSummary } from '@/hooks/useLeadActivities';
// import { LeadSection } from '@/types/leadActivities';
// import { SalesDocument } from '@/types/salesDocuments';
// import Button from '@/components/Button';
// import ConfirmDialog from '@/components/ConfirmDialog';
// import LeadFormModal from '@/components/LeadFormModal';

// import LeadHeader from './LeadHeader';
// import LeadActionBar from './LeadActionBar';
// import LeadSectionTabs from './LeadSectionTabs';
// import LeadDetailsSection from './LeadDetailsSection';
// import FollowUpsSection from './FollowUpsSection';
// import RemindersSection from './RemindersSection';
// import MeetingsSection from './MeetingsSection';
// import QuotationsSection from './QuotationsSection';
// import InvoicesSection from './InvoicesSection';
// import HistorySection from './HistorySection';

// import FollowUpFormModal from './FollowUpFormModal';
// import ReminderFormModal from './ReminderFormModal';
// import MeetingFormModal from './MeetingFormModal';
// import SalesDocumentFormModal from './SalesDocumentFormModal';

// type Props = {
//   visible: boolean;
//   leadId: string | null;
//   onClose: () => void;
// };

// export default function LeadDetailsModal({ visible, leadId, onClose }: Props) {
//   const { userName } = useAuth();
//   const { canAccess } = usePermissions();
//   const [requestedSection, setSelectedSection] = useState<LeadSection>('details');
//   const selectedSection = canAccess(leadSectionPermissions[requestedSection]) ? requestedSection : 'details';

//   const {
//     data: lead,
//     isLoading: leadLoading,
//     isError: leadError,
//     refetch: refetchLead,
//   } = useLead(leadId ?? '');

//   const {
//     data: summary,
//     isLoading: summaryLoading,
//     isError: summaryError,
//     refetch: refetchSummary,
//   } = useSectionSummary(leadId ?? '');

//   const del = useDeleteLead();

//   // Sub-modals
//   const [editLeadOpen, setEditLeadOpen] = useState(false);
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
//   const [followUpOpen, setFollowUpOpen] = useState(false);
//   const [reminderOpen, setReminderOpen] = useState(false);
//   const [meetingOpen, setMeetingOpen] = useState(false);
//   const [quotationOpen, setQuotationOpen] = useState(false);
//   const [invoiceOpen, setInvoiceOpen] = useState(false);

//   if (!visible || !leadId) return null;

//   async function confirmDelete() {
//     if (!lead) return;
//     try {
//       await del.mutateAsync(lead.id);
//       onClose();
//     } finally {
//       setDeleteConfirmOpen(false);
//     }
//   }

//   function handleRecordSaved(targetSection: LeadSection) {
//     setSelectedSection(targetSection);
//     void refetchSummary();
//     void refetchLead();
//   }

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <View style={styles.modalBox}>
//           {/* Top Title Bar with Dimmed Backdrop and Close Button */}
//           <View style={styles.titleBar}>
//             <View style={styles.titleLeft}>
//               <Text style={styles.titleText}>Lead Details</Text>
//               {lead && (
//                 <Text style={styles.titleSub} numberOfLines={1}>
//                   · {lead.name}
//                 </Text>
//               )}
//             </View>
//             <Pressable
//               accessibilityRole="button"
//               accessibilityLabel="Close modal"
//               onPress={onClose}
//               style={styles.closeBtn}
//             >
//               <Ionicons name="close" size={22} color={colors.white} />
//             </Pressable>
//           </View>

//           {leadLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#0B2F7D" />
//               <Text style={styles.loadingText}>Loading lead details...</Text>
//             </View>
//           ) : leadError || !lead ? (
//             <View style={styles.errorContainer}>
//               <Text style={styles.errorText}>Lead could not be loaded.</Text>
//               <Button title="Close" variant="outline" onPress={onClose} />
//             </View>
//           ) : (
//             <ScrollView
//               style={styles.scrollArea}
//               contentContainerStyle={styles.content}
//               showsVerticalScrollIndicator={true}
//             >
//               {/* Header Card */}
//               <LeadHeader lead={lead} />

//               {/* Quick Action Buttons */}
//               <LeadActionBar
//                 leadId={lead.id}
//                 onCustomerOpen={onClose}
//                 onAddFollowUp={() => setFollowUpOpen(true)}
//                 onAddReminder={() => setReminderOpen(true)}
//                 onAddMeeting={() => setMeetingOpen(true)}
//                 onCreateQuotation={() => setQuotationOpen(true)}
//                 onCreateInvoice={() => setInvoiceOpen(true)}
//               />

//               {/* 8 Section Tabs */}
//               <LeadSectionTabs
//                 selected={selectedSection}
//                 onSelect={setSelectedSection}
//                 summary={summary}
//                 loading={summaryLoading}
//                 error={summaryError}
//               />

//               {/* Selected Section View */}
//               <View style={styles.sectionBody}>
//                 {selectedSection === 'details' && (
//                   <LeadDetailsSection
//                     lead={lead}
//                     onEdit={() => setEditLeadOpen(true)}
//                     onDelete={() => setDeleteConfirmOpen(true)}
//                     onCancel={onClose}
//                   />
//                 )}

//                 {selectedSection === 'followups' && (
//                   <FollowUpsSection leadId={lead.id} summary={summary} />
//                 )}

//                 {selectedSection === 'history' && (
//                   <HistorySection leadId={lead.id} />
//                 )}

//                 {selectedSection === 'reminders' && (
//                   <RemindersSection leadId={lead.id} summary={summary} />
//                 )}

//                 {selectedSection === 'meetings' && (
//                   <MeetingsSection leadId={lead.id} summary={summary} />
//                 )}

//                 {selectedSection === 'quotations' && (
//                   <QuotationsSection
//                     leadId={lead.id}
//                     summary={summary}
//                     onCreateInvoiceFromQuote={(_invoice: SalesDocument) => {
//                       setSelectedSection('invoices');
//                       void refetchSummary();
//                     }}
//                   />
//                 )}

//                 {selectedSection === 'invoices' && (
//                   <InvoicesSection leadId={lead.id} summary={summary} />
//                 )}
//               </View>
//             </ScrollView>
//           )}

//           {/* Edit Lead Modal */}
//           <LeadFormModal
//             visible={editLeadOpen && canAccess('lead')}
//             lead={lead ?? null}
//             defaultAssignee={userName}
//             onClose={() => {
//               setEditLeadOpen(false);
//               void refetchLead();
//             }}
//           />

//           {/* Delete Lead Confirm Dialog */}
//           <ConfirmDialog
//             visible={deleteConfirmOpen && canAccess('lead')}
//             title="Delete lead?"
//             message={`This will archive ${lead?.name ?? 'this lead'} and retain all its linked records.`}
//             loading={del.isPending}
//             onConfirm={confirmDelete}
//             onCancel={() => setDeleteConfirmOpen(false)}
//           />

//           {/* Add FollowUp Modal */}
//           {followUpOpen && lead ? (
//             <FollowUpFormModal
//               visible={followUpOpen && canAccess('lead')}
//               leadId={lead.id}
//               defaultAssignee={lead.assignedTo || userName}
//               onSaved={() => {
//                 setFollowUpOpen(false);
//                 handleRecordSaved('followups');
//               }}
//               onClose={() => setFollowUpOpen(false)}
//             />
//           ) : null}

//           {/* Add Reminder Modal */}
//           {reminderOpen && lead ? (
//             <ReminderFormModal
//               visible={reminderOpen && canAccess('reminder')}
//               leadId={lead.id}
//               onSaved={() => {
//                 setReminderOpen(false);
//                 handleRecordSaved('reminders');
//               }}
//               onClose={() => setReminderOpen(false)}
//             />
//           ) : null}

//           {/* Add Meeting Modal */}
//           {meetingOpen && lead ? (
//             <MeetingFormModal
//               visible={meetingOpen && canAccess('meeting')}
//               leadId={lead.id}
//               defaultAssignee={lead.assignedTo || userName}
//               onSaved={() => {
//                 setMeetingOpen(false);
//                 handleRecordSaved('meetings');
//               }}
//               onClose={() => setMeetingOpen(false)}
//             />
//           ) : null}

//           {/* Create Quotation Modal */}
//           {quotationOpen && lead ? (
//             <SalesDocumentFormModal
//               visible={quotationOpen && canAccess('invoice')}
//               leadId={lead.id}
//               type="QUOTATION"
//               lead={lead}
//               onSaved={() => {
//                 setQuotationOpen(false);
//                 handleRecordSaved('quotations');
//               }}
//               onClose={() => setQuotationOpen(false)}
//             />
//           ) : null}

//           {/* Create Invoice Modal */}
//           {invoiceOpen && lead ? (
//             <SalesDocumentFormModal
//               visible={invoiceOpen && canAccess('invoice')}
//               leadId={lead.id}
//               type="INVOICE"
//               lead={lead}
//               onSaved={() => {
//                 setInvoiceOpen(false);
//                 handleRecordSaved('invoices');
//               }}
//               onClose={() => setInvoiceOpen(false)}
//             />
//           ) : null}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(15, 23, 42, 0.65)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 16,
//   },
//   modalBox: {
//     width: '100%',
//     maxWidth: 1080,
//     height: '92%',
//     backgroundColor: colors.white,
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   titleBar: {
//     backgroundColor: '#0B2F7D',
//     paddingHorizontal: 18,
//     paddingVertical: 14,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   titleLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     flex: 1,
//   },
//   titleText: {
//     color: colors.white,
//     fontWeight: '800',
//     fontSize: 16,
//   },
//   titleSub: {
//     color: '#E2E8F0',
//     fontWeight: '600',
//     fontSize: 14,
//     flexShrink: 1,
//   },
//   closeBtn: {
//     padding: 4,
//     borderRadius: 6,
//   },
//   scrollArea: {
//     flex: 1,
//   },
//   content: {
//     padding: 16,
//     gap: 16,
//   },
//   sectionBody: {
//     minHeight: 280,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 12,
//     padding: 40,
//   },
//   loadingText: {
//     color: colors.muted,
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   errorContainer: {
//     padding: 24,
//     gap: 12,
//     alignItems: 'flex-start',
//   },
//   errorText: {
//     color: colors.danger,
//     fontSize: 14,
//   },
// });

// apps/client/src/components/lead/LeadDetailsModal.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';
import { useDeleteLead, useLead } from '@/hooks/useLeads';
import { useSectionSummary } from '@/hooks/useLeadActivities';
import { LeadSection } from '@/types/leadActivities';
import { SalesDocument } from '@/types/salesDocuments';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import LeadFormModal from '@/components/LeadFormModal';

import LeadHeader from './LeadHeader';
import LeadActionBar from './LeadActionBar';
import LeadSectionTabs from './LeadSectionTabs';
import LeadDetailsSection from './LeadDetailsSection';
import FollowUpsSection from './FollowUpsSection';
import RemindersSection from './RemindersSection';
import MeetingsSection from './MeetingsSection';
import QuotationsSection from './QuotationsSection';
import InvoicesSection from './InvoicesSection';
import HistorySection from './HistorySection';

import FollowUpFormModal from './FollowUpFormModal';
import ReminderFormModal from './ReminderFormModal';
import MeetingFormModal from './MeetingFormModal';
import SalesDocumentFormModal from './SalesDocumentFormModal';

type Props = {
  visible: boolean;
  leadId: string | null;
  onClose: () => void;
};

const NAVY = '#0B2F7D';

export default function LeadDetailsModal({ visible, leadId, onClose }: Props) {
  const { userName } = useAuth();
  const { canAccess } = usePermissions();
  const { width } = useWindowDimensions();
  const compact = width < 640;

  const [requestedSection, setSelectedSection] = useState<LeadSection>('details');
  const selectedSection = canAccess(leadSectionPermissions[requestedSection]) ? requestedSection : 'details';

  const {
    data: lead,
    isLoading: leadLoading,
    isError: leadError,
    refetch: refetchLead,
  } = useLead(leadId ?? '');

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useSectionSummary(leadId ?? '');

  const del = useDeleteLead();

  // Sub-modals
  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (!visible || !leadId) return null;

  async function confirmDelete() {
    if (!lead) return;
    try {
      await del.mutateAsync(lead.id);
      onClose();
    } finally {
      setDeleteConfirmOpen(false);
    }
  }

  function handleRecordSaved(targetSection: LeadSection) {
    setSelectedSection(targetSection);
    void refetchSummary();
    void refetchLead();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, compact && styles.overlayCompact]}>
        <View style={[styles.modalBox, compact && styles.modalBoxCompact]}>
          {/* Title bar */}
          <View style={styles.titleBar}>
            <View style={styles.titleIcon}>
              <Ionicons name="person-circle-outline" size={20} color={colors.white} />
            </View>
            <View style={styles.titleTextWrap}>
              <Text style={styles.titleText}>Lead Details</Text>
              {lead ? (
                <Text style={styles.titleSub} numberOfLines={1}>
                  {lead.name}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Ionicons name="close" size={20} color={colors.white} />
            </Pressable>
          </View>

          {leadLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={NAVY} />
              <Text style={styles.loadingText}>Loading lead details...</Text>
            </View>
          ) : leadError || !lead ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorText}>Lead could not be loaded.</Text>
              <Button title="Close" variant="outline" onPress={onClose} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={[styles.content, compact && styles.contentCompact]}
              showsVerticalScrollIndicator={true}
            >
              <LeadHeader lead={lead} />

              <LeadActionBar
                leadId={lead.id}
                onCustomerOpen={onClose}
                onAddFollowUp={() => setFollowUpOpen(true)}
                onAddReminder={() => setReminderOpen(true)}
                onAddMeeting={() => setMeetingOpen(true)}
                onCreateQuotation={() => setQuotationOpen(true)}
                onCreateInvoice={() => setInvoiceOpen(true)}
              />

              <View style={styles.tabsAndBody}>
                <LeadSectionTabs
                  selected={selectedSection}
                  onSelect={setSelectedSection}
                  summary={summary}
                  loading={summaryLoading}
                  error={summaryError}
                />

                <View style={styles.sectionBody}>
                  {selectedSection === 'details' && (
                    <LeadDetailsSection
                      lead={lead}
                      onEdit={() => setEditLeadOpen(true)}
                      onDelete={() => setDeleteConfirmOpen(true)}
                      onCancel={onClose}
                    />
                  )}

                  {selectedSection === 'followups' && (
                    <FollowUpsSection leadId={lead.id} summary={summary} />
                  )}

                  {selectedSection === 'history' && (
                    <HistorySection leadId={lead.id} />
                  )}

                  {selectedSection === 'reminders' && (
                    <RemindersSection leadId={lead.id} summary={summary} />
                  )}

                  {selectedSection === 'meetings' && (
                    <MeetingsSection leadId={lead.id} summary={summary} />
                  )}

                  {selectedSection === 'quotations' && (
                    <QuotationsSection
                      leadId={lead.id}
                      summary={summary}
                      onCreateInvoiceFromQuote={(_invoice: SalesDocument) => {
                        setSelectedSection('invoices');
                        void refetchSummary();
                      }}
                    />
                  )}

                  {selectedSection === 'invoices' && (
                    <InvoicesSection leadId={lead.id} summary={summary} />
                  )}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Edit Lead Modal */}
          <LeadFormModal
            visible={editLeadOpen && canAccess('lead')}
            lead={lead ?? null}
            defaultAssignee={userName}
            onClose={() => {
              setEditLeadOpen(false);
              void refetchLead();
            }}
          />

          {/* Delete Lead Confirm Dialog */}
          <ConfirmDialog
            visible={deleteConfirmOpen && canAccess('lead')}
            title="Delete lead?"
            message={`This will archive ${lead?.name ?? 'this lead'} and retain all its linked records.`}
            loading={del.isPending}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirmOpen(false)}
          />

          {/* Add FollowUp Modal */}
          {followUpOpen && lead ? (
            <FollowUpFormModal
              visible={followUpOpen && canAccess('lead')}
              leadId={lead.id}
              defaultAssignee={lead.assignedTo || userName}
              onSaved={() => {
                setFollowUpOpen(false);
                handleRecordSaved('followups');
              }}
              onClose={() => setFollowUpOpen(false)}
            />
          ) : null}

          {/* Add Reminder Modal */}
          {reminderOpen && lead ? (
            <ReminderFormModal
              visible={reminderOpen && canAccess('reminder')}
              leadId={lead.id}
              onSaved={() => {
                setReminderOpen(false);
                handleRecordSaved('reminders');
              }}
              onClose={() => setReminderOpen(false)}
            />
          ) : null}

          {/* Add Meeting Modal */}
          {meetingOpen && lead ? (
            <MeetingFormModal
              visible={meetingOpen && canAccess('meeting')}
              leadId={lead.id}
              defaultAssignee={lead.assignedTo || userName}
              onSaved={() => {
                setMeetingOpen(false);
                handleRecordSaved('meetings');
              }}
              onClose={() => setMeetingOpen(false)}
            />
          ) : null}

          {/* Create Quotation Modal */}
          {quotationOpen && lead ? (
            <SalesDocumentFormModal
              visible={quotationOpen && canAccess('invoice')}
              leadId={lead.id}
              type="QUOTATION"
              lead={lead}
              onSaved={() => {
                setQuotationOpen(false);
                handleRecordSaved('quotations');
              }}
              onClose={() => setQuotationOpen(false)}
            />
          ) : null}

          {/* Create Invoice Modal */}
          {invoiceOpen && lead ? (
            <SalesDocumentFormModal
              visible={invoiceOpen && canAccess('invoice')}
              leadId={lead.id}
              type="INVOICE"
              lead={lead}
              onSaved={() => {
                setInvoiceOpen(false);
                handleRecordSaved('invoices');
              }}
              onClose={() => setInvoiceOpen(false)}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayCompact: {
    padding: 0,
  },
  modalBox: {
    width: '100%',
    maxWidth: 1080,
    height: '92%',
    backgroundColor: '#F4F6FA',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalBoxCompact: {
    height: '100%',
    maxWidth: undefined,
    borderRadius: 0,
  },
  titleBar: {
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextWrap: {
    flex: 1,
    gap: 1,
  },
  titleText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  titleSub: {
    color: '#C7D2E8',
    fontWeight: '500',
    fontSize: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  contentCompact: {
    padding: 12,
    gap: 12,
  },
  tabsAndBody: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionBody: {
    minHeight: 280,
    padding: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    padding: 32,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 6,
  },
});
```

---

## `apps/client/src/components/lead/LeadHeader.tsx`

```tsx
// // apps/client/src/components/lead/LeadHeader.tsx
// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { Lead, statusLabel } from '@/types/lead';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { formatDateTime, formatINR } from '@/utils/format';
// import { colors } from '@/theme/colors';
// import Stars from '@/components/Stars';

// export default function LeadHeader({ lead }: { lead: Lead }) {
//   const statusesQuery = useLeadStatuses();
//   const matchedStatus = statusesQuery.data?.find(
//     (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
//   );
//   const statusName = matchedStatus?.name ?? statusLabel(lead.status);
//   const statusColor = matchedStatus?.color;

//   return (
//     <View style={styles.header}>
//       <View style={styles.row}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>{(lead.name || 'L').charAt(0).toUpperCase()}</Text>
//         </View>
//         <View style={styles.titleInfo}>
//           <View style={styles.nameRow}>
//             <Text style={styles.name}>{lead.name}</Text>
//             <View style={[styles.statusBadge, statusColor && { backgroundColor: statusColor + '1A' }]}>
//               <Text style={[styles.statusText, statusColor && { color: statusColor }]}>{statusName}</Text>
//             </View>
//           </View>
//           {lead.companyName ? <Text style={styles.company}>{lead.companyName}</Text> : null}
//           <View style={styles.metaRow}>
//             <Text style={styles.metaText}>Assigned to: <Text style={styles.metaBold}>{lead.assignedTo || 'Unassigned'}</Text></Text>
//             <Text style={styles.dot}>•</Text>
//             <Text style={styles.metaText}>Phone: <Text style={styles.metaBold}>{lead.phone}</Text></Text>
//             {lead.email ? (
//               <>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.metaText}>Email: <Text style={styles.metaBold}>{lead.email}</Text></Text>
//               </>
//             ) : null}
//           </View>
//         </View>
//       </View>

//       <View style={styles.summaryBar}>
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Next Follow-up</Text>
//           <Text style={[styles.summaryVal, !lead.nextFollowUpAt && styles.emptyVal]}>
//             {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
//           </Text>
//         </View>
//         <View style={styles.divider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Estimated Amount</Text>
//           <Text style={styles.summaryVal}>{formatINR(Number(lead.estimatedAmount))}</Text>
//         </View>
//         <View style={styles.divider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Rating</Text>
//           <Stars value={lead.rating} size={15} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     backgroundColor: colors.white,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     padding: 16,
//     gap: 14,
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 14,
//     alignItems: 'flex-start',
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: colors.primarySoft,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: colors.primaryText,
//   },
//   titleInfo: {
//     flex: 1,
//     gap: 4,
//   },
//   nameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     flexWrap: 'wrap',
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: colors.text,
//   },
//   statusBadge: {
//     backgroundColor: colors.primarySoft,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   company: {
//     fontSize: 14,
//     color: colors.muted,
//     fontWeight: '500',
//   },
//   metaRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     alignItems: 'center',
//     gap: 8,
//     marginTop: 2,
//   },
//   metaText: {
//     fontSize: 12,
//     color: colors.muted,
//   },
//   metaBold: {
//     fontWeight: '700',
//     color: colors.text,
//   },
//   dot: {
//     fontSize: 12,
//     color: colors.muted,
//   },
//   summaryBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.primarySoft,
//     borderRadius: 6,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   summaryItem: {
//     flex: 1,
//     minWidth: 110,
//     gap: 2,
//   },
//   summaryLabel: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   summaryVal: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: colors.text,
//   },
//   emptyVal: {
//     color: colors.muted,
//     fontStyle: 'italic',
//     fontWeight: '400',
//   },
//   divider: {
//     width: 1,
//     height: 24,
//     backgroundColor: colors.border,
//   },
// });


// apps/client/src/components/lead/LeadHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead, statusLabel } from '@/types/lead';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Stars from '@/components/Stars';

function MetaChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color={colors.primaryText} />
      </View>
      <View style={styles.statBody}>
        <Text style={styles.statLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function LeadHeader({ lead }: { lead: Lead }) {
  const statusesQuery = useLeadStatuses();
  const matchedStatus = statusesQuery.data?.find(
    (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
  );
  const statusName = matchedStatus?.name ?? statusLabel(lead.status);
  const statusColor = matchedStatus?.color;

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(lead.name || 'L').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.titleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {lead.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusColor ? { backgroundColor: statusColor + '1A' } : null,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor || colors.primaryText },
                ]}
              />
              <Text style={[styles.statusText, statusColor ? { color: statusColor } : null]}>
                {statusName}
              </Text>
            </View>
          </View>

          {lead.companyName ? (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={14} color={colors.muted} />
              <Text style={styles.company}>{lead.companyName}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <MetaChip icon="person-outline" text={lead.assignedTo || 'Unassigned'} />
            <MetaChip icon="call-outline" text={lead.phone} />
            {lead.email ? <MetaChip icon="mail-outline" text={lead.email} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <Stat icon="calendar-outline" label="Next Follow-up">
          <Text style={[styles.statVal, !lead.nextFollowUpAt && styles.emptyVal]} numberOfLines={1}>
            {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
          </Text>
        </Stat>
        <View style={styles.divider} />
        <Stat icon="cash-outline" label="Estimated Amount">
          <Text style={styles.statVal}>{formatINR(Number(lead.estimatedAmount))}</Text>
        </Stat>
        <View style={styles.divider} />
        <Stat icon="star-outline" label="Rating">
          <Stars value={lead.rating} size={15} />
        </Stat>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryText,
  },
  titleInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  company: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  emptyVal: {
    color: colors.muted,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
});






```

---

## `apps/client/src/components/lead/LeadActionBar.tsx`

```tsx
// // apps/client/src/components/lead/LeadActionBar.tsx
// import React from 'react';
// import { StyleSheet, Text, View, Pressable } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { colors } from '@/theme/colors';
// import ConvertLeadAction from './ConvertLeadAction';
// import { usePermissions } from '@/hooks/usePermissions';
// import type { ModulePermission } from '@/hooks/usePermissions';

// type Props = {
//   leadId: string;
//   onCustomerOpen?: () => void;
//   onAddFollowUp: () => void;
//   onAddReminder: () => void;
//   onAddMeeting: () => void;
//   onCreateQuotation: () => void;
//   onCreateInvoice: () => void;
// };

// interface ActionItem {
//   key: string;
//   permission: ModulePermission;
//   label: string;
//   icon: keyof typeof Ionicons.glyphMap;
//   onPress: () => void;
//   primary?: boolean;
// }

// export default function LeadActionBar({
//   leadId, onCustomerOpen, onAddFollowUp, onAddReminder,
//   onAddMeeting, onCreateQuotation, onCreateInvoice,
// }: Props) {
//   const { canAccess } = usePermissions();
//   const actions: ActionItem[] = [
//     { key: 'followup', permission: 'lead', label: 'Add FollowUp', icon: 'call-outline', onPress: onAddFollowUp },
//     { key: 'reminder', permission: 'reminder', label: 'Add Reminder', icon: 'alarm-outline', onPress: onAddReminder },
//     { key: 'meeting', permission: 'meeting', label: 'Add Meeting', icon: 'calendar-outline', onPress: onAddMeeting },
//     { key: 'quotation', permission: 'invoice', label: 'Create Quotation', icon: 'document-text-outline', onPress: onCreateQuotation },
//     { key: 'invoice', permission: 'invoice', label: 'Create Invoice', icon: 'receipt-outline', onPress: onCreateInvoice, primary: true },
//   ];

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionHeading}>Quick Actions</Text>
//       <View style={styles.actionsRow}>
//         {canAccess('customer') ? <ConvertLeadAction key={leadId} leadId={leadId} onCustomerOpen={onCustomerOpen} /> : null}
//         {actions.filter(item => canAccess(item.permission)).map(item => (
//           <React.Fragment key={item.key}>
//             <Pressable
//               accessibilityRole="button"
//               accessibilityLabel={item.label}
//               onPress={item.onPress}
//               style={({ pressed }) => [
//                 styles.actionBtn,
//                 item.primary ? styles.primaryBtn : styles.outlineBtn,
//                 pressed && styles.pressedBtn,
//               ]}
//             >
//               <Ionicons name={item.icon} size={16} color={item.primary ? colors.white : colors.primaryText} />
//               <Text style={[styles.actionText, item.primary ? styles.primaryText : styles.outlineText]}>
//                 {item.label}
//               </Text>
//             </Pressable>
//           </React.Fragment>
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
//     borderRadius: 8, padding: 12, gap: 8,
//   },
//   sectionHeading: {
//     fontSize: 12, fontWeight: '700', color: colors.muted,
//     textTransform: 'uppercase', letterSpacing: 0.5,
//   },
//   actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
//   actionBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6, minHeight: 38,
//   },
//   outlineBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
//   primaryBtn: { backgroundColor: colors.accent },
//   pressedBtn: { opacity: 0.8 },
//   actionText: { fontSize: 13, fontWeight: '700' },
//   outlineText: { color: colors.primaryText },
//   primaryText: { color: colors.white },
// });


// apps/client/src/components/lead/LeadActionBar.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import ConvertLeadAction from './ConvertLeadAction';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModulePermission } from '@/hooks/usePermissions';

type Props = {
  leadId: string;
  onCustomerOpen?: () => void;
  onAddFollowUp: () => void;
  onAddReminder: () => void;
  onAddMeeting: () => void;
  onCreateQuotation: () => void;
  onCreateInvoice: () => void;
};

interface ActionItem {
  key: string;
  permission: ModulePermission;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}

export default function LeadActionBar({
  leadId, onCustomerOpen, onAddFollowUp, onAddReminder,
  onAddMeeting, onCreateQuotation, onCreateInvoice,
}: Props) {
  const { canAccess } = usePermissions();
  const actions: ActionItem[] = [
    { key: 'followup', permission: 'lead', label: 'Add FollowUp', icon: 'call-outline', onPress: onAddFollowUp },
    { key: 'reminder', permission: 'reminder', label: 'Add Reminder', icon: 'alarm-outline', onPress: onAddReminder },
    { key: 'meeting', permission: 'meeting', label: 'Add Meeting', icon: 'calendar-outline', onPress: onAddMeeting },
    { key: 'quotation', permission: 'invoice', label: 'Create Quotation', icon: 'document-text-outline', onPress: onCreateQuotation },
    { key: 'invoice', permission: 'invoice', label: 'Create Invoice', icon: 'receipt-outline', onPress: onCreateInvoice, primary: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Ionicons name="flash-outline" size={14} color={colors.muted} />
        <Text style={styles.sectionHeading}>Quick Actions</Text>
      </View>
      <View style={styles.actionsRow}>
        {canAccess('customer') ? <ConvertLeadAction key={leadId} leadId={leadId} onCustomerOpen={onCustomerOpen} /> : null}
        {actions.filter(item => canAccess(item.permission)).map(item => (
          <React.Fragment key={item.key}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.actionBtn,
                item.primary ? styles.primaryBtn : styles.outlineBtn,
                pressed && styles.pressedBtn,
              ]}
            >
              <Ionicons name={item.icon} size={16} color={item.primary ? colors.white : colors.primaryText} />
              <Text style={[styles.actionText, item.primary ? styles.primaryText : styles.outlineText]}>
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeading: {
    fontSize: 11, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, minHeight: 40,
  },
  outlineBtn: { backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.accent },
  pressedBtn: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  actionText: { fontSize: 13, fontWeight: '700' },
  outlineText: { color: colors.primaryText },
  primaryText: { color: colors.white },
});
```

---

## `apps/client/src/components/lead/LeadSectionTabs.tsx`

```tsx
// // apps/client/src/components/lead/LeadSectionTabs.tsx
// import React from 'react';
// import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
// import { colors } from '@/theme/colors';
// import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';
// import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';

// type Props = {
//   selected: LeadSection;
//   onSelect: (section: LeadSection) => void;
//   summary?: SectionSummary;
//   loading: boolean;
//   error: boolean;
// };

// export default function LeadSectionTabs({
//   selected,
//   onSelect,
//   summary,
//   loading,
//   error,
// }: Props) {
//   const { canAccess } = usePermissions();
//   // Badges map to counts for non-deleted records
//   const getBadgeCount = (key: LeadSection): number | string | null => {
//     if (key === 'details' || key === 'history') return null;
//     if (loading) return '…';
//     if (error || !summary) return '…';
//     const c = summary.counts[key as keyof SectionSummary['counts']];
//     return typeof c === 'number' ? c : '…';
//   };

//   return (
//     <View style={styles.tabContainer}>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//         accessibilityRole="tablist"
//         accessibilityLabel="Lead section tabs"
//       >
//         {sectionOrder.filter(key => canAccess(leadSectionPermissions[key])).map((key) => {
//           const active = selected === key;
//           const badge = getBadgeCount(key);

//           return (
//             <Pressable
//               key={key}
//               accessibilityRole="tab"
//               accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
//               accessibilityState={{ selected: active }}
//               onPress={() => onSelect(key)}
//               style={[styles.tab, active && styles.activeTab]}
//             >
//               <Text style={[styles.tabText, active && styles.activeTabText]}>
//                 {sectionLabels[key]}
//               </Text>
//               {badge !== null ? (
//                 <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
//                   <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
//                     {String(badge)}
//                   </Text>
//                 </View>
//               ) : null}
//             </Pressable>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   tabContainer: {
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   scrollContent: {
//     flexDirection: 'row',
//     alignItems: 'stretch',
//   },
//   tab: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderBottomWidth: 3,
//     borderBottomColor: 'transparent',
//     minHeight: 46,
//   },
//   activeTab: {
//     borderBottomColor: colors.accent,
//   },
//   tabText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   activeTabText: {
//     fontWeight: '800',
//     color: colors.primaryText,
//   },
//   badge: {
//     minWidth: 20,
//     height: 20,
//     paddingHorizontal: 6,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   inactiveBadge: {
//     backgroundColor: colors.primarySoft,
//   },
//   activeBadge: {
//     backgroundColor: colors.accent,
//   },
//   badgeText: {
//     fontSize: 11,
//     fontWeight: '700',
//   },
//   inactiveBadgeText: {
//     color: colors.primaryText,
//   },
//   activeBadgeText: {
//     color: colors.white,
//   },
// });

// apps/client/src/components/lead/LeadSectionTabs.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { colors } from '@/theme/colors';
import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';
import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';

type Props = {
  selected: LeadSection;
  onSelect: (section: LeadSection) => void;
  summary?: SectionSummary;
  loading: boolean;
  error: boolean;
};

export default function LeadSectionTabs({
  selected,
  onSelect,
  summary,
  loading,
  error,
}: Props) {
  const { canAccess } = usePermissions();
  // Badges map to counts for non-deleted records
  const getBadgeCount = (key: LeadSection): number | string | null => {
    if (key === 'details' || key === 'history') return null;
    if (loading) return '…';
    if (error || !summary) return '…';
    const c = summary.counts[key as keyof SectionSummary['counts']];
    return typeof c === 'number' ? c : '…';
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist"
        accessibilityLabel="Lead section tabs"
      >
        {sectionOrder.filter(key => canAccess(leadSectionPermissions[key])).map((key) => {
          const active = selected === key;
          const badge = getBadgeCount(key);

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.activeTab,
                !active && pressed && styles.pressedTab,
              ]}
            >
              <Text style={[styles.tabText, active && styles.activeTabText]}>
                {sectionLabels[key]}
              </Text>
              {badge !== null ? (
                <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                    {String(badge)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    backgroundColor: '#F8FAFD',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: 48,
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  pressedTab: {
    opacity: 0.65,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  activeTabText: {
    fontWeight: '800',
    color: colors.primaryText,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadge: {
    backgroundColor: '#E8ECF4',
  },
  activeBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inactiveBadgeText: {
    color: colors.muted,
  },
  activeBadgeText: {
    color: colors.white,
  },
});
```

---

## `apps/client/src/components/lead/LeadDetailsSection.tsx`

```tsx
// // apps/client/src/components/lead/LeadDetailsSection.tsx
// import React from 'react';
// import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
// import { Lead, sourceLabel, statusLabel } from '@/types/lead';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { formatDateTime, formatINR } from '@/utils/format';
// import { colors } from '@/theme/colors';
// import Button from '@/components/Button';
// import Stars from '@/components/Stars';

// function Card({ title, wide, children }: { title: string; wide: boolean; children: React.ReactNode }) {
//   return (
//     <View style={[styles.card, wide && { flex: 1 }]}>
//       <View style={styles.cardHead}>
//         <Text style={styles.cardTitle}>{title}</Text>
//       </View>
//       <View style={styles.cardBody}>{children}</View>
//     </View>
//   );
// }

// function Item({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
//   return (
//     <View style={styles.item}>
//       <Text style={styles.label}>{label} :</Text>
//       {children ?? <Text style={styles.value}>{value || '-'}</Text>}
//     </View>
//   );
// }

// type Props = {
//   lead: Lead;
//   onEdit: () => void;
//   onDelete: () => void;
//   onCancel: () => void;
// };

// export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
//   const { width } = useWindowDimensions();
//   const wide = width >= 900;
//   const statusesQuery = useLeadStatuses();
//   const matchedStatus = statusesQuery.data?.find(
//     (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
//   );
//   const statusName = matchedStatus?.name ?? statusLabel(lead.status);

//   return (
//     <View style={styles.container}>
//       <View style={[styles.cards, wide && { flexDirection: 'row' }]}>
//         <Card title="Lead Information" wide={wide}>
//           <Item label="Name" value={lead.name} />
//           <Item label="Company Name" value={lead.companyName} />
//           <Item label="Service" value={lead.service?.name} />
//           <Item label="Phone" value={lead.phone} />
//           <Item label="Email Address" value={lead.email} />
//           <Item label="Address" value={lead.address} />
//           <Item label="Comment" value={lead.comment} />
//           <Item label="Reference" value={lead.reference} />
//         </Card>

//         <Card title="General Information" wide={wide}>
//           <Item label="Date" value={formatDateTime(lead.createdAt)} />
//           <Item label="Follow Up Date" value={formatDateTime(lead.nextFollowUpAt)} />
//           <Item label="Status" value={statusName} />
//           <Item label="Source" value={sourceLabel(lead.source)} />
//           <Item label="Labels">
//             {lead.label ? (
//               <View style={styles.chip}>
//                 <Text style={styles.chipText}>{lead.label}</Text>
//               </View>
//             ) : (
//               <Text style={styles.value}>-</Text>
//             )}
//           </Item>
//           <Item label="Estimated Amount" value={formatINR(Number(lead.estimatedAmount))} />
//           <Item label="Rating">
//             <Stars value={lead.rating} size={18} />
//           </Item>
//           <Item label="Created By" value={lead.createdBy} />
//           <Item label="Assign To" value={lead.assignedTo} />
//         </Card>
//       </View>

//       <View style={styles.btnRow}>
//         <Button title="Edit Lead" onPress={onEdit} />
//         <Button title="Delete Lead" variant="danger" onPress={onDelete} />
//         <Button title="Back to Leads" variant="outline" onPress={onCancel} />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     gap: 16,
//   },
//   cards: {
//     gap: 16,
//   },
//   card: {
//     backgroundColor: colors.white,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   cardHead: {
//     backgroundColor: colors.navy,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   cardTitle: {
//     color: colors.white,
//     fontWeight: '800',
//     fontSize: 15,
//   },
//   cardBody: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   item: {
//     paddingVertical: 10,
//     gap: 4,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   label: {
//     fontSize: 12,
//     fontWeight: '800',
//     color: colors.text,
//   },
//   value: {
//     fontSize: 13,
//     color: colors.muted,
//   },
//   chip: {
//     alignSelf: 'flex-start',
//     backgroundColor: colors.primarySoft,
//     borderRadius: 10,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//   },
//   chipText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   btnRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 10,
//     flexWrap: 'wrap',
//   },
// });


// apps/client/src/components/lead/LeadDetailsSection.tsx
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead, sourceLabel, statusLabel } from '@/types/lead';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Button from '@/components/Button';
import Stars from '@/components/Stars';

function Card({
  title,
  icon,
  wide,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  wide: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, wide && { flex: 1 }]}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={16} color={colors.primaryText} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Item({
  label,
  value,
  last,
  children,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.item, last && styles.itemLast]}>
      <Text style={styles.label}>{label}</Text>
      {children ?? (
        <Text style={[styles.value, !value && styles.valueEmpty]}>{value || '—'}</Text>
      )}
    </View>
  );
}

type Props = {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const statusesQuery = useLeadStatuses();
  const matchedStatus = statusesQuery.data?.find(
    (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
  );
  const statusName = matchedStatus?.name ?? statusLabel(lead.status);

  return (
    <View style={styles.container}>
      <View style={[styles.cards, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <Card title="Lead Information" icon="person-outline" wide={wide}>
          <Item label="Name" value={lead.name} />
          <Item label="Company Name" value={lead.companyName} />
          <Item label="Service" value={lead.service?.name} />
          <Item label="Phone" value={lead.phone} />
          <Item label="Email Address" value={lead.email} />
          <Item label="Address" value={lead.address} />
          <Item label="Comment" value={lead.comment} />
          <Item label="Reference" value={lead.reference} last />
        </Card>

        <Card title="General Information" icon="information-circle-outline" wide={wide}>
          <Item label="Date" value={formatDateTime(lead.createdAt)} />
          <Item label="Follow Up Date" value={formatDateTime(lead.nextFollowUpAt)} />
          <Item label="Status" value={statusName} />
          <Item label="Source" value={sourceLabel(lead.source)} />
          <Item label="Labels">
            {lead.label ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{lead.label}</Text>
              </View>
            ) : (
              <Text style={[styles.value, styles.valueEmpty]}>—</Text>
            )}
          </Item>
          <Item label="Estimated Amount" value={formatINR(Number(lead.estimatedAmount))} />
          <Item label="Rating">
            <Stars value={lead.rating} size={18} />
          </Item>
          <Item label="Created By" value={lead.createdBy} />
          <Item label="Assign To" value={lead.assignedTo} last />
        </Card>
      </View>

      <View style={styles.btnRow}>
        <Button title="Back to Leads" variant="outline" onPress={onCancel} />
        <Button title="Delete Lead" variant="danger" onPress={onDelete} />
        <Button title="Edit Lead" onPress={onEdit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  cards: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFD',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  item: {
    paddingVertical: 11,
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  valueEmpty: {
    color: colors.muted,
    fontWeight: '400',
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
});
```

---

## `apps/client/app/(app)/lead/[id].tsx`

```tsx
// apps/client/app/(app)/lead/[id].tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';
import { useDeleteLead, useLead } from '@/hooks/useLeads';
import { useSectionSummary } from '@/hooks/useLeadActivities';
import { LeadSection } from '@/types/leadActivities';
import { SalesDocument } from '@/types/salesDocuments';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import LeadFormModal from '@/components/LeadFormModal';

import LeadHeader from '@/components/lead/LeadHeader';
import LeadActionBar from '@/components/lead/LeadActionBar';
import LeadSectionTabs from '@/components/lead/LeadSectionTabs';
import LeadDetailsSection from '@/components/lead/LeadDetailsSection';
import FollowUpsSection from '@/components/lead/FollowUpsSection';
import RemindersSection from '@/components/lead/RemindersSection';
import MeetingsSection from '@/components/lead/MeetingsSection';
import QuotationsSection from '@/components/lead/QuotationsSection';
import InvoicesSection from '@/components/lead/InvoicesSection';
import HistorySection from '@/components/lead/HistorySection';

import FollowUpFormModal from '@/components/lead/FollowUpFormModal';
import ReminderFormModal from '@/components/lead/ReminderFormModal';
import MeetingFormModal from '@/components/lead/MeetingFormModal';
import SalesDocumentFormModal from '@/components/lead/SalesDocumentFormModal';

export default function LeadDetails() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const router = useRouter();
  const { userName } = useAuth();
  const { canAccess } = usePermissions();

  const validSections: LeadSection[] = [
    'details',
    'followups',
    'history',
    'reminders',
    'meetings',
    'quotations',
    'invoices',
  ];
  const initialSection = (section && validSections.includes(section as LeadSection))
    ? (section as LeadSection)
    : 'details';

  const [requestedSection, setSelectedSection] = useState<LeadSection>(initialSection);
  const selectedSection = canAccess(leadSectionPermissions[requestedSection]) ? requestedSection : 'details';

  // Queries
  const { data: lead, isLoading: leadLoading, isError: leadError, refetch: refetchLead } = useLead(id);
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useSectionSummary(id);

  const del = useDeleteLead();

  // Modals
  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const goBoard = () => router.replace('/leads' as any);

  async function confirmDelete() {
    if (!lead) return;
    try {
      await del.mutateAsync(lead.id);
      goBoard();
    } finally {
      setDeleteConfirmOpen(false);
    }
  }

  function handleRecordSaved(targetSection: LeadSection) {
    setSelectedSection(targetSection);
    void refetchSummary();
    void refetchLead();
  }

  return (
    <View style={styles.page}>
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Lead Details</Text>
        <Button title="← Back to Leads" variant="outline" onPress={goBoard} />
      </View>

      {leadLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : leadError || !lead ? (
        <View style={{ padding: 24, gap: 12, alignItems: 'flex-start' }}>
          <Text style={{ color: colors.danger }}>Lead not found.</Text>
          <Button title="Back to Leads" variant="outline" onPress={goBoard} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header Card */}
          <LeadHeader lead={lead} />

          {/* Quick Action Buttons */}
          <LeadActionBar
            leadId={lead.id}
            onAddFollowUp={() => setFollowUpOpen(true)}
            onAddReminder={() => setReminderOpen(true)}
            onAddMeeting={() => setMeetingOpen(true)}
            onCreateQuotation={() => setQuotationOpen(true)}
            onCreateInvoice={() => setInvoiceOpen(true)}
          />

          {/* 8 Section Tabs */}
          <LeadSectionTabs
            selected={selectedSection}
            onSelect={setSelectedSection}
            summary={summary}
            loading={summaryLoading}
            error={summaryError}
          />

          {/* Selected Section View */}
          <View style={styles.sectionBody}>
            {selectedSection === 'details' && (
              <LeadDetailsSection
                lead={lead}
                onEdit={() => setEditLeadOpen(true)}
                onDelete={() => setDeleteConfirmOpen(true)}
                onCancel={goBoard}
              />
            )}

            {selectedSection === 'followups' && (
              <FollowUpsSection leadId={lead.id} summary={summary} />
            )}

            {selectedSection === 'history' && (
              <HistorySection leadId={lead.id} />
            )}

            {selectedSection === 'reminders' && (
              <RemindersSection leadId={lead.id} summary={summary} />
            )}

            {selectedSection === 'meetings' && (
              <MeetingsSection leadId={lead.id} summary={summary} />
            )}

            {selectedSection === 'quotations' && (
              <QuotationsSection
                leadId={lead.id}
                summary={summary}
                onCreateInvoiceFromQuote={(_invoice: SalesDocument) => {
                  setSelectedSection('invoices');
                  void refetchSummary();
                }}
              />
            )}

            {selectedSection === 'invoices' && (
              <InvoicesSection leadId={lead.id} summary={summary} />
            )}
          </View>
        </ScrollView>
      )}

      {/* Edit Lead Modal */}
      <LeadFormModal
        visible={editLeadOpen && canAccess('lead')}
        lead={lead ?? null}
        defaultAssignee={userName}
        onClose={() => setEditLeadOpen(false)}
      />

      {/* Delete Lead Confirm Dialog */}
      <ConfirmDialog
        visible={deleteConfirmOpen && canAccess('lead')}
        title="Delete lead?"
        message={`This will archive ${lead?.name ?? 'this lead'} and retain all its linked records.`}
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Add FollowUp Modal */}
      {followUpOpen && lead ? (
        <FollowUpFormModal
          visible={followUpOpen && canAccess('lead')}
          leadId={lead.id}
          defaultAssignee={lead.assignedTo || userName}
          onSaved={() => {
            setFollowUpOpen(false);
            handleRecordSaved('followups');
          }}
          onClose={() => setFollowUpOpen(false)}
        />
      ) : null}

      {/* Add Reminder Modal */}
      {reminderOpen && lead ? (
        <ReminderFormModal
          visible={reminderOpen && canAccess('reminder')}
          leadId={lead.id}
          onSaved={() => {
            setReminderOpen(false);
            handleRecordSaved('reminders');
          }}
          onClose={() => setReminderOpen(false)}
        />
      ) : null}

      {/* Add Meeting Modal */}
      {meetingOpen && lead ? (
        <MeetingFormModal
          visible={meetingOpen && canAccess('meeting')}
          leadId={lead.id}
          defaultAssignee={lead.assignedTo || userName}
          onSaved={() => {
            setMeetingOpen(false);
            handleRecordSaved('meetings');
          }}
          onClose={() => setMeetingOpen(false)}
        />
      ) : null}

      {/* Create Quotation Modal */}
      {quotationOpen && lead ? (
        <SalesDocumentFormModal
          visible={quotationOpen && canAccess('invoice')}
          leadId={lead.id}
          type="QUOTATION"
          lead={lead}
          onSaved={() => {
            setQuotationOpen(false);
            handleRecordSaved('quotations');
          }}
          onClose={() => setQuotationOpen(false)}
        />
      ) : null}

      {/* Create Invoice Modal */}
      {invoiceOpen && lead ? (
        <SalesDocumentFormModal
          visible={invoiceOpen && canAccess('invoice')}
          leadId={lead.id}
          type="INVOICE"
          lead={lead}
          onSaved={() => {
            setInvoiceOpen(false);
            handleRecordSaved('invoices');
          }}
          onClose={() => setInvoiceOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  titleBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionBody: {
    minHeight: 280,
  },
});
```

---

## `apps/client/app/(app)/leads.tsx`

```tsx
// apps/client/app/(app)/leads.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { colors } from '@/theme/colors';
// import { errorMessage } from '@/api/client';
// import { useAuth } from '@/context/AuthContext';
// import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useLeads';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { Lead, LeadStatus, STATUS_LIST } from '@/types/lead';
// import { LeadDndProvider } from '@/context/LeadDndContext';
// import ActionMenu from '@/components/ActionMenu';
// import Button from '@/components/Button';
// import ConfirmDialog from '@/components/ConfirmDialog';
// import KanbanColumn from '@/components/KanbanColumn';
// import LeadFormModal from '@/components/LeadFormModal';
// import LeadDetailsModal from '@/components/lead/LeadDetailsModal';

// export default function LeadsBoard() {
//   const router = useRouter();
//   const { userName } = useAuth();
//   const { height } = useWindowDimensions();

//   const [searchText, setSearchText] = useState('');
//   const [search, setSearch] = useState('');
//   useEffect(() => {
//     const t = setTimeout(() => setSearch(searchText.trim()), 300);
//     return () => clearTimeout(t);
//   }, [searchText]);

//   const { data, isLoading, isError, error, refetch } = useLeads(search);
//   const statusesQuery = useLeadStatuses();
//   const activeStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
//   const columns = activeStatuses.length > 0
//     ? activeStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
//     : STATUS_LIST;

//   const del = useDeleteLead();
//   const updateLead = useUpdateLead();

//   const [formOpen, setFormOpen] = useState(false);
//   const [editLead, setEditLead] = useState<Lead | null>(null);
//   const [menuLead, setMenuLead] = useState<Lead | null>(null);
//   const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
//   const [selectedLeadModalId, setSelectedLeadModalId] = useState<string | null>(null);

//   const leads = data ?? [];

//   const handleDropLead = (leadId: string, targetStatus: LeadStatus) => {
//     const target = leads.find((l) => l.id === leadId);
//     if (!target || target.status === targetStatus) return;
//     updateLead.mutate({ id: leadId, data: { status: targetStatus } });
//   };

//   async function confirmDelete() {
//     if (!deleteLead) return;
//     try {
//       await del.mutateAsync(deleteLead.id);
//     } finally {
//       setDeleteLead(null);
//     }
//   }

//   return (
//     <View style={styles.page}>
//       <View style={styles.topbar}>
//         <Text style={styles.heading}>Leads</Text>
//         <TextInput
//           style={styles.search}
//           placeholder="Search name, phone, email, company"
//           placeholderTextColor={colors.muted}
//           value={searchText}
//           onChangeText={setSearchText}
//         />
//         <Button
//           title="Add Lead"
//           onPress={() => {
//             setEditLead(null);
//             setFormOpen(true);
//           }}
//         />
//       </View>

//       {isLoading ? (
//         <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
//       ) : isError ? (
//         <View style={styles.errBox}>
//           <Text style={styles.errText}>{errorMessage(error)}</Text>
//           <Button title="Retry" variant="outline" onPress={() => refetch()} />
//         </View>
//       ) : (
//         <LeadDndProvider onDropLead={handleDropLead}>
//           <ScrollView horizontal contentContainerStyle={styles.board}>
//             {columns.map((s) => (
//               <KanbanColumn
//                 key={s.key}
//                 statusKey={s.key}
//                 title={s.label}
//                 leads={leads.filter((l) => l.status === s.key || (l.status && l.status.toLowerCase() === s.label.toLowerCase()))}
//                 maxHeight={Math.max(height - 220, 240)}
//                 onOpen={(l) => setSelectedLeadModalId(l.id)}
//                 onMenu={(l) => setMenuLead(l)}
//               />
//             ))}
//           </ScrollView>
//         </LeadDndProvider>
//       )}

//       <ActionMenu
//         visible={!!menuLead}
//         title={menuLead?.name ?? ''}
//         onClose={() => setMenuLead(null)}
//         onEdit={() => {
//           setEditLead(menuLead);
//           setMenuLead(null);
//           setFormOpen(true);
//         }}
//         onDelete={() => {
//           setDeleteLead(menuLead);
//           setMenuLead(null);
//         }}
//       />

//       <ConfirmDialog
//         visible={!!deleteLead}
//         title="Delete lead?"
//         message={`This will permanently delete ${deleteLead?.name ?? 'this lead'}.`}
//         loading={del.isPending}
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteLead(null)}
//       />

//       <LeadFormModal
//         visible={formOpen}
//         lead={editLead}
//         defaultAssignee={userName}
//         onClose={() => setFormOpen(false)}
//       />

//       <LeadDetailsModal
//         visible={!!selectedLeadModalId}
//         leadId={selectedLeadModalId}
//         onClose={() => setSelectedLeadModalId(null)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: '#F7F9FC' },
//   topbar: {
//     flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
//     padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
//   },
//   heading: { fontSize: 20, fontWeight: '800', color: colors.text },
//   search: {
//     flex: 1, minWidth: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
//     paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text, backgroundColor: colors.white,
//   },
//   board: { padding: 16, gap: 12, alignItems: 'flex-start' },
//   errBox: { padding: 24, gap: 12, alignItems: 'flex-start' },
//   errText: { color: colors.danger },
// });

import React, { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { Lead, LeadStatus, STATUS_LIST } from '@/types/lead';
import { LeadDndProvider } from '@/context/LeadDndContext';
import ActionMenu from '@/components/ActionMenu';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import KanbanColumn from '@/components/KanbanColumn';
import LeadFormModal from '@/components/LeadFormModal';
import LeadDetailsModal from '@/components/lead/LeadDetailsModal';

const BOARD_PADDING = 20;
const COMPACT_BREAKPOINT = 640;
const DANGER_SOFT = '#FFF1F0';

function BoardSkeleton() {
  return (
    <View accessibilityLabel="Loading leads" style={styles.skeletonRow}>
      {[0, 1, 2].map((column) => (
        <View key={column} style={styles.skeletonColumn}>
          <View style={styles.skeletonTitle} />
          {[0, 1, 2].map((card) => <View key={card} style={styles.skeletonCard} />)}
        </View>
      ))}
    </View>
  );
}

export default function LeadsBoard() {
  const router = useRouter();
  const { userName } = useAuth();
  const { height, width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [boardHeight, setBoardHeight] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, isLoading, isError, error, refetch } = useLeads(search);
  const statusesQuery = useLeadStatuses();
  const activeStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
  const columns = activeStatuses.length > 0
    ? activeStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
    : STATUS_LIST;

  const del = useDeleteLead();
  const updateLead = useUpdateLead();

  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [menuLead, setMenuLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [selectedLeadModalId, setSelectedLeadModalId] = useState<string | null>(null);

  const leads = data ?? [];
  const noSearchResults = !isLoading && !isError && !!search && leads.length === 0;

  // Column height follows the real space available to the board; falls back to the window until measured.
  const columnMaxHeight = boardHeight > 0
    ? Math.max(boardHeight - BOARD_PADDING * 2, 240)
    : Math.max(height - 240, 240);

  let subtitle = 'Loading leads';
  if (!isLoading && !isError) {
    const count = leads.length;
    subtitle = search
      ? `${count} ${count === 1 ? 'result' : 'results'} for "${search}"`
      : `${count} total ${count === 1 ? 'lead' : 'leads'}`;
  } else if (isError) {
    subtitle = 'Unable to load leads';
  }

  const handleDropLead = (leadId: string, targetStatus: LeadStatus) => {
    const target = leads.find((l) => l.id === leadId);
    if (!target || target.status === targetStatus) return;
    updateLead.mutate({ id: leadId, data: { status: targetStatus } });
  };

  async function confirmDelete() {
    if (!deleteLead) return;
    try {
      await del.mutateAsync(deleteLead.id);
    } finally {
      setDeleteLead(null);
    }
  }

  const searchField = (
    <View style={[styles.searchWrap, compact ? styles.searchWrapCompact : styles.searchWrapWide, searchFocused && styles.searchFocused]}>
      <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.muted} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search name, phone, email, company"
        placeholderTextColor={colors.muted}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        accessibilityLabel="Search leads"
        returnKeyType="search"
      />
      {searchText.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearchText('')} style={styles.clearButton}>
          <Ionicons name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.heading}>Leads</Text>
            <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
          </View>
          {!compact ? searchField : null}
          <Button
            title="Add Lead"
            onPress={() => {
              setEditLead(null);
              setFormOpen(true);
            }}
          />
        </View>
        {compact ? searchField : null}
      </View>

      <View style={styles.boardArea} onLayout={(event) => setBoardHeight(event.nativeEvent.layout.height)}>
        {isLoading ? (
          <BoardSkeleton />
        ) : isError ? (
          <View accessibilityRole="alert" style={styles.stateCard}>
            <View style={[styles.stateIcon, { backgroundColor: DANGER_SOFT }]}>
              <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
            </View>
            <Text style={styles.stateTitle}>Couldn't load leads</Text>
            <Text style={styles.errText}>{errorMessage(error)}</Text>
            <Button title="Retry" variant="outline" onPress={() => refetch()} />
          </View>
        ) : noSearchResults ? (
          <View style={styles.stateCard}>
            <View style={[styles.stateIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="search-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.stateTitle}>No leads found</Text>
            <Text style={styles.stateText}>Nothing matches "{search}". Try a different name, phone, email or company.</Text>
            <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} />
          </View>
        ) : (
          <LeadDndProvider onDropLead={handleDropLead}>
            <ScrollView horizontal contentContainerStyle={styles.board}>
              {columns.map((s) => (
                <KanbanColumn
                  key={s.key}
                  statusKey={s.key}
                  title={s.label}
                  leads={leads.filter((l) => l.status === s.key || (l.status && l.status.toLowerCase() === s.label.toLowerCase()))}
                  maxHeight={columnMaxHeight}
                  onOpen={(l) => setSelectedLeadModalId(l.id)}
                  onMenu={(l) => setMenuLead(l)}
                />
              ))}
            </ScrollView>
          </LeadDndProvider>
        )}
      </View>

      <ActionMenu
        visible={!!menuLead}
        title={menuLead?.name ?? ''}
        onClose={() => setMenuLead(null)}
        onEdit={() => {
          setEditLead(menuLead);
          setMenuLead(null);
          setFormOpen(true);
        }}
        onDelete={() => {
          setDeleteLead(menuLead);
          setMenuLead(null);
        }}
      />

      <ConfirmDialog
        visible={!!deleteLead}
        title="Delete lead?"
        message={`This will permanently delete ${deleteLead?.name ?? 'this lead'}.`}
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteLead(null)}
      />

      <LeadFormModal
        visible={formOpen}
        lead={editLead}
        defaultAssignee={userName}
        onClose={() => setFormOpen(false)}
      />

      <LeadDetailsModal
        visible={!!selectedLeadModalId}
        leadId={selectedLeadModalId}
        onClose={() => setSelectedLeadModalId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC' },

  /* Header */
  topbar: { paddingHorizontal: 20, paddingVertical: 14, gap: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  titleBlock: { flexShrink: 1, minWidth: 90 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },

  /* Search */
  searchWrap: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F7F9FC' },
  searchWrapWide: { flex: 1, maxWidth: 460, marginLeft: 'auto' },
  searchWrapCompact: { width: '100%' },
  searchFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 14, color: colors.text },
  clearButton: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF0F8' },

  /* Board */
  boardArea: { flex: 1 },
  board: { padding: BOARD_PADDING, gap: 16, alignItems: 'flex-start' },

  /* Loading skeleton */
  skeletonRow: { flexDirection: 'row', gap: 16, padding: BOARD_PADDING, overflow: 'hidden' },
  skeletonColumn: { width: 280, padding: 12, gap: 10, borderRadius: 14, backgroundColor: '#EEF3FA' },
  skeletonTitle: { width: 110, height: 14, borderRadius: 7, marginBottom: 4, backgroundColor: '#DCE6F4' },
  skeletonCard: { height: 84, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E4EBF5' },

  /* Empty + error states */
  stateCard: { alignSelf: 'center', alignItems: 'center', width: '100%', maxWidth: 400, marginTop: 48, padding: 24, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, boxShadow: '0 4px 14px rgba(11,47,125,0.07)' },
  stateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  stateText: { fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center', marginBottom: 6 },
  errText: { fontSize: 13, lineHeight: 19, color: colors.danger, textAlign: 'center', marginBottom: 6 },
});
```
