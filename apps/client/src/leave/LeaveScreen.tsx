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
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplyLeave, useCancelLeave, useLeaveList, useReviewLeave, useUpdateLeave } from '@/hooks/useLeave';
import { LeaveFormModal, LeaveFormValues } from '@/leave/LeaveFormModal';
import { colors } from '@/theme/colors';
import { LeaveFilterStatus, LeaveRequest, LeaveStatus, LeaveType } from '@/types/leave';
import { formatDateTime as formatCrmDateTime, parseDateTimeInput } from '@/utils/format';

const PAGE_SIZES = [10, 25, 50];

function formatDateTime(iso: string | null | undefined): string {
  return formatCrmDateTime(iso) || '—';
}

function toLeaveFormDateTime(iso: string): string {
  return formatCrmDateTime(iso).replace(/^(\d{2})-(\d{2})-(\d{4})(.*)$/, '$3-$2-$1$4');
}

function parseLeaveFormDateTime(value: string) {
  return parseDateTimeInput(value.trim().replace(/^(\d{4})-(\d{2})-(\d{2})(.*)$/, '$3-$2-$1$4'));
}

function getDefaultStartEndDates() {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: toLeaveFormDateTime(start.toISOString()), end: toLeaveFormDateTime(end.toISOString()) };
}

const blankForm = (): LeaveFormValues => {
  const { start, end } = getDefaultStartEndDates();
  return {
    type: 'CASUAL',
    startDate: start,
    endDate: end,
    reason: 'Personal',
    leaveDetail: '',
  };
};

function TableCell({ width, children, style }: { width: number; children: React.ReactNode; style?: any }) {
  return <View style={[styles.cell, { width }, style]}>{children}</View>;
}

export function LeaveScreen() {
  const { userName, role } = useAuth();
  const { isAdmin, canAccess } = usePermissions();
  const canApply = isAdmin || (role === 'staff' && canAccess('leave'));
  const { width: windowWidth } = useWindowDimensions();
  const desktop = windowWidth >= 960;

  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeaveFilterStatus>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);

  // Form modal
  const [formMode, setFormMode] = useState<'closed' | 'apply' | 'edit'>('closed');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [formValues, setFormValues] = useState<LeaveFormValues>(blankForm);
  const [formError, setFormError] = useState<string | null>(null);

  // Review modal (admin approve/reject)
  const [reviewTarget, setReviewTarget] = useState<{ leave: LeaveRequest; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // Cancel modal (owner)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);

  // Feedback message
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const filters = useMemo(() => ({
    search: search || undefined,
    status: filter === 'ALL' ? undefined : filter,
    page,
    pageSize,
  }), [search, filter, page, pageSize]);

  const leaveQuery = useLeaveList(filters);
  const applyMutation = useApplyLeave();
  const updateMutation = useUpdateLeave();
  const reviewMutation = useReviewLeave();
  const cancelMutation = useCancelLeave();

  const data = leaveQuery.data;
  const leaves = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const summary = data?.summary ?? { totalCount: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, cancelledCount: 0 };
  const pending = applyMutation.isPending || updateMutation.isPending || reviewMutation.isPending || cancelMutation.isPending;

  function openApply() {
    if (!canApply) return;
    setSelectedLeave(null);
    setFormValues(blankForm());
    setFormError(null);
    setFeedback(null);
    setFormMode('apply');
  }

  function openEdit(item: LeaveRequest) {
    setSelectedLeave(item);
    setFormValues({
      type: item.type,
      startDate: toLeaveFormDateTime(item.startDate),
      endDate: toLeaveFormDateTime(item.endDate),
      reason: item.reason,
      leaveDetail: item.leaveDetail ?? '',
    });
    setFormError(null);
    setFeedback(null);
    setFormMode('edit');
  }

  function closeForm() {
    if (pending) return;
    setFormMode('closed');
    setSelectedLeave(null);
    setFormError(null);
  }

  function changeFormField<K extends keyof LeaveFormValues>(key: K, value: LeaveFormValues[K]) {
    setFormValues(prev => ({ ...prev, [key]: value }));
    if (formError) setFormError(null);
  }

  function submitSearch() {
    setSearch(draftSearch.trim());
    setPage(1);
    setExpandedId(null);
  }

  function validateForm(): string | null {
    if (!formValues.startDate.trim()) return 'Start Date is required.';
    if (!formValues.endDate.trim()) return 'End Date is required.';
    if (!formValues.reason.trim()) return 'Reason is required.';
    const s = parseLeaveFormDateTime(formValues.startDate);
    const e = parseLeaveFormDateTime(formValues.endDate);
    if (!s.ok || !s.value) return 'Start date format is invalid. Use YYYY-MM-DD HH:mm.';
    if (!e.ok || !e.value) return 'End date format is invalid. Use YYYY-MM-DD HH:mm.';
    if (s.value >= e.value) return 'Start date must be earlier than End date.';
    return null;
  }

  async function submitForm() {
    if (pending) return;
    if (formMode === 'apply' && !canApply) return;
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }
    const start = parseLeaveFormDateTime(formValues.startDate);
    const end = parseLeaveFormDateTime(formValues.endDate);
    if (!start.value || !end.value) return;
    const payload = {
      type: formValues.type,
      startDate: start.value,
      endDate: end.value,
      reason: formValues.reason.trim(),
      leaveDetail: formValues.leaveDetail.trim() || undefined,
    };
    try {
      if (formMode === 'apply') {
        await applyMutation.mutateAsync(payload);
        setFeedback({ kind: 'success', message: 'Leave application submitted successfully.' });
      } else if (formMode === 'edit' && selectedLeave) {
        await updateMutation.mutateAsync({
          id: selectedLeave.id,
          payload: { ...payload, version: selectedLeave.version },
        });
        setFeedback({ kind: 'success', message: 'Leave application updated successfully.' });
      }
      setFormMode('closed');
      setSelectedLeave(null);
      setFormError(null);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  async function confirmReview() {
    if (!reviewTarget || reviewMutation.isPending) return;
    try {
      await reviewMutation.mutateAsync({
        id: reviewTarget.leave.id,
        payload: {
          status: reviewTarget.action,
          rejectionNote: reviewTarget.action === 'REJECTED' ? rejectionNote.trim() : undefined,
          version: reviewTarget.leave.version,
        },
      });
      setFeedback({
        kind: 'success',
        message: `Leave request for ${reviewTarget.leave.staffName} has been ${reviewTarget.action.toLowerCase()}.`,
      });
      setReviewTarget(null);
      setRejectionNote('');
    } catch (err) {
      setFeedback({ kind: 'error', message: errorMessage(err) });
      setReviewTarget(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || cancelMutation.isPending) return;
    try {
      await cancelMutation.mutateAsync({ id: cancelTarget.id, version: cancelTarget.version });
      setFeedback({ kind: 'success', message: 'Leave request has been cancelled.' });
      setCancelTarget(null);
    } catch (err) {
      setFeedback({ kind: 'error', message: errorMessage(err) });
      setCancelTarget(null);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedId(curr => (curr === id ? null : id));
  }

  function renderStatusBadge(status: LeaveStatus) {
    let badgeStyle = styles.statusPending;
    let textStyle = styles.statusTextPending;
    let label = 'Pending';

    if (status === 'APPROVED') {
      badgeStyle = styles.statusApproved;
      textStyle = styles.statusTextApproved;
      label = 'Approved';
    } else if (status === 'REJECTED') {
      badgeStyle = styles.statusRejected;
      textStyle = styles.statusTextRejected;
      label = 'Rejected';
    } else if (status === 'CANCELLED') {
      badgeStyle = styles.statusCancelled;
      textStyle = styles.statusTextCancelled;
      label = 'Cancelled';
    }

    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <Text style={[styles.statusText, textStyle]}>{label}</Text>
      </View>
    );
  }

  const statusFilters: LeaveFilterStatus[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

  const tableColumns = [
    { label: '', width: 44 },
    { label: 'No.', width: 60 },
    { label: 'Actions', width: 130 },
    { label: 'Type', width: 110 },
    { label: 'Status', width: 110 },
    { label: 'Name', width: 160 },
    { label: 'Start Date', width: 155 },
    { label: 'End Date', width: 155 },
    { label: 'Applied Date', width: 155 },
    { label: 'Reason', width: 140 },
    { label: 'Leave Detail', width: 200 },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headingBlock}>
            <Text style={styles.title}>Leave</Text>
            <Text style={styles.caption}>
              {summary.totalCount} total · {summary.pendingCount} pending · {summary.approvedCount} approved
            </Text>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchGroup}>
              <TextInput
                accessibilityLabel="Search leaves by name or reason"
                value={draftSearch}
                onChangeText={setDraftSearch}
                onSubmitEditing={submitSearch}
                placeholder="Search leaves…"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={submitSearch} style={styles.searchButton}>
                <Ionicons name="search" size={17} color={colors.primaryText} />
              </Pressable>
            </View>

            {(draftSearch || search) ? (
              <Pressable accessibilityRole="button" onPress={() => { setDraftSearch(''); setSearch(''); setPage(1); }} style={styles.outlineButton}>
                <Text style={styles.outlineButtonText}>Clear</Text>
              </Pressable>
            ) : null}

            <Pressable accessibilityRole="button" onPress={() => setReportsOpen(o => !o)} style={styles.outlineButton}>
              <Ionicons name="options-outline" size={15} color="#432D40" style={{ marginRight: 4 }} />
              <Text style={styles.outlineButtonText}>Filter {reportsOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {canApply ? <Pressable accessibilityRole="button" accessibilityLabel="Apply Leave" onPress={openApply} style={styles.primaryButtonGradient}>
              <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 2 }} />
              <Text style={styles.primaryButtonText}>Apply Leave</Text>
            </Pressable> : null}
          </View>
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          {statusFilters.map(opt => {
            const active = filter === opt;
            const count = opt === 'ALL' ? summary.totalCount
              : opt === 'PENDING' ? summary.pendingCount
              : opt === 'APPROVED' ? summary.approvedCount
              : opt === 'REJECTED' ? summary.rejectedCount
              : opt === 'CANCELLED' ? summary.cancelledCount
              : undefined;
            return (
              <Pressable
                key={opt}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => { setFilter(opt); setPage(1); setExpandedId(null); }}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  {count !== undefined ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {reportsOpen ? (
          <View style={styles.reportPanel}>
            <View style={styles.reportCell}><Text style={styles.reportLabel}>Total Applications</Text><Text style={styles.reportValue}>{summary.totalCount}</Text></View>
            <View style={styles.reportCell}><Text style={styles.reportLabel}>Pending</Text><Text style={[styles.reportValue, { color: '#FD7E14' }]}>{summary.pendingCount}</Text></View>
            <View style={styles.reportCell}><Text style={styles.reportLabel}>Approved</Text><Text style={[styles.reportValue, { color: colors.success }]}>{summary.approvedCount}</Text></View>
            <View style={styles.reportCell}><Text style={styles.reportLabel}>Rejected</Text><Text style={[styles.reportValue, { color: colors.danger }]}>{summary.rejectedCount}</Text></View>
            <View style={styles.reportCell}><Text style={styles.reportLabel}>Cancelled</Text><Text style={styles.reportValue}>{summary.cancelledCount}</Text></View>
          </View>
        ) : null}
      </View>

      {/* Feedback Toast */}
      {feedback ? (
        <View accessibilityRole="alert" style={[styles.feedback, feedback.kind === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
          <Text style={[styles.feedbackText, feedback.kind === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText]}>{feedback.message}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => setFeedback(null)}>
            <Text style={styles.dismiss}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Main Table Card */}
      <View style={styles.tableCard}>
        {leaveQuery.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primaryText} />
            <Text style={styles.muted}>Loading leaves…</Text>
          </View>
        ) : leaveQuery.isError ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Could not load leaves</Text>
            <Text style={styles.muted}>{errorMessage(leaveQuery.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void leaveQuery.refetch(); }} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : leaves.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>
              {search || filter !== 'ALL' ? 'No leaves match the filter' : 'No leave records found'}
            </Text>
            <Text style={styles.muted}>
              {search || filter !== 'ALL' ? 'Try changing your search or filter options.' : isAdmin ? 'Staff leave applications will appear here.' : 'Click "Apply Leave" to submit your first leave application.'}
            </Text>
            {canApply ? <Pressable accessibilityRole="button" onPress={openApply} style={styles.primaryButtonGradient}>
              <Ionicons name="add" size={17} color={colors.white} />
              <Text style={styles.primaryButtonText}>Apply Leave</Text>
            </Pressable> : null}
          </View>
        ) : desktop ? (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Header */}
              <View style={styles.tableHeader}>
                {tableColumns.map(col => (
                  <TableCell key={col.label} width={col.width}>
                    <Text style={styles.columnHeading}>{col.label}</Text>
                  </TableCell>
                ))}
              </View>

              {/* Rows */}
              {leaves.map((item, index) => {
                const expanded = expandedId === item.id;
                const number = (page - 1) * pageSize + index + 1;
                const isPending = item.status === 'PENDING';

                return (
                  <View key={item.id} style={styles.rowGroup}>
                    <View style={[styles.tableRow, index % 2 === 1 && styles.alternateRow]}>
                      {/* Caret expand */}
                      <TableCell width={44}>
                        <Pressable accessibilityRole="button" onPress={() => toggleExpanded(item.id)} style={styles.caretBtn}>
                          <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={15} color={colors.muted} />
                        </Pressable>
                      </TableCell>

                      {/* No. */}
                      <TableCell width={60}>
                        <Text style={styles.value}>{number}</Text>
                      </TableCell>

                      {/* Actions */}
                      <TableCell width={130}>
                        <View style={styles.actionsRow}>
                          {isPending && (
                            <Pressable accessibilityRole="button" accessibilityLabel="Edit" onPress={() => openEdit(item)} style={styles.actionIconBtn}>
                              <Ionicons name="pencil-outline" size={16} color="#FD7E14" />
                            </Pressable>
                          )}

                          {isPending && (
                            <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={() => setCancelTarget(item)} style={styles.actionIconBtn}>
                              <Ionicons name="trash-outline" size={16} color={colors.danger} />
                            </Pressable>
                          )}

                          {isAdmin && isPending && (
                            <>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Approve"
                                onPress={() => setReviewTarget({ leave: item, action: 'APPROVED' })}
                                style={[styles.actionBtnTiny, styles.approveBtn]}
                              >
                                <Ionicons name="checkmark" size={13} color={colors.white} />
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Reject"
                                onPress={() => { setReviewTarget({ leave: item, action: 'REJECTED' }); setRejectionNote(''); }}
                                style={[styles.actionBtnTiny, styles.rejectBtn]}
                              >
                                <Ionicons name="close" size={13} color={colors.white} />
                              </Pressable>
                            </>
                          )}

                          {!isPending && !isAdmin && (
                            <Text style={styles.mutedText}>—</Text>
                          )}
                        </View>
                      </TableCell>

                      {/* Type */}
                      <TableCell width={110}>
                        <Text style={[styles.value, styles.capitalize]}>{item.type.toLowerCase()}</Text>
                      </TableCell>

                      {/* Status */}
                      <TableCell width={110}>
                        {renderStatusBadge(item.status)}
                      </TableCell>

                      {/* Name */}
                      <TableCell width={160}>
                        <Text numberOfLines={1} style={[styles.value, styles.bold]}>{item.staffName}</Text>
                      </TableCell>

                      {/* Start Date */}
                      <TableCell width={155}>
                        <Text style={styles.value}>{formatDateTime(item.startDate)}</Text>
                      </TableCell>

                      {/* End Date */}
                      <TableCell width={155}>
                        <Text style={styles.value}>{formatDateTime(item.endDate)}</Text>
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell width={155}>
                        <Text style={styles.value}>{formatDateTime(item.appliedAt)}</Text>
                      </TableCell>

                      {/* Reason */}
                      <TableCell width={140}>
                        <Text numberOfLines={1} style={styles.value}>{item.reason}</Text>
                      </TableCell>

                      {/* Leave Detail */}
                      <TableCell width={200}>
                        <Text numberOfLines={1} style={styles.value}>{item.leaveDetail || '—'}</Text>
                      </TableCell>
                    </View>

                    {/* Expandable details panel */}
                    {expanded ? (
                      <View style={styles.expandedPanel}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Full Leave Detail</Text>
                          <Text style={styles.detailValue}>{item.leaveDetail || 'None provided.'}</Text>
                        </View>
                        {item.reviewedAt ? (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Reviewed By</Text>
                            <Text style={styles.detailValue}>{item.reviewedByName || 'Admin'} at {formatDateTime(item.reviewedAt)}</Text>
                          </View>
                        ) : null}
                        {item.rejectionNote ? (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Rejection Reason</Text>
                            <Text style={[styles.detailValue, { color: colors.danger }]}>{item.rejectionNote}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* Mobile Card View */
          <View style={styles.cardsContainer}>
            {leaves.map((item, index) => {
              const expanded = expandedId === item.id;
              const isPending = item.status === 'PENDING';
              return (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardStaffName}>#{(page - 1) * pageSize + index + 1} · {item.staffName}</Text>
                      <Text style={styles.cardType}>{item.type} · {item.reason}</Text>
                    </View>
                    {renderStatusBadge(item.status)}
                  </View>

                  <View style={styles.cardDates}>
                    <Text style={styles.cardDateText}>From: {formatDateTime(item.startDate)}</Text>
                    <Text style={styles.cardDateText}>To: {formatDateTime(item.endDate)}</Text>
                  </View>

                  {item.leaveDetail ? (
                    <Text numberOfLines={2} style={styles.cardDetailText}>{item.leaveDetail}</Text>
                  ) : null}

                  <View style={styles.cardActionsRow}>
                    <Pressable accessibilityRole="button" onPress={() => toggleExpanded(item.id)} style={styles.outlineButton}>
                      <Text style={styles.outlineButtonText}>{expanded ? 'Less' : 'More details'}</Text>
                    </Pressable>

                    {isPending && (
                      <Pressable accessibilityRole="button" onPress={() => openEdit(item)} style={styles.outlineButton}>
                        <Ionicons name="pencil-outline" size={14} color="#FD7E14" />
                        <Text style={[styles.outlineButtonText, { color: '#FD7E14' }]}>Edit</Text>
                      </Pressable>
                    )}

                    {isPending && (
                      <Pressable accessibilityRole="button" onPress={() => setCancelTarget(item)} style={styles.outlineButton}>
                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                        <Text style={[styles.outlineButtonText, { color: colors.danger }]}>Cancel</Text>
                      </Pressable>
                    )}

                    {isAdmin && isPending && (
                      <>
                        <Pressable accessibilityRole="button" onPress={() => setReviewTarget({ leave: item, action: 'APPROVED' })} style={[styles.primaryButton, { backgroundColor: colors.success }]}>
                          <Text style={styles.primaryButtonText}>Approve</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => { setReviewTarget({ leave: item, action: 'REJECTED' }); setRejectionNote(''); }} style={[styles.primaryButton, { backgroundColor: colors.danger }]}>
                          <Text style={styles.primaryButtonText}>Reject</Text>
                        </Pressable>
                      </>
                    )}
                  </View>

                  {expanded ? (
                    <View style={styles.expandedPanel}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Applied Date</Text>
                        <Text style={styles.detailValue}>{formatDateTime(item.appliedAt)}</Text>
                      </View>
                      {item.rejectionNote ? (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Rejection Reason</Text>
                          <Text style={[styles.detailValue, { color: colors.danger }]}>{item.rejectionNote}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Pagination */}
        {total > 0 ? (
          <View style={styles.pagination}>
            <View style={styles.paginationGroup}>
              <Text style={styles.muted}>Rows per page:</Text>
              {PAGE_SIZES.map(size => (
                <Pressable
                  key={size}
                  accessibilityRole="button"
                  accessibilityState={{ selected: pageSize === size }}
                  onPress={() => { setPageSize(size); setPage(1); }}
                  style={[styles.pageSize, pageSize === size && styles.pageSizeActive]}
                >
                  <Text style={[styles.pageSizeText, pageSize === size && styles.pageSizeTextActive]}>{size}</Text>
                </Pressable>
              ))}
              <Text style={styles.muted}>
                {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
              </Text>
            </View>

            <View style={styles.paginationGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="First page"
                disabled={page <= 1 || leaveQuery.isFetching}
                onPress={() => setPage(1)}
                style={[styles.pageButton, page <= 1 && styles.disabled]}
              >
                <Ionicons name="play-back-outline" size={13} color={page <= 1 ? colors.muted : colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous page"
                disabled={page <= 1 || leaveQuery.isFetching}
                onPress={() => setPage(c => Math.max(1, c - 1))}
                style={[styles.pageButton, page <= 1 && styles.disabled]}
              >
                <Ionicons name="chevron-back" size={14} color={page <= 1 ? colors.muted : colors.text} />
              </Pressable>
              <View style={styles.pageIndicator}>
                <Text style={styles.pageNumberText}>{page}</Text>
                <Text style={styles.muted}>of {pages}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next page"
                disabled={page >= pages || leaveQuery.isFetching}
                onPress={() => setPage(c => Math.min(pages, c + 1))}
                style={[styles.pageButton, page >= pages && styles.disabled]}
              >
                <Ionicons name="chevron-forward" size={14} color={page >= pages ? colors.muted : colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Last page"
                disabled={page >= pages || leaveQuery.isFetching}
                onPress={() => setPage(pages)}
                style={[styles.pageButton, page >= pages && styles.disabled]}
              >
                <Ionicons name="play-forward-outline" size={13} color={page >= pages ? colors.muted : colors.text} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Apply / Edit Modal */}
      <LeaveFormModal
        visible={formMode === 'edit' || (formMode === 'apply' && canApply)}
        mode={formMode === 'edit' ? 'edit' : 'apply'}
        values={formValues}
        error={formError}
        pending={pending}
        onChange={changeFormField}
        onClose={closeForm}
        onSubmit={() => { void submitForm(); }}
      />

      {/* Admin Review Modal (Approve / Reject) */}
      <Modal visible={Boolean(reviewTarget)} transparent animationType="fade" onRequestClose={() => { if (!pending) setReviewTarget(null); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {reviewTarget?.action === 'APPROVED' ? 'Approve Leave Request?' : 'Reject Leave Request?'}
            </Text>
            <Text style={styles.confirmBody}>
              {reviewTarget?.action === 'APPROVED'
                ? `Are you sure you want to approve ${reviewTarget?.leave.staffName}'s leave application?`
                : `Please provide a reason for rejecting ${reviewTarget?.leave.staffName}'s leave application.`}
            </Text>

            {reviewTarget?.action === 'REJECTED' && (
              <TextInput
                accessibilityLabel="Rejection Reason"
                value={rejectionNote}
                onChangeText={setRejectionNote}
                placeholder="Reason for rejection (optional)"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.multiline]}
              />
            )}

            <View style={styles.confirmActions}>
              <Pressable disabled={pending} accessibilityRole="button" onPress={() => setReviewTarget(null)} style={[styles.outlineButton, styles.confirmButton]}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                onPress={() => { void confirmReview(); }}
                style={[
                  styles.primaryButton,
                  styles.confirmButton,
                  reviewTarget?.action === 'APPROVED' ? { backgroundColor: colors.success } : { backgroundColor: colors.danger },
                  pending && styles.disabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {pending ? 'Processing…' : reviewTarget?.action === 'APPROVED' ? 'Approve' : 'Reject'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Owner Cancel Modal */}
      <Modal visible={Boolean(cancelTarget)} transparent animationType="fade" onRequestClose={() => { if (!pending) setCancelTarget(null); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Cancel Leave Request?</Text>
            <Text style={styles.confirmBody}>Are you sure you want to cancel this leave application?</Text>
            <View style={styles.confirmActions}>
              <Pressable disabled={pending} accessibilityRole="button" onPress={() => setCancelTarget(null)} style={[styles.outlineButton, styles.confirmButton]}>
                <Text style={styles.outlineButtonText}>No, Keep</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                onPress={() => { void confirmCancel(); }}
                style={[styles.primaryButton, styles.confirmButton, { backgroundColor: colors.danger }, pending && styles.disabled]}
              >
                <Text style={styles.primaryButtonText}>{pending ? 'Cancelling…' : 'Yes, Cancel'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  searchGroup: { flexDirection: 'row', minWidth: 200, flexGrow: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 7, backgroundColor: colors.white, overflow: 'hidden' },
  searchInput: { flex: 1, minHeight: 38, paddingHorizontal: 10, color: colors.text, fontSize: 13 },
  searchButton: { width: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  primaryButtonGradient: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 7,
    backgroundColor: '#0B2F7D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 7, backgroundColor: colors.primaryText, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  outlineButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, flexDirection: 'row' },
  outlineButtonText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  filterLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginRight: 2 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: '#0B2F7D', borderColor: '#0B2F7D' },
  filterPillText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  filterPillTextActive: { color: colors.white, fontWeight: '700' },
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
  mutedText: { color: colors.muted, fontSize: 12 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0B2F7D',
    minHeight: 42,
    alignItems: 'center',
  },
  cell: { paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center', flexShrink: 0 },
  columnHeading: { color: colors.white, fontSize: 12, fontWeight: '700' },
  rowGroup: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: colors.white },
  alternateRow: { backgroundColor: '#FAFBFD' },
  value: { color: colors.text, fontSize: 12 },
  bold: { fontWeight: '700' },
  capitalize: { textTransform: 'capitalize' },
  caretBtn: { padding: 4, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIconBtn: { padding: 4, borderRadius: 4 },
  actionBtnTiny: { width: 22, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.danger },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  statusPending: { backgroundColor: '#FFF3CD', borderWidth: 1, borderColor: '#FFE69C' },
  statusApproved: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: '#A8DAB5' },
  statusRejected: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder },
  statusCancelled: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: colors.border },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextPending: { color: '#856404' },
  statusTextApproved: { color: colors.success },
  statusTextRejected: { color: colors.danger },
  statusTextCancelled: { color: colors.muted },
  expandedPanel: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    paddingLeft: 44,
    gap: 8,
  },
  detailItem: { gap: 2 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: colors.text, fontSize: 12 },
  cardsContainer: { gap: 10, padding: 12 },
  mobileCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 8, backgroundColor: colors.white },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardStaffName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardType: { fontSize: 12, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  cardDates: { gap: 2 },
  cardDateText: { fontSize: 12, color: colors.text },
  cardDetailText: { fontSize: 12, color: colors.muted },
  cardActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  paginationGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pageSize: { paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 5 },
  pageSizeActive: { borderColor: colors.primaryText, backgroundColor: colors.accentSoft },
  pageSizeText: { color: colors.muted, fontSize: 11 },
  pageSizeTextActive: { color: colors.primaryText, fontWeight: '700' },
  pageButton: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 5 },
  pageIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  pageNumberText: { fontSize: 12, fontWeight: '700', color: colors.text },
  disabled: { opacity: 0.45 },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 16 },
  confirmCard: { width: '100%', maxWidth: 440, padding: 20, borderRadius: 10, backgroundColor: colors.white, gap: 12 },
  confirmTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  confirmBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  confirmButton: { minWidth: 90 },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 11, color: colors.text, backgroundColor: colors.white, fontSize: 13 },
  multiline: { minHeight: 80, paddingTop: 8, textAlignVertical: 'top' },
});
