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
