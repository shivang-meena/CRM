import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { errorMessage } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateStaff, useStaffList, useUpdateStaff, useUpdateStaffStatus } from '@/hooks/useStaff';
import { StaffFormModal } from '@/staff/StaffFormModal';
import { colors } from '@/theme/colors';
import { StaffFilterStatus, StaffFormValues, StaffMember, StaffPayload, StaffStatus } from '@/types/staff';

const PAGE_SIZES = [10, 25, 50];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const defaultPermissions = {
  lead: true,
  reminder: true,
  meeting: true,
  note: true,
  calendar: true,
  customer: true,
  invoice: false,
  staff: false,
  leave: true,
};

const blankForm = (): StaffFormValues => ({
  firstName: '', lastName: '', email: '', phone: '', birthDate: '', joiningDate: today(),
  status: 'ACTIVE', department: '', designation: '', employeeCode: '',
  password: '',
  canLoginApp: true,
  permissions: { ...defaultPermissions },
});

function TableCell({ width, children }: { width: number; children: React.ReactNode }) {
  return <View style={[styles.cell, { width }]}>{children}</View>;
}

export function StaffScreen() {
  const { isAdmin } = usePermissions();
  const { width: windowWidth } = useWindowDimensions();
  const desktop = windowWidth >= 960;
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StaffFilterStatus>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [values, setValues] = useState<StaffFormValues>(blankForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ staff: StaffMember; status: StaffStatus } | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const filters = useMemo(() => ({
    search: search || undefined,
    status: filter === 'ALL' ? undefined : filter,
    page,
    pageSize,
  }), [search, filter, page, pageSize]);
  const staffQuery = useStaffList(filters);
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const statusMutation = useUpdateStaffStatus();
  const data = staffQuery.data;
  const staff = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const summary = data?.summary ?? { totalCount: 0, activeCount: 0, inactiveCount: 0 };
  const pending = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    if (!isAdmin) return;
    setSelected(null);
    setValues(blankForm());
    setFormError(null);
    setFeedback(null);
    setFormMode('create');
  }

  function openEdit(person: StaffMember) {
    if (!isAdmin) return;
    setSelected(person);
    setValues({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone ?? '',
      birthDate: person.birthDate ?? '',
      joiningDate: person.joiningDate,
      status: person.status,
      department: person.department ?? '',
      designation: person.designation ?? '',
      employeeCode: person.employeeCode ?? '',
      password: '',
      canLoginApp: person.canLoginApp ?? false,
      permissions: person.permissions ? { ...person.permissions } : { ...defaultPermissions },
    });
    setFormError(null);
    setFeedback(null);
    setFormMode('edit');
  }

  function closeForm() {
    if (pending) return;
    setFormMode('closed');
    setSelected(null);
    setFormError(null);
  }

  function changeField<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    setValues(current => ({ ...current, [key]: value }));
    if (formError) setFormError(null);
  }

  function submitSearch() {
    setSearch(draftSearch.trim());
    setPage(1);
    setExpandedId(null);
  }

  function validateForm(): string | null {
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const email = values.email.trim();
    const birthDate = values.birthDate.trim();
    const joiningDate = values.joiningDate.trim();
    if (!firstName) return 'First name is required.';
    if (!lastName) return 'Last name is required.';
    if (!email) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!validDate(joiningDate)) return 'Joining date must be a valid YYYY-MM-DD date.';
    if (birthDate && !validDate(birthDate)) return 'Birth date must be a valid YYYY-MM-DD date.';
    if (birthDate && birthDate >= joiningDate) return 'Birth date must be earlier than joining date.';
    if (values.canLoginApp) {
      if (formMode === 'create' && (!values.password || values.password.trim().length < 6)) {
        return 'Password is required (min 6 characters) when app login is allowed.';
      }
      if (formMode === 'edit' && values.password && values.password.trim().length < 6) {
        return 'Password must be at least 6 characters.';
      }
    }
    return null;
  }

  async function submitForm() {
    if (!isAdmin) return;
    if (pending) return;
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }
    const payload: StaffPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim() || null,
      birthDate: values.birthDate.trim() || null,
      joiningDate: values.joiningDate.trim(),
      status: values.status,
      department: values.department.trim() || null,
      designation: values.designation.trim() || null,
      employeeCode: values.employeeCode.trim() || null,
      password: values.password.trim() || null,
      canLoginApp: values.canLoginApp,
      permissions: values.permissions,
    };
    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(payload);
        setFeedback({ kind: 'success', message: 'Staff member added successfully.' });
      } else if (formMode === 'edit' && selected) {
        await updateMutation.mutateAsync({ id: selected.id, payload: { ...payload, version: selected.version } });
        setFeedback({ kind: 'success', message: 'Staff details updated successfully.' });
      }
      setFormMode('closed');
      setSelected(null);
      setFormError(null);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function confirmStatusChange() {
    if (!isAdmin) return;
    if (!statusTarget || statusMutation.isPending) return;
    try {
      await statusMutation.mutateAsync({ id: statusTarget.staff.id, status: statusTarget.status, version: statusTarget.staff.version });
      setFeedback({ kind: 'success', message: `${statusTarget.staff.firstName} ${statusTarget.staff.lastName} is now ${statusTarget.status.toLowerCase()}.` });
      setStatusTarget(null);
    } catch (error) {
      setFeedback({ kind: 'error', message: `${errorMessage(error)} Reload the list and try again.` });
      setStatusTarget(null);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedId(current => current === id ? null : id);
  }

  function personDetails(person: StaffMember) {
    return (
      <View style={styles.detailPanel}>
        <View style={styles.detailItem}><Text style={styles.detailLabel}>Department</Text><Text style={styles.detailValue}>{person.department || '—'}</Text></View>
        <View style={styles.detailItem}><Text style={styles.detailLabel}>Designation</Text><Text style={styles.detailValue}>{person.designation || '—'}</Text></View>
        <View style={styles.detailItem}><Text style={styles.detailLabel}>Employee code</Text><Text style={styles.detailValue}>{person.employeeCode || '—'}</Text></View>
        <View style={styles.detailItem}><Text style={styles.detailLabel}>Created</Text><Text style={styles.detailValue}>{person.createdAt.slice(0, 10)}</Text></View>
      </View>
    );
  }

  const statusFilters: StaffFilterStatus[] = ['ALL', 'ACTIVE', 'INACTIVE'];
  const tableColumns = [
    { label: 'No.', width: 72 }, { label: 'Actions', width: 110 },
    { label: 'First Name', width: 145 }, { label: 'Last Name', width: 145 },
    { label: 'Email', width: 230 }, { label: 'Phone', width: 145 },
    { label: 'Birth Date', width: 125 }, { label: 'Joining Date', width: 130 }, { label: 'Status', width: 125 },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headingBlock}>
            <Text style={styles.title}>Staff</Text>
            <Text style={styles.caption}>{summary.totalCount} staff members · {summary.activeCount} active</Text>
          </View>
          <View style={styles.toolbar}>
            <View style={styles.searchGroup}>
              <TextInput
                accessibilityLabel="Search staff by name, email, phone, code or department"
                value={draftSearch}
                onChangeText={setDraftSearch}
                onSubmitEditing={submitSearch}
                placeholder="Search staff…"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Search staff" onPress={submitSearch} style={styles.searchButton}><Text style={styles.searchButtonText}>⌕</Text></Pressable>
            </View>
            {(draftSearch || search) ? <Pressable accessibilityRole="button" onPress={() => { setDraftSearch(''); setSearch(''); setPage(1); }} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Clear</Text></Pressable> : null}
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: reportsOpen }} onPress={() => setReportsOpen(open => !open)} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Reports {reportsOpen ? '⌃' : '⌄'}</Text></Pressable>
            {isAdmin ? <Pressable accessibilityRole="button" accessibilityLabel="Add staff" onPress={openCreate} style={styles.primaryButton}><Text style={styles.primaryButtonText}>＋ Add Staff</Text></Pressable> : null}
          </View>
        </View>
        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Status</Text>
          {statusFilters.map(option => {
            const active = filter === option;
            return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { setFilter(option); setPage(1); setExpandedId(null); }} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{option === 'ALL' ? 'All' : option === 'ACTIVE' ? 'Active' : 'Inactive'}{option === 'ALL' ? `  ${summary.totalCount}` : option === 'ACTIVE' ? `  ${summary.activeCount}` : `  ${summary.inactiveCount}`}</Text>
            </Pressable>;
          })}
        </View>
        {reportsOpen ? <View style={styles.reportPanel}>
          <View style={styles.reportCell}><Text style={styles.reportLabel}>Total staff</Text><Text style={styles.reportValue}>{summary.totalCount}</Text></View>
          <View style={styles.reportCell}><Text style={styles.reportLabel}>Active</Text><Text style={[styles.reportValue, { color: colors.success }]}>{summary.activeCount}</Text></View>
          <View style={styles.reportCell}><Text style={styles.reportLabel}>Inactive</Text><Text style={styles.reportValue}>{summary.inactiveCount}</Text></View>
        </View> : null}
      </View>

      {feedback ? <View accessibilityRole="alert" style={[styles.feedback, feedback.kind === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
        <Text style={[styles.feedbackText, feedback.kind === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText]}>{feedback.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => setFeedback(null)}><Text style={styles.dismiss}>×</Text></Pressable>
      </View> : null}

      <View style={styles.tableCard}>
        {staffQuery.isLoading ? <View style={styles.state}><ActivityIndicator color={colors.primaryText} /><Text style={styles.muted}>Loading staff…</Text></View>
          : staffQuery.isError ? <View style={styles.state}>
            <Text style={styles.stateTitle}>Could not load staff</Text><Text style={styles.muted}>{errorMessage(staffQuery.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void staffQuery.refetch(); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable>
          </View>
          : staff.length === 0 ? <View style={styles.state}>
            <Text style={styles.stateTitle}>{search || filter !== 'ALL' ? 'No staff match these filters' : 'No staff members yet'}</Text>
            <Text style={styles.muted}>{search || filter !== 'ALL' ? 'Clear the search or choose another status.' : 'Add the first employee record to start the directory.'}</Text>
            {search || filter !== 'ALL' ? <Pressable accessibilityRole="button" onPress={() => { setDraftSearch(''); setSearch(''); setFilter('ALL'); setPage(1); }} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Clear filters</Text></Pressable> : isAdmin ? <Pressable accessibilityRole="button" onPress={openCreate} style={styles.primaryButton}><Text style={styles.primaryButtonText}>＋ Add Staff</Text></Pressable> : null}
          </View>
          : desktop ? <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View style={styles.tableHeader}>{tableColumns.map(column => <TableCell key={column.label} width={column.width}><Text style={styles.columnHeading}>{column.label}</Text></TableCell>)}</View>
              {staff.map((person, index) => {
                const expanded = expandedId === person.id;
                const active = person.status === 'ACTIVE';
                const number = (page - 1) * pageSize + index + 1;
                return <View key={person.id} style={styles.rowGroup}>
                  <View style={[styles.tableRow, index % 2 === 1 && styles.alternateRow]}>
                    <TableCell width={72}><Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${person.firstName} ${person.lastName}`} onPress={() => toggleExpanded(person.id)} style={styles.numberCell}><Text style={styles.caret}>{expanded ? '⌄' : '›'}</Text><Text style={styles.value}>{number}</Text></Pressable></TableCell>
                    <TableCell width={110}>{isAdmin ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${person.firstName} ${person.lastName}`} onPress={() => openEdit(person)} style={styles.editButton}><Text style={styles.editButtonText}>✎ Edit</Text></Pressable> : <Text style={styles.muted}>—</Text>}</TableCell>
                    <TableCell width={145}><Text numberOfLines={1} style={[styles.value, styles.bold]}>{person.firstName}</Text></TableCell>
                    <TableCell width={145}><Text numberOfLines={1} style={styles.value}>{person.lastName}</Text></TableCell>
                    <TableCell width={230}><Text numberOfLines={1} selectable style={styles.value}>{person.email}</Text></TableCell>
                    <TableCell width={145}><Text numberOfLines={1} style={styles.value}>{person.phone || '—'}</Text></TableCell>
                    <TableCell width={125}><Text style={styles.value}>{person.birthDate || '—'}</Text></TableCell>
                    <TableCell width={130}><Text style={styles.value}>{person.joiningDate}</Text></TableCell>
                    <TableCell width={125}><Pressable disabled={!isAdmin} accessibilityRole="button" accessibilityLabel={`Change status for ${person.firstName} ${person.lastName}; currently ${active ? 'active' : 'inactive'}`} onPress={() => setStatusTarget({ staff: person, status: active ? 'INACTIVE' : 'ACTIVE' })} style={[styles.statusBadge, styles.tableStatusBadge, active ? styles.activeBadge : styles.inactiveBadge]}>
                      <Text numberOfLines={1} style={[styles.statusText, styles.tableStatusText, active ? styles.activeText : styles.inactiveText]}>{active ? 'Active' : 'Inactive'}</Text>
                      {isAdmin ? <Ionicons name="chevron-down" size={12} color={active ? colors.success : colors.muted} style={styles.tableStatusCaret} /> : null}
                    </Pressable></TableCell>
                  </View>
                  {expanded ? personDetails(person) : null}
                </View>;
              })}
            </View>
          </ScrollView>
          : <View style={styles.cards}>
            {staff.map((person, index) => {
              const expanded = expandedId === person.id;
              const active = person.status === 'ACTIVE';
              return <View key={person.id} style={styles.staffCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>#{(page - 1) * pageSize + index + 1} · {person.firstName} {person.lastName}</Text>
                  <Pressable disabled={!isAdmin} accessibilityRole="button" onPress={() => setStatusTarget({ staff: person, status: active ? 'INACTIVE' : 'ACTIVE' })} style={[styles.statusBadge, active ? styles.activeBadge : styles.inactiveBadge]}><Text style={[styles.statusText, active ? styles.activeText : styles.inactiveText]}>{active ? 'Active' : 'Inactive'}</Text></Pressable>
                </View>
                <Text selectable style={styles.value}>{person.email}</Text>
                <Text style={styles.muted}>Phone: {person.phone || '—'} · Joining: {person.joiningDate}</Text>
                <View style={styles.cardActions}>
                  <Pressable accessibilityRole="button" onPress={() => toggleExpanded(person.id)} style={styles.outlineButton}><Text style={styles.outlineButtonText}>{expanded ? 'Hide details' : 'More details'}</Text></Pressable>
                  {isAdmin ? <Pressable accessibilityRole="button" onPress={() => openEdit(person)} style={styles.editButton}><Text style={styles.editButtonText}>✎ Edit</Text></Pressable> : null}
                </View>
                {expanded ? personDetails(person) : null}
              </View>;
            })}
          </View>}

        {total > 0 ? <View style={styles.pagination}>
          <View style={styles.paginationGroup}><Text style={styles.muted}>Rows per page</Text>{PAGE_SIZES.map(size => <Pressable key={size} accessibilityRole="button" accessibilityState={{ selected: pageSize === size }} onPress={() => { setPageSize(size); setPage(1); }} style={[styles.pageSize, pageSize === size && styles.pageSizeActive]}><Text style={[styles.pageSizeText, pageSize === size && styles.pageSizeTextActive]}>{size}</Text></Pressable>)}</View>
          <View style={styles.paginationGroup}><Text style={styles.muted}>Page {page} of {pages} · {total} records</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous page" disabled={page <= 1 || staffQuery.isFetching} onPress={() => setPage(current => Math.max(1, current - 1))} style={[styles.pageButton, page <= 1 && styles.disabled]}><Text style={styles.pageButtonText}>‹</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next page" disabled={page >= pages || staffQuery.isFetching} onPress={() => setPage(current => Math.min(pages, current + 1))} style={[styles.pageButton, page >= pages && styles.disabled]}><Text style={styles.pageButtonText}>›</Text></Pressable>
          </View>
        </View> : null}
      </View>

      <StaffFormModal visible={isAdmin && formMode !== 'closed'} mode={formMode === 'edit' ? 'edit' : 'create'} values={values} error={formError} pending={pending} onChange={changeField} onClose={closeForm} onSubmit={() => { void submitForm(); }} />

      <Modal visible={isAdmin && Boolean(statusTarget)} transparent animationType="fade" onRequestClose={() => { if (!statusMutation.isPending) setStatusTarget(null); }}>
        <View style={styles.modalBackdrop}><View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Change staff status?</Text>
          <Text style={styles.confirmBody}>{statusTarget ? `${statusTarget.staff.firstName} ${statusTarget.staff.lastName} will be marked ${statusTarget.status.toLowerCase()}.` : ''}</Text>
          <View style={styles.confirmActions}>
            <Pressable disabled={!isAdmin || statusMutation.isPending} accessibilityRole="button" onPress={() => setStatusTarget(null)} style={[styles.outlineButton, styles.confirmButton]}><Text style={styles.outlineButtonText}>Cancel</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={statusMutation.isPending} onPress={() => { void confirmStatusChange(); }} style={[styles.primaryButton, styles.confirmButton, statusMutation.isPending && styles.disabled]}><Text style={styles.primaryButtonText}>{statusMutation.isPending ? 'Saving…' : 'Confirm'}</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 16, gap: 14 },
  headerTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  headingBlock: { gap: 3 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 12 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  searchGroup: { flexDirection: 'row', minWidth: 215, flexGrow: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 7, backgroundColor: colors.white, overflow: 'hidden' },
  searchInput: { flex: 1, minHeight: 40, paddingHorizontal: 10, color: colors.text, fontSize: 13 },
  searchButton: { width: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  searchButtonText: { fontSize: 22, color: colors.primaryText },
  primaryButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 7, backgroundColor: colors.primaryText, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  outlineButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  outlineButtonText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  filterLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginRight: 2 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: colors.primaryText, borderColor: colors.primaryText },
  filterPillText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  filterPillTextActive: { color: colors.white },
  reportPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8 },
  reportCell: { minWidth: 120, flex: 1, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.canvas },
  reportLabel: { color: colors.muted, fontSize: 11 },
  reportValue: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 3 },
  feedback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: colors.successSoft, borderColor: colors.success },
  feedbackError: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  feedbackText: { flex: 1, fontSize: 13, fontWeight: '600' },
  feedbackSuccessText: { color: colors.success },
  feedbackErrorText: { color: colors.danger },
  dismiss: { fontSize: 22, color: colors.muted, paddingHorizontal: 8 },
  tableCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.white, overflow: 'hidden' },
  state: { minHeight: 190, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 11 },
  stateTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.navy, minHeight: 42, alignItems: 'center' },
  cell: { paddingHorizontal: 10, paddingVertical: 11, justifyContent: 'center', flexShrink: 0 },
  columnHeading: { color: colors.white, fontSize: 11, fontWeight: '800' },
  rowGroup: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: colors.white },
  alternateRow: { backgroundColor: '#FAFBFD' },
  value: { color: colors.text, fontSize: 12 },
  bold: { fontWeight: '700' },
  numberCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caret: { color: colors.primaryText, fontSize: 19, width: 14 },
  editButton: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.accentSoft },
  editButtonText: { color: colors.primaryText, fontWeight: '700', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 15, alignSelf: 'flex-start' },
  tableStatusBadge: { minWidth: 90, height: 30, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tableStatusText: { lineHeight: 16 },
  tableStatusCaret: { lineHeight: 16 },
  activeBadge: { backgroundColor: colors.successSoft, borderColor: '#A8DAB5' },
  inactiveBadge: { backgroundColor: '#F1F5F9', borderColor: colors.border },
  statusText: { fontSize: 11, fontWeight: '700' },
  activeText: { color: colors.success },
  inactiveText: { color: colors.muted },
  detailPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border, padding: 14 },
  detailItem: { minWidth: 130, flexGrow: 1, gap: 4 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: colors.text, fontSize: 12 },
  cards: { gap: 10, padding: 10 },
  staffCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 14, gap: 8, backgroundColor: colors.white },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 3 },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  paginationGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pageSize: { paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 5 },
  pageSizeActive: { borderColor: colors.primaryText, backgroundColor: colors.accentSoft },
  pageSizeText: { color: colors.muted, fontSize: 11 },
  pageSizeTextActive: { color: colors.primaryText, fontWeight: '700' },
  pageButton: { width: 32, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 5 },
  pageButtonText: { color: colors.text, fontSize: 18 },
  disabled: { opacity: 0.45 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 18 },
  confirmCard: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 10, backgroundColor: colors.white, gap: 12 },
  confirmTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  confirmBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  confirmButton: { minWidth: 90 },
});
