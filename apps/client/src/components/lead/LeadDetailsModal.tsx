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