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
