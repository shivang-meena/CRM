import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useDashboardActivities } from '@/hooks/useLeadActivities';
import { useStandaloneActivityActions } from '@/hooks/useStandaloneActivities';
import { changeActivity, saveActivity } from '@/api/leadActivities';
import { ActivityRecord } from '@/types/leadActivities';
import { formatDateTime, parseDateTimeInput } from '@/utils/format';
import { errorMessage } from '@/api/client';
import ConfirmDialog from '@/components/ConfirmDialog';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import Button from '@/components/Button';
import StandaloneReminderFormModal from '@/components/reminders/StandaloneReminderFormModal';

function parseDateOnly(iso?: string | null): string {
  if (!iso) return '—';
  const f = formatDateTime(iso);
  return f ? f.slice(0, 10) : '—';
}

function parseTimeOnly(iso?: string | null): string {
  if (!iso) return '—';
  const f = formatDateTime(iso);
  return f ? f.slice(11, 16) : '—';
}

function ReminderDetailsView({
  item,
  lead,
  userName,
}: {
  item: ActivityRecord;
  lead?: { phone?: string; companyName?: string | null; name?: string };
  userName?: string;
}) {
  const leadName = (item.independent ? 'Standalone' : item.lead?.name || lead?.name || 'Customer').toUpperCase();
  const phone = lead?.phone || '—';
  const company = lead?.companyName || '-';
  const title = item.title || '—';
  const message = item.message || item.title || '—';
  const createdBy = item.createdByName || userName || 'Shivang Meena';
  const assignTo = item.assignedTo || item.createdByName || userName || 'Shivang Meena';
  const dateStr = parseDateOnly(item.remindAt);
  const timeStr = parseTimeOnly(item.remindAt);
  const createdAtStr = formatDateTime(item.createdAt);

  return (
    <View style={detailStyles.wrapper}>
      {/* Left Column */}
      <View style={detailStyles.leftCol}>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Customer Name:</Text>
          <Text style={detailStyles.value}>{leadName}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Customer Mobile No.:</Text>
          <Text style={detailStyles.value}>{phone}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Customer Company Name:</Text>
          <Text style={detailStyles.value}>{company}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Title:</Text>
          <Text style={detailStyles.value}>{title}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Message:</Text>
          <Text style={detailStyles.value}>{message}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Created By:</Text>
          <Text style={detailStyles.value}>{createdBy}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Assign To:</Text>
          <Text style={detailStyles.value}>{assignTo}</Text>
        </View>
      </View>

      {/* Right Column */}
      <View style={detailStyles.rightCol}>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Mobile:</Text>
          <Text style={detailStyles.value}>{phone}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Date:</Text>
          <Text style={detailStyles.value}>{dateStr}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Time:</Text>
          <Text style={detailStyles.value}>{timeStr}</Text>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Type:</Text>
          <View style={detailStyles.typeBadge}>
            <Text style={detailStyles.typeBadgeText}>Once</Text>
          </View>
        </View>
        <View style={detailStyles.row}>
          <Text style={detailStyles.label}>Created At :</Text>
          <Text style={detailStyles.value}>{createdAtStr}</Text>
        </View>
      </View>
    </View>
  );
}

export default function RemindersScreen() {
  const qc = useQueryClient();
  const { userName } = useAuth();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPageSizePicker, setShowPageSizePicker] = useState(false);

  // Search & Filter state
  const [searchToggle, setSearchToggle] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'TRIGGERED' | 'DISMISSED' | 'CANCELLED'>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Row selection & expansion state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Modals state
  const [detailModalItem, setDetailModalItem] = useState<ActivityRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityRecord | null>(null);
  const [standaloneEditItem, setStandaloneEditItem] = useState<ActivityRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    item?: ActivityRecord;
  }>({ open: false, type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formDateTime, setFormDateTime] = useState('');
  const [formAssignTo, setFormAssignTo] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Data queries
  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: searchText.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  }), [page, pageSize, searchText, statusFilter]);

  const activitiesQuery = useDashboardActivities('reminders', queryParams);
  const leadsQuery = useLeads('');
  const standaloneActions = useStandaloneActivityActions();

  const items = activitiesQuery.data?.items ?? [];
  const total = activitiesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Selection helpers
  const allCurrentSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const currentItemIds = new Set(items.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !currentItemIds.has(id)));
    } else {
      const currentItemIds = items.map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentItemIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Open Add Modal
  const openAddModal = () => {
    const leads = leadsQuery.data ?? [];
    setSelectedLeadId(leads[0]?.id ?? '');
    setFormTitle('Follow up reminder');
    setFormMessage('');
    setFormDateTime(formatDateTime(new Date().toISOString()));
    setFormAssignTo(userName || 'Shivang Meena');
    setFormError('');
    setEditingItem(null);
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: ActivityRecord) => {
    if (item.independent) { setStandaloneEditItem(item); return; }
    setSelectedLeadId(item.leadId ?? '');
    setFormTitle(item.title || 'Reminder');
    setFormMessage(item.message || '');
    setFormDateTime(formatDateTime(item.remindAt || item.createdAt));
    setFormAssignTo(item.assignedTo || item.createdByName || userName || 'Shivang Meena');
    setFormError('');
    setEditingItem(item);
    setIsAddOpen(true);
  };

  // Save Reminder Handler
  const handleSaveReminder = async () => {
    setFormError('');
    if (!selectedLeadId) {
      setFormError('Please select a customer lead.');
      return;
    }
    const cleanMessage = formMessage.trim();
    const cleanTitle = formTitle.trim() || cleanMessage || 'Reminder';
    if (!cleanTitle && !cleanMessage) {
      setFormError('Message or title is required.');
      return;
    }

    const dateResult = parseDateTimeInput(formDateTime);
    if (!dateResult.ok || !dateResult.value) {
      setFormError('Please enter a valid date and time (DD-MM-YYYY HH:mm).');
      return;
    }

    setIsSaving(true);
    try {
      const requestKey = 'crm_rem_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
      const payload: Record<string, unknown> = {
        title: cleanTitle,
        message: cleanMessage,
        remindAt: dateResult.value,
        assignedTo: formAssignTo.trim() || userName || 'Shivang Meena',
        requestKey,
      };

      await saveActivity(selectedLeadId, 'reminders', payload, editingItem || undefined);

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['dashboard-lead-activities'] }),
        qc.invalidateQueries({ queryKey: ['lead-reminders'] }),
        qc.invalidateQueries({ queryKey: ['notifications'] }),
      ]);

      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err: unknown) {
      setFormError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'single' && deleteConfirm.item) {
        if (deleteConfirm.item.independent) await standaloneActions.deleteReminder.mutateAsync({ id: deleteConfirm.item.id, version: deleteConfirm.item.version });
        else if (deleteConfirm.item.leadId) await changeActivity(deleteConfirm.item.leadId, 'reminders', deleteConfirm.item, 'delete');
        setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirm.item?.id));
      } else if (deleteConfirm.type === 'bulk') {
        const toDelete = items.filter((i) => selectedIds.includes(i.id));
        for (const item of toDelete) {
          try {
            if (item.independent) await standaloneActions.deleteReminder.mutateAsync({ id: item.id, version: item.version });
            else if (item.leadId) await changeActivity(item.leadId, 'reminders', item, 'delete');
          } catch {
            // continue deleting others
          }
        }
        setSelectedIds([]);
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['dashboard-lead-activities'] }),
        qc.invalidateQueries({ queryKey: ['lead-reminders'] }),
      ]);
    } catch (err: unknown) {
      // handled
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ open: false, type: 'single' });
    }
  };

  // Dismiss / Bookmark Action
  const handleToggleBookmark = async (item: ActivityRecord) => {
    try {
      if (item.status === 'PENDING') {
        if (item.independent) await standaloneActions.dismissReminder.mutateAsync({ id: item.id, version: item.version });
        else if (item.leadId) await changeActivity(item.leadId, 'reminders', item, 'dismiss');
      } else {
        if (item.independent) await standaloneActions.cancelReminder.mutateAsync({ id: item.id, version: item.version });
        else if (item.leadId) await changeActivity(item.leadId, 'reminders', item, 'cancel');
      }
      await qc.invalidateQueries({ queryKey: ['dashboard-lead-activities'] });
    } catch {
      // silent or handled
    }
  };

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topbar}>
        <Text style={styles.pageTitle}>Reminders</Text>

        <View style={styles.headerActions}>
          {/* Search Toggle Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search reminders"
            style={[styles.iconBtnWhite, searchToggle && styles.btnActiveWhite]}
            onPress={() => setSearchToggle((prev) => !prev)}
          >
            <Ionicons name="search-outline" size={18} color="#372A8B" />
          </Pressable>

          {/* + Add Reminder Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add Reminder"
            style={styles.addReminderBtn}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={17} color={colors.white} />
            <Text style={styles.addReminderText}>Add Reminder</Text>
          </Pressable>

          {/* Analytics / Stats Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View statistics"
            style={styles.actionSquareNavy}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <Ionicons name="trending-up" size={18} color={colors.white} />
          </Pressable>

          {/* Delete Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete selected"
            style={[styles.actionSquareRed, selectedIds.length === 0 && styles.btnDisabled]}
            disabled={selectedIds.length === 0}
            onPress={() => setDeleteConfirm({ open: true, type: 'bulk' })}
          >
            <Ionicons name="trash-outline" size={18} color={colors.white} />
          </Pressable>

          {/* Filter Dropdown Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter reminders"
            style={[styles.filterBtn, showFilterMenu && styles.btnActiveWhite]}
            onPress={() => setShowFilterMenu((prev) => !prev)}
          >
            <Ionicons name="options-outline" size={16} color="#372A8B" />
            <Text style={styles.filterBtnText}>
              {statusFilter === 'ALL' ? 'Filter' : statusFilter}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#372A8B" />
          </Pressable>
        </View>
      </View>

      {/* Expandable Search Input */}
      {searchToggle && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by reminder title, message, or customer name..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={(txt) => {
              setSearchText(txt);
              setPage(1);
            }}
            autoFocus
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Expandable Filter Menu */}
      {showFilterMenu && (
        <View style={styles.filterMenuContainer}>
          <Text style={styles.filterMenuLabel}>Status:</Text>
          {(['ALL', 'PENDING', 'TRIGGERED', 'DISMISSED', 'CANCELLED'] as const).map((st) => (
            <Pressable
              key={st}
              style={[
                styles.filterChip,
                statusFilter === st && styles.filterChipActive,
              ]}
              onPress={() => {
                setStatusFilter(st);
                setPage(1);
                setShowFilterMenu(false);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === st && styles.filterChipTextActive,
                ]}
              >
                {st === 'ALL' ? 'All' : st}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Table Section */}
      <View style={styles.tableWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.tableContent}>
            {/* Dark Navy Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colCheck}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: allCurrentSelected }}
                  onPress={toggleSelectAll}
                  style={[styles.checkbox, allCurrentSelected && styles.checkboxChecked]}
                >
                  {allCurrentSelected && <Ionicons name="checkmark" size={13} color={colors.white} />}
                </Pressable>
              </View>

              <View style={styles.colExpand} />

              <View style={styles.colNo}>
                <Text style={styles.headerText}>No.</Text>
              </View>

              <View style={styles.colActions}>
                <Text style={styles.headerText}>Actions</Text>
              </View>

              <View style={styles.colCustomer}>
                <Text style={styles.headerText}>Customer Name</Text>
              </View>

              <View style={styles.colMessage}>
                <Text style={styles.headerText}>Message</Text>
              </View>

              <View style={styles.colDate}>
                <Text style={styles.headerText}>Date</Text>
              </View>

              <View style={styles.colTime}>
                <Text style={styles.headerText}>Time</Text>
              </View>

              <View style={styles.colType}>
                <Text style={styles.headerText}>Type</Text>
              </View>

              <View style={styles.colCreatedAt}>
                <Text style={styles.headerText}>Created At</Text>
              </View>

              <View style={styles.colCreatedBy}>
                <Text style={styles.headerText}>Created By</Text>
              </View>

              <View style={styles.colAssignTo}>
                <Text style={styles.headerText}>Assign To</Text>
              </View>

              <View style={styles.colAutomation}>
                <Text style={styles.headerText}>Automation</Text>
              </View>
            </View>

            {/* Table Body */}
            {activitiesQuery.isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#372A8B" />
                <Text style={styles.loadingText}>Loading reminders...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>No reminders found</Text>
                <Button title="+ Add Reminder" variant="outline" onPress={openAddModal} />
              </View>
            ) : (
              items.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                const isExpanded = expandedRowIds.includes(item.id);
                const lead = (leadsQuery.data ?? []).find((l) => l.id === item.leadId);
                const leadName = item.independent ? 'Standalone' : item.lead?.name || lead?.name || 'Customer';
                const messageText = item.message || item.title || '—';
                const dateStr = parseDateOnly(item.remindAt);
                const timeStr = parseTimeOnly(item.remindAt);
                const createdAtStr = formatDateTime(item.createdAt);
                const createdByStr = item.createdByName || userName || 'Shivang Meena';
                const assignToStr = item.assignedTo || item.createdByName || userName || 'Shivang Meena';

                return (
                  <React.Fragment key={item.id}>
                    <View
                      style={[styles.tableRow, isSelected && styles.tableRowSelected]}
                    >
                      {/* Checkbox */}
                      <View style={styles.colCheck}>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                          onPress={() => toggleSelectRow(item.id)}
                          style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                        >
                          {isSelected && <Ionicons name="checkmark" size={13} color={colors.white} />}
                        </Pressable>
                      </View>

                      {/* Expand Chevron: toggles inline details like screenshot */}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Toggle details"
                        onPress={() => toggleExpandRow(item.id)}
                        style={styles.colExpand}
                      >
                        <Ionicons
                          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                          size={15}
                          color={isExpanded ? '#372A8B' : '#64748B'}
                        />
                      </Pressable>

                      {/* Sequential Number */}
                      <View style={styles.colNo}>
                        <Text style={styles.cellTextDark}>{(page - 1) * pageSize + index + 1}</Text>
                      </View>

                      {/* Actions: Edit, Delete, Bookmark */}
                      <View style={styles.colActions}>
                        <View style={styles.actionIconGroup}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Edit reminder"
                            onPress={() => openEditModal(item)}
                            style={styles.rowActionBtn}
                          >
                            <Ionicons name="create-outline" size={16} color="#3B82F6" />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Delete reminder"
                            onPress={() => setDeleteConfirm({ open: true, type: 'single', item })}
                            style={styles.rowActionBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Bookmark reminder"
                            onPress={() => handleToggleBookmark(item)}
                            style={styles.rowActionBtn}
                          >
                            <Ionicons
                              name={item.status === 'DISMISSED' ? 'bookmark' : 'bookmark-outline'}
                              size={16}
                              color={item.status === 'DISMISSED' ? '#372A8B' : '#94A3B8'}
                            />
                          </Pressable>
                        </View>
                      </View>

                      {/* Customer Name: opens Dimmed Details Modal */}
                      <View style={styles.colCustomer}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setDetailModalItem(item)}
                        >
                          <Text style={styles.cellLinkCustomer} numberOfLines={1}>
                            {leadName.toUpperCase()}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Message: opens Dimmed Details Modal */}
                      <View style={styles.colMessage}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setDetailModalItem(item)}
                        >
                          <Text style={styles.cellMessage} numberOfLines={2}>
                            {messageText}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Date */}
                      <View style={styles.colDate}>
                        <Text style={styles.cellTextDark}>{dateStr}</Text>
                      </View>

                      {/* Time */}
                      <View style={styles.colTime}>
                        <Text style={styles.cellTextDark}>{timeStr}</Text>
                      </View>

                      {/* Type */}
                      <View style={styles.colType}>
                        <Text style={styles.cellTextDark}>Once</Text>
                      </View>

                      {/* Created At */}
                      <View style={styles.colCreatedAt}>
                        <Text style={styles.cellTextDark}>{createdAtStr}</Text>
                      </View>

                      {/* Created By */}
                      <View style={styles.colCreatedBy}>
                        <Text style={styles.cellTextDark} numberOfLines={1}>{createdByStr}</Text>
                      </View>

                      {/* Assign To */}
                      <View style={styles.colAssignTo}>
                        <Text style={styles.cellTextDark} numberOfLines={1}>{assignToStr}</Text>
                      </View>

                      {/* Automation: 🚫 icon */}
                      <View style={styles.colAutomation}>
                        <Ionicons name="remove-circle-outline" size={19} color="#EF4444" />
                      </View>
                    </View>

                    {/* Inline Expanded Row Matching Screenshot */}
                    {isExpanded && (
                      <View style={styles.inlineDetailsBox}>
                        <ReminderDetailsView
                          item={item}
                          lead={lead}
                          userName={userName}
                        />
                      </View>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Purple Divider Line */}
        <View style={styles.purpleDivider} />

        {/* Pagination Footer */}
        <View style={styles.paginationFooter}>
          {/* Left: Rows per page and range counter */}
          <View style={styles.paginationLeft}>
            <Text style={styles.paginationMutedText}>Rows per page:</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select rows per page"
              style={styles.pageSizeDropdown}
              onPress={() => setShowPageSizePicker((prev) => !prev)}
            >
              <Text style={styles.pageSizeText}>{pageSize}</Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </Pressable>

            <Text style={styles.paginationRangeText}>
              {total === 0 ? '0 - 0 of 0' : `${startIndex} - ${endIndex} of ${total}`}
            </Text>
          </View>

          {/* Right: Page Navigation Controls */}
          <View style={styles.paginationRight}>
            {/* First Page |< */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="First page"
              disabled={page <= 1}
              style={[styles.pageNavBtn, page <= 1 && styles.pageNavBtnDisabled]}
              onPress={() => setPage(1)}
            >
              <Ionicons name="play-skip-back-outline" size={15} color={page <= 1 ? '#CBD5E1' : '#64748B'} />
            </Pressable>

            {/* Prev Page < */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              disabled={page <= 1}
              style={[styles.pageNavBtn, page <= 1 && styles.pageNavBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Ionicons name="chevron-back" size={17} color={page <= 1 ? '#CBD5E1' : '#64748B'} />
            </Pressable>

            {/* Page Box: [ 1 ] of 1 */}
            <View style={styles.pageNumberBox}>
              <Text style={styles.pageNumberText}>{page}</Text>
            </View>
            <Text style={styles.pageTotalText}>of {totalPages}</Text>

            {/* Next Page > */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next page"
              disabled={page >= totalPages}
              style={[styles.pageNavBtn, page >= totalPages && styles.pageNavBtnDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <Ionicons name="chevron-forward" size={17} color={page >= totalPages ? '#CBD5E1' : '#64748B'} />
            </Pressable>

            {/* Last Page >| */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Last page"
              disabled={page >= totalPages}
              style={[styles.pageNavBtn, page >= totalPages && styles.pageNavBtnDisabled]}
              onPress={() => setPage(totalPages)}
            >
              <Ionicons name="play-skip-forward-outline" size={15} color={page >= totalPages ? '#CBD5E1' : '#64748B'} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Reminder Details Modal with Dimmed Background */}
      {detailModalItem && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModalItem(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxWidth: 760 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reminder Details</Text>
                <Pressable onPress={() => setDetailModalItem(null)}>
                  <Ionicons name="close" size={20} color={colors.white} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 10 }}>
                <ReminderDetailsView
                  item={detailModalItem}
                  lead={(leadsQuery.data ?? []).find((l) => l.id === detailModalItem.leadId)}
                  userName={userName}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Edit"
                  variant="outline"
                  onPress={() => {
                    const item = detailModalItem;
                    setDetailModalItem(null);
                    openEditModal(item);
                  }}
                />
                <Button title="Close" onPress={() => setDetailModalItem(null)} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Page Size Picker Dropdown Modal */}
      {showPageSizePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowPageSizePicker(false)}>
          <Pressable style={styles.pickerOverlay} onPress={() => setShowPageSizePicker(false)}>
            <View style={styles.pageSizeMenu}>
              <Text style={styles.pageSizeMenuTitle}>Rows per page</Text>
              {[5, 10, 20, 50].map((sz) => (
                <Pressable
                  key={sz}
                  style={[styles.pageSizeOption, pageSize === sz && styles.pageSizeOptionActive]}
                  onPress={() => {
                    setPageSize(sz);
                    setPage(1);
                    setShowPageSizePicker(false);
                  }}
                >
                  <Text style={[styles.pageSizeOptionText, pageSize === sz && styles.pageSizeOptionTextActive]}>
                    {sz} rows
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Add / Edit Reminder Modal */}
      {isAddOpen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => !isSaving && setIsAddOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Reminder' : 'Add Reminder'}
                </Text>
                <Pressable onPress={() => !isSaving && setIsAddOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.white} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Select Customer / Lead */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Customer / Lead *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.leadChipRow}>
                      {(leadsQuery.data ?? []).map((lead) => (
                        <Pressable
                          key={lead.id}
                          style={[
                            styles.leadChip,
                            selectedLeadId === lead.id && styles.leadChipActive,
                          ]}
                          onPress={() => setSelectedLeadId(lead.id)}
                        >
                          <Text
                            style={[
                              styles.leadChipText,
                              selectedLeadId === lead.id && styles.leadChipTextActive,
                            ]}
                          >
                            {lead.name} {lead.company ? `(${lead.company})` : ''}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Reminder Title */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Subject / Title</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Follow up on proposal"
                    placeholderTextColor={colors.muted}
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />
                </View>

                {/* Reminder Message */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Message *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMulti]}
                    placeholder="Enter reminder details or note..."
                    placeholderTextColor={colors.muted}
                    value={formMessage}
                    onChangeText={setFormMessage}
                    multiline
                  />
                </View>

                {/* Date & Time Picker Trigger */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date & Time (IST) *</Text>
                  <Pressable
                    style={styles.datePickerTrigger}
                    onPress={() => setIsPickerOpen(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#372A8B" />
                    <Text style={styles.datePickerText}>
                      {formDateTime || 'Choose date & time'}
                    </Text>
                  </Pressable>
                </View>

                {/* Assigned To */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Assign To</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Assignee name"
                    placeholderTextColor={colors.muted}
                    value={formAssignTo}
                    onChangeText={setFormAssignTo}
                  />
                </View>

                {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancel"
                  variant="outline"
                  disabled={isSaving}
                  onPress={() => setIsAddOpen(false)}
                />
                <Button
                  title={editingItem ? 'Save Changes' : 'Save Reminder'}
                  loading={isSaving}
                  onPress={handleSaveReminder}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <StandaloneReminderFormModal
        visible={!!standaloneEditItem}
        record={standaloneEditItem}
        onClose={() => setStandaloneEditItem(null)}
        onSave={async (data) => {
          if (!standaloneEditItem) return;
          await standaloneActions.updateReminder.mutateAsync({ id: standaloneEditItem.id, data: { ...data, version: standaloneEditItem.version } });
        }}
      />

      {/* Date & Time Picker Modal */}
      <DateTimePickerModal
        visible={isPickerOpen}
        value={formDateTime}
        title="Set Reminder Date & Time"
        onSelect={(val) => {
          setFormDateTime(val);
          setIsPickerOpen(false);
        }}
        onClose={() => setIsPickerOpen(false)}
      />

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowAnalyticsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxWidth: 440 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reminders Summary</Text>
                <Pressable onPress={() => setShowAnalyticsModal(false)}>
                  <Ionicons name="close" size={20} color={colors.white} />
                </Pressable>
              </View>
              <View style={styles.analyticsBody}>
                <View style={styles.analyticsStatRow}>
                  <Text style={styles.analyticsStatLabel}>Total Reminders:</Text>
                  <Text style={styles.analyticsStatValue}>{total}</Text>
                </View>
                <View style={styles.analyticsStatRow}>
                  <Text style={styles.analyticsStatLabel}>Pending:</Text>
                  <Text style={[styles.analyticsStatValue, { color: '#2563EB' }]}>
                    {items.filter((i) => i.status === 'PENDING').length}
                  </Text>
                </View>
                <View style={styles.analyticsStatRow}>
                  <Text style={styles.analyticsStatLabel}>Dismissed:</Text>
                  <Text style={[styles.analyticsStatValue, { color: '#059669' }]}>
                    {items.filter((i) => i.status === 'DISMISSED').length}
                  </Text>
                </View>
              </View>
              <View style={styles.modalFooter}>
                <Button title="Close" onPress={() => setShowAnalyticsModal(false)} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteConfirm.open}
        title="Delete Reminder"
        message={
          deleteConfirm.type === 'bulk'
            ? `Are you sure you want to delete ${selectedIds.length} selected reminder(s)?`
            : 'Are you sure you want to delete this reminder?'
        }
        confirmText="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, type: 'single' })}
      />
    </View>
  );
}

const detailStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    gap: 40,
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: 1,
    minWidth: 320,
    gap: 10,
  },
  rightCol: {
    flex: 1,
    minWidth: 260,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 165,
  },
  value: {
    fontSize: 13,
    color: '#334155',
    flexShrink: 1,
  },
  typeBadge: {
    backgroundColor: '#281E5D',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: colors.white,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#281E5D',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtnWhite: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActiveWhite: {
    backgroundColor: '#EEF2FF',
    borderColor: '#372A8B',
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#281E5D',
  },
  addReminderText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionSquareNavy: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#281E5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSquareRed: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    backgroundColor: colors.white,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#372A8B',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  filterMenuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterMenuLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: '#372A8B',
    borderColor: '#372A8B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  tableWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  tableContent: {
    minWidth: 1140,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#281E5D',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: colors.white,
  },
  tableRowSelected: {
    backgroundColor: '#F5F3FF',
  },
  inlineDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colCheck: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colExpand: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colNo: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colActions: {
    width: 90,
    justifyContent: 'center',
  },
  colCustomer: {
    width: 160,
    paddingRight: 10,
    justifyContent: 'center',
  },
  colMessage: {
    width: 170,
    paddingRight: 10,
    justifyContent: 'center',
  },
  colDate: {
    width: 100,
    justifyContent: 'center',
  },
  colTime: {
    width: 70,
    justifyContent: 'center',
  },
  colType: {
    width: 65,
    justifyContent: 'center',
  },
  colCreatedAt: {
    width: 140,
    justifyContent: 'center',
  },
  colCreatedBy: {
    width: 125,
    paddingRight: 8,
    justifyContent: 'center',
  },
  colAssignTo: {
    width: 125,
    paddingRight: 8,
    justifyContent: 'center',
  },
  colAutomation: {
    width: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#372A8B',
    borderColor: '#372A8B',
  },
  cellTextDark: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '500',
  },
  cellLinkCustomer: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cellMessage: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '500',
  },
  actionIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowActionBtn: {
    padding: 3,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  purpleDivider: {
    height: 3,
    backgroundColor: '#372A8B',
    width: '100%',
  },
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationMutedText: {
    fontSize: 13,
    color: '#64748B',
  },
  pageSizeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
  },
  pageSizeText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  paginationRangeText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 16,
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNavBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNumberBox: {
    minWidth: 32,
    height: 28,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.white,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  pageTotalText: {
    fontSize: 13,
    color: '#64748B',
    marginHorizontal: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageSizeMenu: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  pageSizeMenuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#281E5D',
    marginBottom: 4,
  },
  pageSizeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pageSizeOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  pageSizeOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  pageSizeOptionTextActive: {
    color: '#372A8B',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#281E5D',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  modalBody: {
    padding: 18,
    gap: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.white,
  },
  formInputMulti: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  datePickerText: {
    fontSize: 13,
    color: colors.text,
  },
  leadChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  leadChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
  },
  leadChipActive: {
    borderColor: '#372A8B',
    backgroundColor: '#EEF2FF',
  },
  leadChipText: {
    fontSize: 12,
    color: colors.text,
  },
  leadChipTextActive: {
    color: '#372A8B',
    fontWeight: '700',
  },
  formErrorText: {
    color: colors.danger,
    fontSize: 12.5,
  },
  analyticsBody: {
    padding: 20,
    gap: 12,
  },
  analyticsStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  analyticsStatLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  analyticsStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
});
