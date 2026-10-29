import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import Stars from '@/components/Stars';
import LeadDetailsModal from '@/components/lead/LeadDetailsModal';
import LeadSectionTabs from '@/components/lead/LeadSectionTabs';
import FollowUpsSection from '@/components/lead/FollowUpsSection';
import RemindersSection from '@/components/lead/RemindersSection';
import MeetingsSection from '@/components/lead/MeetingsSection';
import QuotationsSection from '@/components/lead/QuotationsSection';
import InvoicesSection from '@/components/lead/InvoicesSection';
import HistorySection from '@/components/lead/HistorySection';
import { useCustomer } from '@/hooks/useCustomers';
import { useSectionSummary } from '@/hooks/useLeadActivities';
import { colors } from '@/theme/colors';
import { sourceLabel, statusLabel } from '@/types/lead';
import { LeadSection } from '@/types/leadActivities';
import { formatDateTime, formatINR } from '@/utils/format';
import CustomerSelectionsModal from './CustomerSelectionsModal';
import { useQueryClient } from '@tanstack/react-query';

export default function CustomerDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useCustomer(id);
  const queryClient = useQueryClient();
  const customer = query.data;
  const lead = customer?.lead;
  const summary = useSectionSummary(lead && !lead.deletedAt ? lead.id : '');
  const [section, setSection] = useState<LeadSection>('details');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectionsOpen, setSelectionsOpen] = useState(false);

  const back = () => router.replace('/customers' as Href);

  if (query.isLoading) {
    return <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Loading customer…</Text></View>;
  }

  if (query.isError || !customer || !lead) {
    return (
      <View style={styles.state}>
        <Text accessibilityRole="alert" style={styles.error}>
          {query.isError ? errorMessage(query.error) : 'Customer not found.'}
        </Text>
        <Button title="Retry" variant="outline" onPress={() => { void query.refetch(); }} />
        <Button title="Back to Customers" variant="outline" onPress={back} />
      </View>
    );
  }

  const fields: [string, string][] = [
    ['Customer Name', lead.name],
    ['Company Name', lead.companyName || '—'],
    ['Phone', lead.phone || '—'],
    ['Email Address', lead.email || '—'],
    ['State', lead.state || '—'],
    ['Address', lead.address || '—'],
    ['Comment', lead.comment || '—'],
    ['Reference', lead.reference || '—'],
    ['Services', lead.services?.map(item => item.name).join(', ') || '—'],
    ['Products', lead.products?.map(item => item.name).join(', ') || '—'],
    ['Lead Status', statusLabel(lead.status)],
    ['Source', sourceLabel(lead.source)],
    ['Label', lead.label || '—'],
    ['Estimated Amount', formatINR(Number(lead.estimatedAmount))],
    ['Next Follow Up', formatDateTime(lead.nextFollowUpAt) || '—'],
    ['Assigned To', lead.assignedTo || '—'],
    ['Lead Created By', lead.createdBy || '—'],
    ['Lead Created Date', formatDateTime(lead.createdAt) + ' IST'],
    ['Last Updated', formatDateTime(lead.updatedAt) + ' IST'],
    ['Converted Date', formatDateTime(customer.convertedAt) + ' IST'],
    ['Converted By', customer.convertedByName],
  ];

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.eyebrow}>CUSTOMER DETAILS</Text>
            <Text style={styles.title}>{lead.name}</Text>
            {lead.companyName ? <Text style={styles.muted}>{lead.companyName}</Text> : null}
          </View>
          <Button title="Back to Customers" variant="outline" onPress={back} />
        </View>

        <View style={styles.conversion}>
          <Text style={styles.conversionText}>
            Converted on {formatDateTime(customer.convertedAt)} IST by {customer.convertedByName}
          </Text>
          <Button
            title="Open Source Lead"
            variant="outline"
            disabled={!!lead.deletedAt}
            onPress={() => setSourceOpen(true)}
          />
        </View>

        {lead.deletedAt ? (
          <View style={styles.panel}>
            <Text style={styles.muted}>
              The source lead was archived. Customer details are retained.
              Existing lead activity tools are unavailable while the source lead is archived.
            </Text>
          </View>
        ) : (
          <LeadSectionTabs
            selected={section}
            onSelect={setSection}
            summary={summary.data}
            loading={summary.isLoading}
            error={summary.isError}
          />
        )}

        {section === 'details' || lead.deletedAt ? (
          <View style={styles.panel}>
            <View style={styles.fields}>
              {fields.map(([label, value]) => (
                <View key={label} style={[styles.field, { width: width >= 1000 ? '48%' : '100%' }]}>
                  <Text style={styles.label}>{label}</Text>
                  <Text selectable style={styles.value}>{value}</Text>
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.label}>Rating</Text>
                <Stars value={lead.rating} size={18} />
              </View>
            </View>
            {!lead.deletedAt ? <View style={{ marginTop: 16, alignItems: 'flex-start' }}><Button title="Edit Services & Products" variant="outline" onPress={() => setSelectionsOpen(true)} /></View> : null}
          </View>
        ) : (
          <View style={styles.section}>
            {section === 'followups' ? <FollowUpsSection leadId={lead.id} summary={summary.data} /> : null}
            {section === 'reminders' ? <RemindersSection leadId={lead.id} summary={summary.data} /> : null}
            {section === 'meetings' ? <MeetingsSection leadId={lead.id} summary={summary.data} /> : null}
            {section === 'history' ? <HistorySection leadId={lead.id} /> : null}
            {section === 'quotations' ? (
              <QuotationsSection
                leadId={lead.id}
                summary={summary.data}
                onCreateInvoiceFromQuote={() => {
                  setSection('invoices');
                  void summary.refetch();
                }}
              />
            ) : null}
            {section === 'invoices' ? <InvoicesSection leadId={lead.id} summary={summary.data} /> : null}
          </View>
        )}
      </ScrollView>

      {sourceOpen && !lead.deletedAt ? (
        <LeadDetailsModal
          key={lead.id}
          visible
          leadId={lead.id}
          onClose={() => {
            setSourceOpen(false);
            void query.refetch();
            void summary.refetch();
          }}
        />
      ) : null}
      {selectionsOpen && !lead.deletedAt ? <CustomerSelectionsModal customer={customer} visible onClose={() => setSelectionsOpen(false)} onSaved={updated => queryClient.setQueryData(['customer', updated.id], updated)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  header: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 18, backgroundColor: colors.white,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: colors.muted },
  title: { fontSize: 23, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  conversion: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, padding: 14, backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
  },
  conversionText: { flexGrow: 1, flexShrink: 1, fontSize: 13, lineHeight: 20, color: colors.primaryText },
  panel: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 16, backgroundColor: colors.white },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { paddingVertical: 10, gap: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  value: { fontSize: 14, color: colors.text, lineHeight: 21 },
  section: { minHeight: 280 },
  state: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 14 },
  error: { color: colors.danger, fontSize: 14 },
});
