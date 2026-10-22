import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
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

export default function LeadsBoard() {
  const router = useRouter();
  const { userName } = useAuth();
  const { height } = useWindowDimensions();

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
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

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Text style={styles.heading}>Leads</Text>
        <TextInput
          style={styles.search}
          placeholder="Search name, phone, email, company"
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Button
          title="Add Lead"
          onPress={() => {
            setEditLead(null);
            setFormOpen(true);
          }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : isError ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{errorMessage(error)}</Text>
          <Button title="Retry" variant="outline" onPress={() => refetch()} />
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
                maxHeight={Math.max(height - 220, 240)}
                onOpen={(l) => setSelectedLeadModalId(l.id)}
                onMenu={(l) => setMenuLead(l)}
              />
            ))}
          </ScrollView>
        </LeadDndProvider>
      )}

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
  topbar: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text },
  search: {
    flex: 1, minWidth: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text, backgroundColor: colors.white,
  },
  board: { padding: 16, gap: 12, alignItems: 'flex-start' },
  errBox: { padding: 24, gap: 12, alignItems: 'flex-start' },
  errText: { color: colors.danger },
});
