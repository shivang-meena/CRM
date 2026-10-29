// ORIGINAL IMPLEMENTATION PRESERVED BELOW AS COMMENTS.
// // apps/client/app/(app)/leads.tsx
// // import React, { useEffect, useState } from 'react';
// // import {
// //   ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
// // } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { colors } from '@/theme/colors';
// // import { errorMessage } from '@/api/client';
// // import { useAuth } from '@/context/AuthContext';
// // import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useLeads';
// // import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// // import { Lead, LeadStatus, STATUS_LIST } from '@/types/lead';
// // import { LeadDndProvider } from '@/context/LeadDndContext';
// // import ActionMenu from '@/components/ActionMenu';
// // import Button from '@/components/Button';
// // import ConfirmDialog from '@/components/ConfirmDialog';
// // import KanbanColumn from '@/components/KanbanColumn';
// // import LeadFormModal from '@/components/LeadFormModal';
// // import LeadDetailsModal from '@/components/lead/LeadDetailsModal';
//
// // export default function LeadsBoard() {
// //   const router = useRouter();
// //   const { userName } = useAuth();
// //   const { height } = useWindowDimensions();
//
// //   const [searchText, setSearchText] = useState('');
// //   const [search, setSearch] = useState('');
// //   useEffect(() => {
// //     const t = setTimeout(() => setSearch(searchText.trim()), 300);
// //     return () => clearTimeout(t);
// //   }, [searchText]);
//
// //   const { data, isLoading, isError, error, refetch } = useLeads(search);
// //   const statusesQuery = useLeadStatuses();
// //   const activeStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
// //   const columns = activeStatuses.length > 0
// //     ? activeStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
// //     : STATUS_LIST;
//
// //   const del = useDeleteLead();
// //   const updateLead = useUpdateLead();
//
// //   const [formOpen, setFormOpen] = useState(false);
// //   const [editLead, setEditLead] = useState<Lead | null>(null);
// //   const [menuLead, setMenuLead] = useState<Lead | null>(null);
// //   const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
// //   const [selectedLeadModalId, setSelectedLeadModalId] = useState<string | null>(null);
//
// //   const leads = data ?? [];
//
// //   const handleDropLead = (leadId: string, targetStatus: LeadStatus) => {
// //     const target = leads.find((l) => l.id === leadId);
// //     if (!target || target.status === targetStatus) return;
// //     updateLead.mutate({ id: leadId, data: { status: targetStatus } });
// //   };
//
// //   async function confirmDelete() {
// //     if (!deleteLead) return;
// //     try {
// //       await del.mutateAsync(deleteLead.id);
// //     } finally {
// //       setDeleteLead(null);
// //     }
// //   }
//
// //   return (
// //     <View style={styles.page}>
// //       <View style={styles.topbar}>
// //         <Text style={styles.heading}>Leads</Text>
// //         <TextInput
// //           style={styles.search}
// //           placeholder="Search name, phone, email, company"
// //           placeholderTextColor={colors.muted}
// //           value={searchText}
// //           onChangeText={setSearchText}
// //         />
// //         <Button
// //           title="Add Lead"
// //           onPress={() => {
// //             setEditLead(null);
// //             setFormOpen(true);
// //           }}
// //         />
// //       </View>
//
// //       {isLoading ? (
// //         <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
// //       ) : isError ? (
// //         <View style={styles.errBox}>
// //           <Text style={styles.errText}>{errorMessage(error)}</Text>
// //           <Button title="Retry" variant="outline" onPress={() => refetch()} />
// //         </View>
// //       ) : (
// //         <LeadDndProvider onDropLead={handleDropLead}>
// //           <ScrollView horizontal contentContainerStyle={styles.board}>
// //             {columns.map((s) => (
// //               <KanbanColumn
// //                 key={s.key}
// //                 statusKey={s.key}
// //                 title={s.label}
// //                 leads={leads.filter((l) => l.status === s.key || (l.status && l.status.toLowerCase() === s.label.toLowerCase()))}
// //                 maxHeight={Math.max(height - 220, 240)}
// //                 onOpen={(l) => setSelectedLeadModalId(l.id)}
// //                 onMenu={(l) => setMenuLead(l)}
// //               />
// //             ))}
// //           </ScrollView>
// //         </LeadDndProvider>
// //       )}
//
// //       <ActionMenu
// //         visible={!!menuLead}
// //         title={menuLead?.name ?? ''}
// //         onClose={() => setMenuLead(null)}
// //         onEdit={() => {
// //           setEditLead(menuLead);
// //           setMenuLead(null);
// //           setFormOpen(true);
// //         }}
// //         onDelete={() => {
// //           setDeleteLead(menuLead);
// //           setMenuLead(null);
// //         }}
// //       />
//
// //       <ConfirmDialog
// //         visible={!!deleteLead}
// //         title="Delete lead?"
// //         message={`This will permanently delete ${deleteLead?.name ?? 'this lead'}.`}
// //         loading={del.isPending}
// //         onConfirm={confirmDelete}
// //         onCancel={() => setDeleteLead(null)}
// //       />
//
// //       <LeadFormModal
// //         visible={formOpen}
// //         lead={editLead}
// //         defaultAssignee={userName}
// //         onClose={() => setFormOpen(false)}
// //       />
//
// //       <LeadDetailsModal
// //         visible={!!selectedLeadModalId}
// //         leadId={selectedLeadModalId}
// //         onClose={() => setSelectedLeadModalId(null)}
// //       />
// //     </View>
// //   );
// // }
//
// // const styles = StyleSheet.create({
// //   page: { flex: 1, backgroundColor: '#F7F9FC' },
// //   topbar: {
// //     flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
// //     padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
// //   },
// //   heading: { fontSize: 20, fontWeight: '800', color: colors.text },
// //   search: {
// //     flex: 1, minWidth: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
// //     paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.text, backgroundColor: colors.white,
// //   },
// //   board: { padding: 16, gap: 12, alignItems: 'flex-start' },
// //   errBox: { padding: 24, gap: 12, alignItems: 'flex-start' },
// //   errText: { color: colors.danger },
// // });
//
// import React, { useEffect, useState } from 'react';
// import {
//   Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { colors } from '@/theme/colors';
// import { errorMessage } from '@/api/client';
// import { useAuth } from '@/context/AuthContext';
// import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useLeads';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { Lead, LeadStatus, STATUS_LIST } from '@/types/lead';
// import { LeadDndProvider } from '@/context/LeadDndContext';
// import ActionMenu from '@/components/ActionMenu';
// import Button from '@/components/Button';
// import ConfirmDialog from '@/components/ConfirmDialog';
// import KanbanColumn from '@/components/KanbanColumn';
// import LeadFormModal from '@/components/LeadFormModal';
// import LeadDetailsModal from '@/components/lead/LeadDetailsModal';
//
// const BOARD_PADDING = 20;
// const COMPACT_BREAKPOINT = 640;
// const DANGER_SOFT = '#FFF1F0';
//
// function BoardSkeleton() {
//   return (
//     <View accessibilityLabel="Loading leads" style={styles.skeletonRow}>
//       {[0, 1, 2].map((column) => (
//         <View key={column} style={styles.skeletonColumn}>
//           <View style={styles.skeletonTitle} />
//           {[0, 1, 2].map((card) => <View key={card} style={styles.skeletonCard} />)}
//         </View>
//       ))}
//     </View>
//   );
// }
//
// export default function LeadsBoard() {
//   const router = useRouter();
//   const { userName } = useAuth();
//   const { height, width } = useWindowDimensions();
//   const compact = width < COMPACT_BREAKPOINT;
//
//   const [searchText, setSearchText] = useState('');
//   const [search, setSearch] = useState('');
//   const [searchFocused, setSearchFocused] = useState(false);
//   const [boardHeight, setBoardHeight] = useState(0);
//   useEffect(() => {
//     const t = setTimeout(() => setSearch(searchText.trim()), 300);
//     return () => clearTimeout(t);
//   }, [searchText]);
//
//   const { data, isLoading, isError, error, refetch } = useLeads(search);
//   const statusesQuery = useLeadStatuses();
//   const activeStatuses = statusesQuery.data?.filter((s) => s.isActive) ?? [];
//   const columns = activeStatuses.length > 0
//     ? activeStatuses.map((s) => ({ key: (s.code || s.name) as LeadStatus, label: s.name }))
//     : STATUS_LIST;
//
//   const del = useDeleteLead();
//   const updateLead = useUpdateLead();
//
//   const [formOpen, setFormOpen] = useState(false);
//   const [editLead, setEditLead] = useState<Lead | null>(null);
//   const [menuLead, setMenuLead] = useState<Lead | null>(null);
//   const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
//   const [selectedLeadModalId, setSelectedLeadModalId] = useState<string | null>(null);
//
//   const leads = data ?? [];
//   const noSearchResults = !isLoading && !isError && !!search && leads.length === 0;
//
//   // Column height follows the real space available to the board; falls back to the window until measured.
//   const columnMaxHeight = boardHeight > 0
//     ? Math.max(boardHeight - BOARD_PADDING * 2, 240)
//     : Math.max(height - 240, 240);
//
//   let subtitle = 'Loading leads';
//   if (!isLoading && !isError) {
//     const count = leads.length;
//     subtitle = search
//       ? `${count} ${count === 1 ? 'result' : 'results'} for "${search}"`
//       : `${count} total ${count === 1 ? 'lead' : 'leads'}`;
//   } else if (isError) {
//     subtitle = 'Unable to load leads';
//   }
//
//   const handleDropLead = (leadId: string, targetStatus: LeadStatus) => {
//     const target = leads.find((l) => l.id === leadId);
//     if (!target || target.status === targetStatus) return;
//     updateLead.mutate({ id: leadId, data: { status: targetStatus } });
//   };
//
//   async function confirmDelete() {
//     if (!deleteLead) return;
//     try {
//       await del.mutateAsync(deleteLead.id);
//     } finally {
//       setDeleteLead(null);
//     }
//   }
//
//   const searchField = (
//     <View style={[styles.searchWrap, compact ? styles.searchWrapCompact : styles.searchWrapWide, searchFocused && styles.searchFocused]}>
//       <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.muted} />
//       <TextInput
//         style={styles.searchInput}
//         placeholder="Search name, phone, email, company"
//         placeholderTextColor={colors.muted}
//         value={searchText}
//         onChangeText={setSearchText}
//         onFocus={() => setSearchFocused(true)}
//         onBlur={() => setSearchFocused(false)}
//         accessibilityLabel="Search leads"
//         returnKeyType="search"
//       />
//       {searchText.length > 0 ? (
//         <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearchText('')} style={styles.clearButton}>
//           <Ionicons name="close" size={14} color={colors.muted} />
//         </Pressable>
//       ) : null}
//     </View>
//   );
//
//   return (
//     <View style={styles.page}>
//       <View style={styles.topbar}>
//         <View style={styles.headerRow}>
//           <View style={styles.titleBlock}>
//             <Text accessibilityRole="header" style={styles.heading}>Leads</Text>
//             <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
//           </View>
//           {!compact ? searchField : null}
//           <Button
//             title="Add Lead"
//             onPress={() => {
//               setEditLead(null);
//               setFormOpen(true);
//             }}
//           />
//         </View>
//         {compact ? searchField : null}
//       </View>
//
//       <View style={styles.boardArea} onLayout={(event) => setBoardHeight(event.nativeEvent.layout.height)}>
//         {isLoading ? (
//           <BoardSkeleton />
//         ) : isError ? (
//           <View accessibilityRole="alert" style={styles.stateCard}>
//             <View style={[styles.stateIcon, { backgroundColor: DANGER_SOFT }]}>
//               <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
//             </View>
//             <Text style={styles.stateTitle}>Couldn't load leads</Text>
//             <Text style={styles.errText}>{errorMessage(error)}</Text>
//             <Button title="Retry" variant="outline" onPress={() => refetch()} />
//           </View>
//         ) : noSearchResults ? (
//           <View style={styles.stateCard}>
//             <View style={[styles.stateIcon, { backgroundColor: colors.primarySoft }]}>
//               <Ionicons name="search-outline" size={26} color={colors.primary} />
//             </View>
//             <Text style={styles.stateTitle}>No leads found</Text>
//             <Text style={styles.stateText}>Nothing matches "{search}". Try a different name, phone, email or company.</Text>
//             <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} />
//           </View>
//         ) : (
//           <LeadDndProvider onDropLead={handleDropLead}>
//             <ScrollView horizontal contentContainerStyle={styles.board}>
//               {columns.map((s) => (
//                 <KanbanColumn
//                   key={s.key}
//                   statusKey={s.key}
//                   title={s.label}
//                   leads={leads.filter((l) => l.status === s.key || (l.status && l.status.toLowerCase() === s.label.toLowerCase()))}
//                   maxHeight={columnMaxHeight}
//                   onOpen={(l) => setSelectedLeadModalId(l.id)}
//                   onMenu={(l) => setMenuLead(l)}
//                 />
//               ))}
//             </ScrollView>
//           </LeadDndProvider>
//         )}
//       </View>
//
//       <ActionMenu
//         visible={!!menuLead}
//         title={menuLead?.name ?? ''}
//         onClose={() => setMenuLead(null)}
//         onEdit={() => {
//           setEditLead(menuLead);
//           setMenuLead(null);
//           setFormOpen(true);
//         }}
//         onDelete={() => {
//           setDeleteLead(menuLead);
//           setMenuLead(null);
//         }}
//       />
//
//       <ConfirmDialog
//         visible={!!deleteLead}
//         title="Delete lead?"
//         message={`This will permanently delete ${deleteLead?.name ?? 'this lead'}.`}
//         loading={del.isPending}
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteLead(null)}
//       />
//
//       <LeadFormModal
//         visible={formOpen}
//         lead={editLead}
//         defaultAssignee={userName}
//         onClose={() => setFormOpen(false)}
//       />
//
//       <LeadDetailsModal
//         visible={!!selectedLeadModalId}
//         leadId={selectedLeadModalId}
//         onClose={() => setSelectedLeadModalId(null)}
//       />
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: '#F7F9FC' },
//
//   /* Header */
//   topbar: { paddingHorizontal: 20, paddingVertical: 14, gap: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
//   titleBlock: { flexShrink: 1, minWidth: 90 },
//   heading: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
//   subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
//
//   /* Search */
//   searchWrap: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F7F9FC' },
//   searchWrapWide: { flex: 1, maxWidth: 460, marginLeft: 'auto' },
//   searchWrapCompact: { width: '100%' },
//   searchFocused: { borderColor: colors.primary, backgroundColor: colors.white },
//   searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 14, color: colors.text },
//   clearButton: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF0F8' },
//
//   /* Board */
//   boardArea: { flex: 1 },
//   board: { padding: BOARD_PADDING, gap: 16, alignItems: 'flex-start' },
//
//   /* Loading skeleton */
//   skeletonRow: { flexDirection: 'row', gap: 16, padding: BOARD_PADDING, overflow: 'hidden' },
//   skeletonColumn: { width: 280, padding: 12, gap: 10, borderRadius: 14, backgroundColor: '#EEF3FA' },
//   skeletonTitle: { width: 110, height: 14, borderRadius: 7, marginBottom: 4, backgroundColor: '#DCE6F4' },
//   skeletonCard: { height: 84, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E4EBF5' },
//
//   /* Empty + error states */
//   stateCard: { alignSelf: 'center', alignItems: 'center', width: '100%', maxWidth: 400, marginTop: 48, padding: 24, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, boxShadow: '0 4px 14px rgba(11,47,125,0.07)' },
//   stateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
//   stateTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
//   stateText: { fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center', marginBottom: 6 },
//   errText: { fontSize: 13, lineHeight: 19, color: colors.danger, textAlign: 'center', marginBottom: 6 },
// });

// NOTE: This screen was already in a modern style, so only the page background / spacing were
// aligned with the new Lead View design. Logic is unchanged. (Old commented-out copy removed.)
import React, { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { Lead, LeadStatus, STATUS_LIST } from '@/types/lead';
import { LeadDndProvider } from '@/context/LeadDndContext';
import { notifyGlobalSuccess } from '@/components/FeedbackToast';
import ActionMenu from '@/components/ActionMenu';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import KanbanColumn from '@/components/KanbanColumn';
import LeadFormModal from '@/components/LeadFormModal';
import LeadDetailsModal from '@/components/lead/LeadDetailsModal';

const BOARD_PADDING = 20;
const COMPACT_BREAKPOINT = 640;
const DANGER_SOFT = '#FFF1F0';
const PAGE_BG = '#F4F6FA';

function BoardSkeleton() {
  return (
    <View accessibilityLabel="Loading leads" style={styles.skeletonRow}>
      {[0, 1, 2].map((column) => (
        <View key={column} style={styles.skeletonColumn}>
          <View style={styles.skeletonTitle} />
          {[0, 1, 2].map((card) => <View key={card} style={styles.skeletonCard} />)}
        </View>
      ))}
    </View>
  );
}

export default function LeadsBoard() {
  const router = useRouter();
  const { userName } = useAuth();
  const { height, width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [boardHeight, setBoardHeight] = useState(0);
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
  const noSearchResults = !isLoading && !isError && !!search && leads.length === 0;

  // Column height follows the real space available to the board; falls back to the window until measured.
  const columnMaxHeight = boardHeight > 0
    ? Math.max(boardHeight - BOARD_PADDING * 2, 240)
    : Math.max(height - 240, 240);

  let subtitle = 'Loading leads';
  if (!isLoading && !isError) {
    const count = leads.length;
    subtitle = search
      ? `${count} ${count === 1 ? 'result' : 'results'} for "${search}"`
      : `${count} total ${count === 1 ? 'lead' : 'leads'}`;
  } else if (isError) {
    subtitle = 'Unable to load leads';
  }

  const handleDropLead = async (leadId: string, targetStatus: LeadStatus) => {
    const target = leads.find((l) => l.id === leadId);
    if (!target || target.status === targetStatus) return;
    await updateLead.mutateAsync({ id: leadId, data: { status: targetStatus } });
    const targetCol = columns.find((c) => c.key === targetStatus);
    const statusName = targetCol ? targetCol.label : targetStatus;
    notifyGlobalSuccess(`Lead status changed to "${statusName}"`, 'Status updated');
  };

  async function confirmDelete() {
    if (!deleteLead) return;
    try {
      await del.mutateAsync(deleteLead.id);
    } finally {
      setDeleteLead(null);
    }
  }

  const searchField = (
    <View style={[styles.searchWrap, compact ? styles.searchWrapCompact : styles.searchWrapWide, searchFocused && styles.searchFocused]}>
      <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.muted} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search name, phone, email, company"
        placeholderTextColor={colors.muted}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        accessibilityLabel="Search leads"
        returnKeyType="search"
      />
      {searchText.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearchText('')} style={styles.clearButton}>
          <Ionicons name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.heading}>Leads</Text>
            <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
          </View>
          {!compact ? searchField : null}
          <Button
            title="Add Lead"
            onPress={() => {
              setEditLead(null);
              setFormOpen(true);
            }}
          />
        </View>
        {compact ? searchField : null}
      </View>

      <View style={styles.boardArea} onLayout={(event) => setBoardHeight(event.nativeEvent.layout.height)}>
        {isLoading ? (
          <BoardSkeleton />
        ) : isError ? (
          <View accessibilityRole="alert" style={styles.stateCard}>
            <View style={[styles.stateIcon, { backgroundColor: DANGER_SOFT }]}>
              <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
            </View>
            <Text style={styles.stateTitle}>Couldn't load leads</Text>
            <Text style={styles.errText}>{errorMessage(error)}</Text>
            <Button title="Retry" variant="outline" onPress={() => refetch()} />
          </View>
        ) : noSearchResults ? (
          <View style={styles.stateCard}>
            <View style={[styles.stateIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="search-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.stateTitle}>No leads found</Text>
            <Text style={styles.stateText}>Nothing matches "{search}". Try a different name, phone, email or company.</Text>
            <Button title="Clear search" variant="outline" onPress={() => setSearchText('')} />
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
                  maxHeight={columnMaxHeight}
                  onOpen={(l) => setSelectedLeadModalId(l.id)}
                  onMenu={(l) => setMenuLead(l)}
                />
              ))}
            </ScrollView>
          </LeadDndProvider>
        )}
      </View>

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
  page: { flex: 1, backgroundColor: PAGE_BG },

  /* Header */
  topbar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, gap: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  titleBlock: { flexShrink: 1, minWidth: 90 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },

  /* Search */
  searchWrap: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: PAGE_BG },
  searchWrapWide: { flex: 1, maxWidth: 480, marginLeft: 'auto' },
  searchWrapCompact: { width: '100%' },
  searchFocused: { borderColor: colors.primary, backgroundColor: colors.white, boxShadow: '0 0 0 3px rgba(11,47,125,0.10)' },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 14, color: colors.text },
  clearButton: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6ECF6' },

  /* Board */
  boardArea: { flex: 1 },
  board: { padding: BOARD_PADDING, gap: 16, alignItems: 'flex-start' },

  /* Loading skeleton */
  skeletonRow: { flexDirection: 'row', gap: 16, padding: BOARD_PADDING, overflow: 'hidden' },
  skeletonColumn: { width: 280, padding: 12, gap: 10, borderRadius: 14, backgroundColor: '#EEF3FA' },
  skeletonTitle: { width: 110, height: 14, borderRadius: 7, marginBottom: 4, backgroundColor: '#DCE6F4' },
  skeletonCard: { height: 84, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E4EBF5' },

  /* Empty + error states */
  stateCard: { alignSelf: 'center', alignItems: 'center', width: '100%', maxWidth: 420, marginTop: 56, padding: 26, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, boxShadow: '0 6px 20px rgba(11,47,125,0.08)' },
  stateIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  stateText: { fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center', marginBottom: 6 },
  errText: { fontSize: 13, lineHeight: 19, color: colors.danger, textAlign: 'center', marginBottom: 6 },
});
