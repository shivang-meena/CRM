import React, { useState } from 'react';
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
import { colors } from '@/theme/colors';
import {
  usePaymentMethodActions,
  usePaymentMethods,
} from '@/hooks/useSalesDocuments';
import { PaymentMethodRecord } from '@/types/salesDocuments';

export function PaymentMethodScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<PaymentMethodRecord | null>(null);
  const [methodName, setMethodName] = useState('');

  const { data: methods = [], isLoading } = usePaymentMethods(search);
  const { create, update, remove } = usePaymentMethodActions();

  const openAddModal = () => {
    setEditingRecord(null);
    setMethodName('');
    setModalOpen(true);
  };

  const openEditModal = (rec: PaymentMethodRecord) => {
    setEditingRecord(rec);
    setMethodName(rec.method);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!methodName.trim()) return;
    const requestKey = `pm-${Date.now()}`;
    if (editingRecord) {
      await update.mutateAsync({
        id: editingRecord.id,
        payload: {
          requestKey,
          method: methodName.trim(),
          version: editingRecord.version,
        },
      });
    } else {
      await create.mutateAsync({
        requestKey,
        method: methodName.trim(),
      });
    }
    setModalOpen(false);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topHeaderCard}>
        <Text style={styles.pageTitle}>Payment Method</Text>
        <View style={styles.rightActions}>
          {searchOpen && (
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search method..."
              placeholderTextColor={colors.textMuted}
            />
          )}
          <Pressable
            style={styles.iconBoxBtn}
            onPress={() => setSearchOpen((o) => !o)}
          >
            <Ionicons name="search-outline" size={18} color="#0E1B3D" />
          </Pressable>
          <Pressable style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addBtnText}>Add Payment Method</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thText, styles.colNo]}>No.</Text>
          <Text style={[styles.thText, styles.colActions]}>Actions</Text>
          <Text style={[styles.thText, styles.colMethod]}>Method</Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : methods.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>There are no records to display</Text>
          </View>
        ) : (
          methods.map((item, idx) => (
            <View key={item.id} style={styles.tableBodyRow}>
              <Text style={[styles.tdText, styles.colNo]}>{idx + 1}</Text>
              <View style={[styles.colActions, styles.actionsCell]}>
                <Pressable onPress={() => openEditModal(item)}>
                  <Ionicons name="create-outline" size={18} color="#F59E0B" />
                </Pressable>
                <Pressable onPress={() => remove.mutate(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
              <Text style={[styles.tdText, styles.colMethod]}>
                {item.method}
              </Text>
            </View>
          ))
        )}

        {/* Pagination Footer matching Screenshot 4 */}
        <View style={styles.paginationFooter}>
          <View style={styles.rowsPerPageGroup}>
            <Text style={styles.paginationText}>Rows per page:</Text>
            <View style={styles.rowsPerPageBadge}>
              <Text style={styles.paginationText}>10</Text>
              <Ionicons name="caret-down" size={12} color="#56627C" />
            </View>
            <Text style={styles.paginationText}>
              1 - {methods.length} of {methods.length}
            </Text>
          </View>

          <View style={styles.pageNavGroup}>
            <Ionicons name="play-skip-back-outline" size={14} color="#CBD5E1" />
            <Ionicons name="chevron-back-outline" size={16} color="#CBD5E1" />
            <View style={styles.pageInputBox}>
              <Text style={styles.paginationText}>1</Text>
            </View>
            <Text style={styles.paginationText}>of 1</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={16}
              color="#CBD5E1"
            />
            <Ionicons
              name="play-skip-forward-outline"
              size={14}
              color="#CBD5E1"
            />
          </View>
        </View>
      </View>

      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingRecord ? 'Edit Payment Method' : 'Add Payment Method'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={methodName}
              onChangeText={setMethodName}
              placeholder="e.g. Internet Banking (NEFT/RTGS/IMPS)"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.addBtn} onPress={handleSave}>
                <Text style={styles.addBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  pageContent: { padding: 20, gap: 16, backgroundColor: colors.white },
  topHeaderCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: { fontSize: 20, fontWeight: '600', color: '#334155' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: {
    height: 36,
    width: 200,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: colors.white,
  },
  iconBoxBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2B2D6E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  tableCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2B2D6E',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3F0',
    backgroundColor: colors.white,
  },
  tdText: { fontSize: 13, color: '#334155' },
  colNo: { width: 80 },
  colActions: { width: 120 },
  colMethod: { flex: 1 },
  actionsCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyBox: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#334155' },
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  rowsPerPageGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowsPerPageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paginationText: { fontSize: 12, color: '#56627C' },
  pageNavGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageInputBox: {
    width: 44,
    height: 28,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,27,61,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    gap: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0E1B3D' },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
  },
  cancelBtnText: { fontSize: 13, color: '#56627C' },
});
