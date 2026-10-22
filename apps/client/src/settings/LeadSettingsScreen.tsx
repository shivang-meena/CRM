import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useDeleteLeadStatus,
  useLeadStatuses,
  useReorderLeadStatuses,
  useSaveLeadStatus,
} from '@/hooks/useLeadStatuses';
import { LeadStatusMasterEntry } from '@/types/leadStatus';

const MAX_LEAD_STATUSES = 30;

const PRESET_COLORS = [
  '#0284C7', // Sky Blue
  '#7C3AED', // Purple
  '#65A30D', // Lime Green
  '#16A34A', // Emerald Green
  '#DC2626', // Red
  '#EA580C', // Orange
  '#D97706', // Amber
  '#EC4899', // Pink
  '#0D9488', // Teal
  '#475569', // Slate
];

interface FormDraft {
  id?: string;
  name: string;
  color: string;
  isActive: boolean;
}

const EMPTY_DRAFT: FormDraft = {
  name: '',
  color: '#0284C7',
  isActive: true,
};

export default function LeadSettingsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LeadStatusMasterEntry | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; targetId: string; startY: number } | null>(null);
  const rowLayouts = useRef<Record<string, { y: number; height: number }>>({});

  const { data: statuses, isLoading, isError, error, refetch } = useLeadStatuses();
  const saveMutation = useSaveLeadStatus();
  const reorderMutation = useReorderLeadStatuses();
  const deleteMutation = useDeleteLeadStatus();

  const statusList = statuses ?? [];
  const limitReached = statusList.length >= MAX_LEAD_STATUSES;
  const filteredList = statusList.filter((s) =>
    s.name.toLowerCase().includes(searchText.trim().toLowerCase()),
  );

  function openCreate() {
    if (limitReached || isLoading || isError) return;
    setDraft({ ...EMPTY_DRAFT });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(entry: LeadStatusMasterEntry) {
    setDraft({
      id: entry.id,
      name: entry.name,
      color: entry.color || '#0284C7',
      isActive: entry.isActive,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!draft.id && limitReached) {
      setFormError('You can add a maximum of 30 lead statuses.');
      return;
    }
    const trimmed = draft.name.trim();
    if (!trimmed) {
      setFormError('Status name is required.');
      return;
    }
    setFormError('');

    try {
      await saveMutation.mutateAsync({
        id: draft.id,
        name: trimmed,
        color: draft.color.trim() || '#0284C7',
        isActive: draft.isActive,
      });
      setModalOpen(false);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statusList.length) return;

    const copy = [...statusList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const ids = copy.map((c) => c.id);
    try {
      await reorderMutation.mutateAsync(ids);
    } catch {
      // Revert via query invalidation
    }
  }

  function startDrag(id: string, startY = 0) {
    if (reorderMutation.isPending) return;
    dragRef.current = { id, targetId: id, startY };
    setDraggingId(id);
    setDropTargetId(id);
  }

  function updateDropTarget(id: string) {
    if (!dragRef.current) return;
    dragRef.current.targetId = id;
    setDropTargetId(id);
  }

  function moveNativeDrag(pageY: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const source = rowLayouts.current[drag.id];
    if (!source) return;
    const centerY = source.y + source.height / 2 + pageY - drag.startY;
    let closestId = drag.id;
    let closestDistance = Infinity;
    for (const entry of filteredList) {
      const layout = rowLayouts.current[entry.id];
      if (!layout) continue;
      const distance = Math.abs(centerY - layout.y - layout.height / 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = entry.id;
      }
    }
    updateDropTarget(closestId);
  }

  function cancelDrag() {
    dragRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  async function finishDrag(targetId?: string) {
    const drag = dragRef.current;
    cancelDrag();
    if (!drag || reorderMutation.isPending) return;
    const from = statusList.findIndex((entry) => entry.id === drag.id);
    const to = statusList.findIndex((entry) => entry.id === (targetId ?? drag.targetId));
    if (from < 0 || to < 0 || from === to) return;
    const ids = statusList.map((entry) => entry.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try {
      await reorderMutation.mutateAsync(ids);
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={Platform.OS === 'web' || !draggingId}
    >
      {/* Main Card */}
      <View style={styles.card}>
          {/* Header Row: Title, Search, Add Button */}
          <View style={[styles.headerRow, !wide && styles.headerRowMobile]}>
            <Text style={styles.title}>Lead Status</Text>

            <View style={[styles.actionsRow, !wide && styles.actionsRowMobile]}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={17} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search status..."
                  placeholderTextColor="#94A3B8"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {!!searchText && (
                  <Pressable onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              <Pressable
                style={[styles.addBtn, (limitReached || isLoading || isError) && styles.iconBtnDisabled]}
                onPress={openCreate}
                disabled={limitReached || isLoading || isError}
                accessibilityHint={limitReached ? 'Maximum of 30 lead statuses reached.' : undefined}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Lead Status</Text>
              </Pressable>
            </View>
          </View>

          {limitReached && (
            <Text style={styles.limitText}>Maximum of 30 lead statuses reached.</Text>
          )}

          {/* List or States */}
          {isLoading ? (
            <ActivityIndicator style={{ paddingVertical: 40 }} color="#1D5FD6" />
          ) : isError ? (
            <View style={styles.centerBox}>
              <Text style={styles.errText}>{errorMessage(error)}</Text>
              <Button title="Retry" variant="outline" onPress={() => refetch()} />
            </View>
          ) : filteredList.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                {searchText ? 'No lead status matching search.' : 'No lead statuses found.'}
              </Text>
            </View>
          ) : (
            <View style={styles.statusList}>
              {filteredList.map((entry) => {
                const index = statusList.findIndex((status) => status.id === entry.id);
                const color = entry.color || '#0284C7';
                const handleIcon = (
                  <Ionicons name="apps-outline" size={16} color="#94A3B8" />
                );
                const row = (
                  <View
                    key={entry.id}
                    style={[
                      styles.statusRow,
                      draggingId === entry.id && styles.draggingRow,
                      dropTargetId === entry.id && draggingId !== entry.id && styles.dropTargetRow,
                    ]}
                    onLayout={({ nativeEvent: { layout } }) => {
                      rowLayouts.current[entry.id] = { y: layout.y, height: layout.height };
                    }}
                  >
                    {/* Left: Drag Handle, Order, Badge */}
                    <View style={styles.rowLeft}>
                      {Platform.OS === 'web' ? (
                        <div
                          draggable={!reorderMutation.isPending}
                          aria-label={`Drag to reorder ${entry.name}`}
                          onDragStart={(event) => {
                            if (reorderMutation.isPending) {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.setData('text/plain', entry.id);
                            event.dataTransfer.effectAllowed = 'move';
                            const rowElement = event.currentTarget.parentElement?.parentElement;
                            if (rowElement) event.dataTransfer.setDragImage(rowElement, 20, 20);
                            startDrag(entry.id);
                          }}
                          onDragEnd={cancelDrag}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: 6,
                            cursor: reorderMutation.isPending ? 'default' : draggingId === entry.id ? 'grabbing' : 'grab',
                            userSelect: 'none',
                          }}
                        >
                          {handleIcon}
                        </div>
                      ) : (
                        <View
                          accessibilityLabel={`Drag to reorder ${entry.name}`}
                          style={styles.dragHandle}
                          hitSlop={8}
                          onStartShouldSetResponder={() => !reorderMutation.isPending}
                          onResponderGrant={(event) => startDrag(entry.id, event.nativeEvent.pageY)}
                          onResponderMove={(event) => moveNativeDrag(event.nativeEvent.pageY)}
                          onResponderRelease={() => { void finishDrag(); }}
                          onResponderTerminate={cancelDrag}
                          onResponderTerminationRequest={() => false}
                        >
                          {handleIcon}
                        </View>
                      )}

                      <View style={styles.orderPill}>
                        <Text style={styles.orderText}>{index + 1}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: color + '1A', // 10% opacity tint
                            borderColor: color + '4D',
                          },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color }]}>
                          {entry.name}
                        </Text>
                      </View>

                      {!entry.isActive && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Inactive</Text>
                        </View>
                      )}
                    </View>

                    {/* Right: Reorder & Edit actions */}
                    <View style={styles.rowRight}>
                      {/* Move up / down */}
                      <Pressable
                        style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                        disabled={index === 0 || reorderMutation.isPending || !!draggingId}
                        onPress={() => handleMove(index, 'up')}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={15}
                          color={index === 0 ? '#CBD5E1' : '#64748B'}
                        />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.iconBtn,
                          index === statusList.length - 1 && styles.iconBtnDisabled,
                        ]}
                        disabled={
                          index === statusList.length - 1 || reorderMutation.isPending || !!draggingId
                        }
                        onPress={() => handleMove(index, 'down')}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={15}
                          color={index === statusList.length - 1 ? '#CBD5E1' : '#64748B'}
                        />
                      </Pressable>

                      {/* Edit Button */}
                      <Pressable
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => openEdit(entry)}
                      >
                        <Ionicons name="create-outline" size={18} color="#16A34A" />
                      </Pressable>

                      {/* Delete Button */}
                      <Pressable
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => setDeleteTarget(entry)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                );
                return Platform.OS === 'web' ? (
                  <div
                    key={entry.id}
                    onDragOver={(event) => {
                      if (!dragRef.current || reorderMutation.isPending) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      updateDropTarget(entry.id);
                    }}
                    onDrop={(event) => {
                      if (!dragRef.current) return;
                      event.preventDefault();
                      void finishDrag(entry.id);
                    }}
                  >
                    {row}
                  </div>
                ) : row;
              })}
            </View>
          )}
        </View>

      {/* Add / Edit Status Modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {draft.id ? 'Edit Lead Status' : 'Add Lead Status'}
              </Text>
              <Pressable
                onPress={() => setModalOpen(false)}
                disabled={saveMutation.isPending}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 16 }}>
              {/* Status Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. In Negotiation, Hot Lead"
                  placeholderTextColor="#94A3B8"
                  value={draft.name}
                  onChangeText={(val) => {
                    setDraft((p) => ({ ...p, name: val }));
                    setFormError('');
                  }}
                />
              </View>

              {/* Color Presets */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Badge Color</Text>
                <View style={styles.presetGrid}>
                  {PRESET_COLORS.map((c) => {
                    const isSelected = draft.color.toLowerCase() === c.toLowerCase();
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setDraft((p) => ({ ...p, color: c }))}
                        style={[
                          styles.presetCircle,
                          { backgroundColor: c },
                          isSelected && styles.presetCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Hex Code Input */}
                <View style={[styles.searchBox, { marginTop: 8 }]}>
                  <Text style={{ color: '#64748B', fontWeight: '600' }}>#</Text>
                  <TextInput
                    style={[styles.searchInput, { textTransform: 'uppercase' }]}
                    placeholder="Hex code (e.g. 0284C7)"
                    placeholderTextColor="#94A3B8"
                    value={draft.color.replace('#', '')}
                    maxLength={6}
                    onChangeText={(val) =>
                      setDraft((p) => ({ ...p, color: '#' + val.replace('#', '') }))
                    }
                  />
                </View>
              </View>

              {/* Live Preview */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preview Badge</Text>
                <View style={styles.previewContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: (draft.color || '#0284C7') + '22',
                        borderColor: (draft.color || '#0284C7') + '55',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: draft.color || '#0284C7' },
                      ]}
                    >
                      {draft.name.trim() || 'Status Preview'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Active Toggle */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Active</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>
                    Show this status as an option when adding or updating leads.
                  </Text>
                </View>
                <Switch
                  value={draft.isActive}
                  onValueChange={(val) => setDraft((p) => ({ ...p, isActive: val }))}
                  trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
                  thumbColor={draft.isActive ? '#1D5FD6' : '#FFFFFF'}
                />
              </View>

              {!!formError && <Text style={styles.errText}>{formError}</Text>}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                disabled={saveMutation.isPending}
                onPress={() => setModalOpen(false)}
              />
              <Button
                title={draft.id ? 'Save Changes' : 'Create Status'}
                loading={saveMutation.isPending}
                onPress={handleSave}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Status?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? If any leads are currently assigned to this status, you will need to reassign or deactivate it instead.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    padding: 18,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionsRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#F8FAFC',
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0B2F7D',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 40,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  limitText: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
  },
  dragHandle: {
    marginRight: 6,
  },
  draggingRow: {
    opacity: 0.5,
  },
  dropTargetRow: {
    borderColor: '#0B2F7D',
    backgroundColor: '#F0F5FF',
  },
  statusList: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderPill: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
  },
  iconBtnDisabled: {
    opacity: 0.4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
  },
  deleteBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
    maxHeight: 450,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  presetCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  previewContainer: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
});
