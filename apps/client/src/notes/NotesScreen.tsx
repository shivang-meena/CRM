import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import NoteFormModal from '@/components/notes/NoteFormModal';
import NoteViewModal from '@/components/notes/NoteViewModal';
import { useNote, useNoteActions, useNotes } from '@/hooks/useNotes';
import { Note } from '@/types/note';
import { colors } from '@/theme/colors';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function preview(value: string) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

export default function NotesScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const actions = useNoteActions();
  const queryFilters = useMemo(() => ({ page, pageSize, search: search.trim() || undefined }), [page, pageSize, search]);
  const listQuery = useNotes(queryFilters);
  const viewQuery = useNote(viewId);
  const notes = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = total ? Math.min(page * pageSize, total) : 0;
  const queryError = listQuery.error || viewQuery.error || actions.create.error || actions.update.error || actions.remove.error;

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  function openCreate() { setEditNote(null); setFormOpen(true); }
  function openEdit(note: Note) { setEditNote(note); setFormOpen(true); }
  function closeForm() { if (!actions.create.isPending && !actions.update.isPending) { setFormOpen(false); setEditNote(null); } }

  async function saveNote(content: string) {
    if (editNote) {
      await actions.update.mutateAsync({ id: editNote.id, data: { content, version: editNote.version } });
    } else {
      await actions.create.mutateAsync({ content, requestKey: `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` });
    }
    setFormOpen(false);
    setEditNote(null);
  }

  async function removeNote() {
    if (!deleteNote) return;
    try {
      await actions.remove.mutateAsync({ id: deleteNote.id, version: deleteNote.version });
      if (notes.length === 1 && page > 1) setPage(current => current - 1);
    } finally {
      setDeleteNote(null);
    }
  }

  return <View style={styles.page}>
    <View style={styles.toolbar}>
      <Text style={styles.heading}>Notes</Text>
      <View style={styles.toolbarRight}><View style={styles.search}><Ionicons name="search-outline" size={17} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search notes" placeholderTextColor={colors.muted} style={styles.searchInput} accessibilityLabel="Search notes" />{search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear note search" onPress={() => setSearch('')}><Ionicons name="close-circle-outline" size={16} color={colors.muted} /></Pressable> : null}</View><Button title="+ Add Note" onPress={openCreate} /></View>
    </View>
    {queryError ? <View accessibilityRole="alert" style={styles.errorBanner}><Text style={styles.errorText}>{errorMessage(queryError)}</Text><Pressable accessibilityRole="button" onPress={() => { void listQuery.refetch(); }}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}
    <View style={styles.tableShell}>
      {listQuery.isLoading && !listQuery.data ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading notes…</Text></View> : listQuery.isError && !listQuery.data ? <View style={styles.state}><Text style={styles.errorText}>{errorMessage(listQuery.error)}</Text></View> : !notes.length ? <View style={styles.state}><Ionicons name="document-text-outline" size={28} color={colors.muted} /><Text style={styles.muted}>{search.trim() ? 'No notes match your search.' : 'No notes yet.'}</Text></View> : <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroll}><View style={styles.table}>
        <View style={styles.headerRow}><Text style={[styles.headerCell, styles.noCell]}>No.</Text><Text style={[styles.headerCell, styles.actionsCell]}>Actions</Text><Text style={[styles.headerCell, styles.noteCell]}>Note</Text><Text style={[styles.headerCell, styles.typeCell]}>Type</Text></View>
        {notes.map((note, index) => <View key={note.id} style={styles.dataRow}><Text style={[styles.cell, styles.noCell]}>{start + index}</Text><View style={[styles.actionsCell, styles.actionButtons]}><Pressable accessibilityRole="button" accessibilityLabel={`Edit note ${start + index}`} onPress={() => openEdit(note)}><Ionicons name="create-outline" size={17} color="#F39A24" /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete note ${start + index}`} onPress={() => setDeleteNote(note)}><Ionicons name="trash-outline" size={17} color={colors.danger} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`View note ${start + index}`} onPress={() => setViewId(note.id)}><Ionicons name="eye-outline" size={17} color="#2B78D4" /></Pressable></View><Text style={[styles.cell, styles.noteCell]} numberOfLines={2}>{preview(note.content)}</Text><Text style={[styles.cell, styles.typeCell]}>Note</Text></View>)}
      </View></ScrollView>}
      {listQuery.isFetching && listQuery.data ? <View style={styles.fetching}><ActivityIndicator size="small" color={colors.accent} /></View> : null}
    </View>
    <View style={styles.footer}><View style={styles.rowsControl}><Text style={styles.footerText}>Rows per page:</Text>{PAGE_SIZE_OPTIONS.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: pageSize === option }} onPress={() => { setPageSize(option); setPage(1); }} style={[styles.pageSize, pageSize === option && styles.pageSizeSelected]}><Text style={[styles.pageSizeText, pageSize === option && styles.pageSizeTextSelected]}>{option}</Text></Pressable>)}</View><Text style={styles.footerText}>{start} - {end} of {total}</Text><View style={styles.pagination}><PageButton icon="play-skip-back-outline" label="First page" disabled={page <= 1} onPress={() => setPage(1)} /><PageButton icon="chevron-back-outline" label="Previous page" disabled={page <= 1} onPress={() => setPage(current => Math.max(1, current - 1))} /><View style={styles.pageNumber}><Text style={styles.pageNumberText}>{page}</Text></View><Text style={styles.footerText}>of {totalPages}</Text><PageButton icon="chevron-forward-outline" label="Next page" disabled={page >= totalPages} onPress={() => setPage(current => Math.min(totalPages, current + 1))} /><PageButton icon="play-skip-forward-outline" label="Last page" disabled={page >= totalPages} onPress={() => setPage(totalPages)} /></View></View>
    <NoteFormModal visible={formOpen} note={editNote} onClose={closeForm} onSave={saveNote} />
    <NoteViewModal visible={!!viewId} note={viewQuery.data ?? notes.find(note => note.id === viewId) ?? null} loading={viewQuery.isLoading} onClose={() => setViewId(null)} />
    <ConfirmDialog visible={!!deleteNote} title="Delete note?" message="This note will be archived and removed from the list." loading={actions.remove.isPending} onCancel={() => setDeleteNote(null)} onConfirm={() => { void removeNote(); }} />
  </View>;
}

function PageButton({ icon, label, disabled, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.pageButton, disabled && styles.pageButtonDisabled]}><Ionicons name={icon} size={15} color={disabled ? colors.border : colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  toolbar: { minHeight: 70, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { color: colors.text, fontSize: 21, fontWeight: '800' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  search: { width: 220, height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchInput: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 0 },
  errorBanner: { margin: 12, padding: 10, borderRadius: 7, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: colors.danger, fontSize: 12, flex: 1 }, retry: { color: colors.primaryText, fontWeight: '800', fontSize: 12 },
  tableShell: { flex: 1, margin: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 7, overflow: 'hidden', position: 'relative' },
  tableScroll: { minWidth: '100%' }, table: { minWidth: 680, flex: 1 },
  headerRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B2F7D' },
  dataRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCell: { color: colors.white, fontSize: 11, fontWeight: '800', paddingHorizontal: 9 }, cell: { color: colors.text, fontSize: 12, paddingHorizontal: 9 }, noCell: { width: 60 }, actionsCell: { width: 105 }, noteCell: { width: 390 }, typeCell: { width: 125 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  state: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20 }, muted: { color: colors.muted, fontSize: 12 }, fetching: { position: 'absolute', top: 9, right: 12 },
  footer: { paddingHorizontal: 18, paddingVertical: 11, gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }, footerText: { color: colors.muted, fontSize: 11 }, rowsControl: { flexDirection: 'row', alignItems: 'center', gap: 5 }, pageSize: { minWidth: 28, minHeight: 27, borderRadius: 5, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, pageSizeSelected: { borderColor: colors.accent, backgroundColor: colors.primarySoft }, pageSizeText: { color: colors.muted, fontSize: 11 }, pageSizeTextSelected: { color: colors.primaryText, fontWeight: '800' }, pagination: { flexDirection: 'row', alignItems: 'center', gap: 6 }, pageButton: { width: 28, height: 28, borderRadius: 5, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, pageButtonDisabled: { opacity: 0.55 }, pageNumber: { minWidth: 38, height: 28, borderWidth: 1, borderColor: colors.border, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, pageNumberText: { color: colors.text, fontSize: 11 },
});
