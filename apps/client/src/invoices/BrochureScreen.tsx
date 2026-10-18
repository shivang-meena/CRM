import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrochureRecord } from '../api/salesDocuments';
import { useBrochureActions, useBrochures } from '../hooks/useSalesDocuments';

const BROCHURE_TYPES = ['Quotation', 'Invoice', 'PDF', 'DOC', 'DOCX', 'PPT', 'PPTX'];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

function generateRequestKey(): string {
  return `brochure_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getFileLabelFromUrl(
  fileUrl?: string | null,
  brochureName?: string,
  type?: string
): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:')) {
    const mimeMatch = fileUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    let ext = 'pdf';
    if (mime.includes('word') || mime.includes('msword')) ext = 'docx';
    else if (mime.includes('presentation') || mime.includes('powerpoint')) ext = 'pptx';
    else if (type && ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX'].includes(type.toUpperCase())) {
      ext = type.toLowerCase();
    }
    const safeName = (brochureName || 'brochure').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeName}.${ext}`;
  }
  try {
    const cleanUrl = fileUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'attached-brochure');
  } catch {
    return 'Attached Brochure';
  }
}

async function openOrDownloadBrochureFile(item: BrochureRecord): Promise<void> {
  const rawUrl = item.fileUrl?.trim();
  if (!rawUrl) return;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (rawUrl.startsWith('data:')) {
      try {
        const res = await fetch(rawUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const isPdfOrImage =
          blob.type === 'application/pdf' || blob.type.startsWith('image/');

        if (isPdfOrImage) {
          const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
          if (!opened) {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = getFileLabelFromUrl(rawUrl, item.brochureName, item.type);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = getFileLabelFromUrl(rawUrl, item.brochureName, item.type);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
      } catch (e) {
        console.error('Failed to open data URL attachment:', e);
      }
    }

    window.open(rawUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const supported = await Linking.canOpenURL(rawUrl);
  if (supported) {
    await Linking.openURL(rawUrl);
  }
}

export function BrochureScreen() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrochureRecord | null>(null);

  // Form states
  const [brochureName, setBrochureName] = useState('');
  const [type, setType] = useState('Quotation');
  const [startAfter, setStartAfter] = useState('1');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: brochures = [], isLoading } = useBrochures(search);
  const { create, update, remove } = useBrochureActions();

  const isSaving = create.isPending || update.isPending;

  // Pagination calculations
  const totalItems = brochures.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBrochures = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * rowsPerPage;
    return brochures.slice(startIdx, startIdx + rowsPerPage);
  }, [brochures, safeCurrentPage, rowsPerPage]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const endItemNumber = totalItems === 0 ? 0 : Math.min(safeCurrentPage * rowsPerPage, totalItems);

  const resetForm = () => {
    setEditing(null);
    setBrochureName('');
    setType('Quotation');
    setStartAfter('1');
    setTypeDropdownOpen(false);
    setFileName('');
    setFileUrl(null);
    setFormError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: BrochureRecord) => {
    setEditing(item);
    setBrochureName(item.brochureName || '');
    setType(item.type || 'Quotation');
    setStartAfter(item.startAfter ?? '1');
    setTypeDropdownOpen(false);
    setFileUrl(item.fileUrl ?? null);
    setFileName(
      item.fileUrl ? getFileLabelFromUrl(item.fileUrl, item.brochureName, item.type) : ''
    );
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    resetForm();
  };

  const handleTriggerFilePicker = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFormError('File size must be less than 15 MB.');
      return;
    }

    setFileName(file.name);
    setFormError('');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setFormError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrochure = async () => {
    const trimmedName = brochureName.trim();
    if (!trimmedName) {
      setFormError('Brochure Name is required.');
      return;
    }

    setFormError('');
    const payload = {
      requestKey: generateRequestKey(),
      brochureName: trimmedName,
      type: type || 'Quotation',
      startAfter: startAfter.trim() || '1',
      fileUrl: fileUrl || undefined,
      ...(editing?.version ? { version: editing.version } : {}),
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save brochure. Please try again.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  const handleDeleteBrochure = async (item: BrochureRecord) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${item.brochureName}"?`
      );
      if (!confirmed) return;
    }
    try {
      await remove.mutateAsync(item.id);
    } catch (err) {
      console.error('Failed to delete brochure:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hidden Web File Input */}
      {Platform.OS === 'web' &&
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept:
            '.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
          style: { display: 'none' },
          onChange: handleWebFileChange,
        })}

      {/* Top Header Card */}
      <View style={styles.topHeaderCard}>
        <Text style={styles.pageTitle}>Brochure</Text>

        <View style={styles.topBarRight}>
          {searchOpen && (
            <View style={styles.searchInputWrapper}>
              <Ionicons color="#56627C" name="search-outline" size={15} />
              <TextInput
                value={search}
                onChangeText={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Search brochure..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                >
                  <Ionicons color="#94A3B8" name="close-circle" size={15} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Light Search Icon Button matching screenshot */}
          <TouchableOpacity
            style={styles.searchIconBtn}
            onPress={() => setSearchOpen((prev) => !prev)}
            activeOpacity={0.75}
          >
            <Ionicons color="#0E1B3D" name="search-outline" size={17} />
          </TouchableOpacity>

          {/* Deep Purple "+ Add Brochure" Button matching screenshot */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenAddModal}
            style={styles.addBrochureBtn}
          >
            <Ionicons color="#FFFFFF" name="add" size={16} />
            <Text style={styles.addBrochureBtnText}>Add Brochure</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Table Card */}
      <View style={styles.tableCard}>
        <ScrollView
          contentContainerStyle={styles.tableScrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.tableContainer}>
            {/* Royal Purple Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.headerCell, styles.colNo]}>
                <Text style={styles.headerCellText}>No.</Text>
              </View>
              <View style={[styles.headerCell, styles.colActions]}>
                <Text style={styles.headerCellText}>Actions</Text>
              </View>
              <View style={[styles.headerCell, styles.colName]}>
                <Text style={styles.headerCellText}>Brochure Name</Text>
              </View>
              <View style={[styles.headerCell, styles.colType]}>
                <Text style={styles.headerCellText}>Type</Text>
              </View>
              <View style={[styles.headerCell, styles.colStartAfter]}>
                <Text style={styles.headerCellText}>Start After</Text>
              </View>
            </View>

            {/* Table Body Rows */}
            {isLoading ? (
              <View style={styles.emptyOrLoadingRow}>
                <ActivityIndicator color="#28104E" size="small" />
                <Text style={styles.emptyText}>Loading brochures...</Text>
              </View>
            ) : paginatedBrochures.length === 0 ? (
              <View style={styles.emptyOrLoadingRow}>
                <Text style={styles.emptyText}>No brochures found.</Text>
              </View>
            ) : (
              paginatedBrochures.map((item, idx) => {
                const rowNumber = (safeCurrentPage - 1) * rowsPerPage + idx + 1;
                const hasAttachment = Boolean(
                  item.fileUrl && item.fileUrl.trim().length > 0
                );

                return (
                  <View key={item.id} style={styles.tableBodyRow}>
                    {/* Column 1: No. */}
                    <View style={[styles.bodyCell, styles.colNo]}>
                      <Text style={styles.bodyCellText}>{rowNumber}</Text>
                    </View>

                    {/* Column 2: Actions (Edit, Delete, Attachment Paperclip + Badge '1') */}
                    <View style={[styles.bodyCell, styles.colActions]}>
                      <View style={styles.actionsGroup}>
                        {/* 1. Outlined Orange Edit Icon */}
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleOpenEditModal(item)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Edit ${item.brochureName}`}
                        >
                          <Ionicons color="#F59E0B" name="create-outline" size={18} />
                        </TouchableOpacity>

                        {/* 2. Outlined Red Delete Icon */}
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleDeleteBrochure(item)}
                          activeOpacity={0.7}
                          accessibilityLabel={`Delete ${item.brochureName}`}
                        >
                          <Ionicons color="#EF4444" name="trash-outline" size={18} />
                        </TouchableOpacity>

                        {/* 3. Tilted Grey Paperclip Icon with Circular Grey Badge '1' */}
                        {hasAttachment && (
                          <TouchableOpacity
                            style={styles.attachmentIconBtn}
                            onPress={() => openOrDownloadBrochureFile(item)}
                            activeOpacity={0.7}
                            accessibilityLabel={`Download attachment for ${item.brochureName}`}
                          >
                            <Ionicons
                              color="#4B5563"
                              name="attach-outline"
                              size={20}
                              style={styles.paperclipIcon}
                            />
                            <View style={styles.attachmentBadge}>
                              <Text style={styles.attachmentBadgeText}>1</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Column 3: Brochure Name */}
                    <View style={[styles.bodyCell, styles.colName]}>
                      <Text numberOfLines={1} style={styles.bodyCellText}>
                        {item.brochureName}
                      </Text>
                    </View>

                    {/* Column 4: Type */}
                    <View style={[styles.bodyCell, styles.colType]}>
                      <Text style={styles.bodyCellText}>
                        {item.type || 'Quotation'}
                      </Text>
                    </View>

                    {/* Column 5: Start After */}
                    <View style={[styles.bodyCell, styles.colStartAfter]}>
                      <Text style={styles.bodyCellText}>
                        {item.startAfter ?? '1'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Bottom Pagination Footer matching screenshot layout */}
        <View style={styles.paginationFooter}>
          {/* Left Side: Rows per page: 10 ▼   1 - 1 of 1 */}
          <View style={styles.paginationLeft}>
            <Text style={styles.paginationLabel}>Rows per page:</Text>

            <View style={styles.rowsPerPageSelectorWrap}>
              <TouchableOpacity
                style={styles.rowsPerPageTrigger}
                onPress={() => setRowsDropdownOpen((prev) => !prev)}
                activeOpacity={0.75}
              >
                <Text style={styles.rowsPerPageValue}>{rowsPerPage}</Text>
                <Ionicons color="#56627C" name="caret-down" size={11} />
              </TouchableOpacity>

              {rowsDropdownOpen && (
                <View style={styles.rowsDropdownMenu}>
                  {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                    <TouchableOpacity
                      key={sizeOption}
                      style={[
                        styles.rowsDropdownItem,
                        rowsPerPage === sizeOption && styles.rowsDropdownItemActive,
                      ]}
                      onPress={() => {
                        setRowsPerPage(sizeOption);
                        setCurrentPage(1);
                        setRowsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.rowsDropdownItemText,
                          rowsPerPage === sizeOption && styles.rowsDropdownItemTextActive,
                        ]}
                      >
                        {sizeOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.paginationRangeText}>
              {startItemNumber} - {endItemNumber} of {totalItems}
            </Text>
          </View>

          {/* Right Side: |<  <  [ 1 ] of 1  >  >| */}
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                safeCurrentPage <= 1 && styles.pageNavBtnDisabled,
              ]}
              disabled={safeCurrentPage <= 1}
              onPress={() => setCurrentPage(1)}
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  safeCurrentPage <= 1 && styles.pageNavBtnTextDisabled,
                ]}
              >
                {'|<'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                safeCurrentPage <= 1 && styles.pageNavBtnDisabled,
              ]}
              disabled={safeCurrentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <Ionicons
                color={safeCurrentPage <= 1 ? '#CBD5E1' : '#56627C'}
                name="chevron-back"
                size={14}
              />
            </TouchableOpacity>

            {/* Bordered Current Page Box [ 1 ] */}
            <View style={styles.currentPageBox}>
              <Text style={styles.currentPageBoxText}>{safeCurrentPage}</Text>
            </View>

            <Text style={styles.ofTotalPagesText}>of {totalPages}</Text>

            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                safeCurrentPage >= totalPages && styles.pageNavBtnDisabled,
              ]}
              disabled={safeCurrentPage >= totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <Ionicons
                color={safeCurrentPage >= totalPages ? '#CBD5E1' : '#56627C'}
                name="chevron-forward"
                size={14}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                safeCurrentPage >= totalPages && styles.pageNavBtnDisabled,
              ]}
              disabled={safeCurrentPage >= totalPages}
              onPress={() => setCurrentPage(totalPages)}
            >
              <Text
                style={[
                  styles.pageNavBtnText,
                  safeCurrentPage >= totalPages && styles.pageNavBtnTextDisabled,
                ]}
              >
                {'>|'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add / Edit Brochure Modal */}
      <Modal
        animationType="fade"
        onRequestClose={handleCloseModal}
        transparent
        visible={modalOpen}
      >
        <Pressable onPress={handleCloseModal} style={styles.modalBackdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Brochure' : 'Add Brochure'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                <Ionicons color="#56627C" name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {formError ? (
                <View style={styles.errorBanner}>
                  <Ionicons color="#B3261E" name="alert-circle-outline" size={16} />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              ) : null}

              {/* Brochure Name */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  Brochure Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  onChangeText={setBrochureName}
                  placeholder="Enter brochure name"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  value={brochureName}
                />
              </View>

              {/* Type Dropdown */}
              <View style={[styles.formGroup, { zIndex: 20 }]}>
                <Text style={styles.fieldLabel}>Type</Text>
                <TouchableOpacity
                  onPress={() => setTypeDropdownOpen((prev) => !prev)}
                  style={styles.dropdownTrigger}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{type}</Text>
                  <Ionicons
                    color="#56627C"
                    name={typeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                  />
                </TouchableOpacity>

                {typeDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {BROCHURE_TYPES.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setType(option);
                          setTypeDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownOption,
                          type === option && styles.dropdownOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            type === option && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Start After */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Start After</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setStartAfter}
                  placeholder="1"
                  placeholderTextColor="#94A3B8"
                  style={styles.textInput}
                  value={startAfter}
                />
              </View>

              {/* File Upload Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  Attach Brochure File (PDF, DOC, DOCX, PPT, PPTX)
                </Text>
                <View style={styles.fileUploadRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleTriggerFilePicker}
                    style={styles.filePickerBtn}
                  >
                    <Ionicons color="#28104E" name="cloud-upload-outline" size={17} />
                    <Text style={styles.filePickerBtnText}>
                      {fileUrl ? 'Change File' : 'Choose File'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.fileStatusBox}>
                    {fileUrl ? (
                      <View style={styles.attachedFilePill}>
                        <Ionicons color="#28104E" name="document-attach-outline" size={15} />
                        <Text numberOfLines={1} style={styles.attachedFileName}>
                          {fileName || 'File Attached'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setFileUrl(null);
                            setFileName('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          <Ionicons color="#EF4444" name="close-circle" size={16} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.noFileText}>No file chosen</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                disabled={isSaving}
                onPress={handleCloseModal}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isSaving}
                onPress={handleSaveBrochure}
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editing ? 'Update' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default BrochureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 14,
  },

  /* Top White Header Card matching screenshot */
  topHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    minWidth: 210,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E1B3D',
    paddingVertical: 0,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBrochureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#28104E',
    justifyContent: 'center',
  },
  addBrochureBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Table Section */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    overflow: 'hidden',
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  tableContainer: {
    width: '100%',
    minWidth: 720,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#28104E',
    minHeight: 40,
    alignItems: 'center',
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  headerCellText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3F0',
    minHeight: 46,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bodyCell: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  bodyCellText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '400',
  },

  /* Column Proportions matching screenshot */
  colNo: {
    width: 70,
  },
  colActions: {
    width: 140,
  },
  colName: {
    flex: 1.5,
    minWidth: 200,
  },
  colType: {
    flex: 1,
    minWidth: 140,
  },
  colStartAfter: {
    flex: 1.2,
    minWidth: 140,
  },

  /* Actions Column Icons (Outlined Edit, Outlined Trash, Paperclip + Badge '1') */
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIconBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  paperclipIcon: {
    transform: [{ rotate: '35deg' }],
  },
  attachmentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  attachmentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },

  emptyOrLoadingRow: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#56627C',
  },

  /* Pagination Footer matching screenshot */
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  rowsPerPageSelectorWrap: {
    position: 'relative',
  },
  rowsPerPageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  rowsPerPageValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  rowsDropdownMenu: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 50,
    minWidth: 50,
  },
  rowsDropdownItem: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  rowsDropdownItemActive: {
    backgroundColor: '#F1F5F9',
  },
  rowsDropdownItemText: {
    fontSize: 12,
    color: '#1E293B',
  },
  rowsDropdownItemTextActive: {
    fontWeight: '700',
    color: '#28104E',
  },
  paginationRangeText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageNavBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNavBtnDisabled: {
    opacity: 0.45,
  },
  pageNavBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pageNavBtnTextDisabled: {
    color: '#CBD5E1',
  },
  currentPageBox: {
    minWidth: 44,
    height: 26,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  currentPageBoxText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  ofTotalPagesText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 27, 61, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 18,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: '#B3261E',
    fontSize: 12,
    flex: 1,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E1B3D',
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E1B3D',
    backgroundColor: '#FFFFFF',
  },
  dropdownTrigger: {
    height: 38,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#0E1B3D',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownOptionSelected: {
    backgroundColor: '#F3E8FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#0E1B3D',
  },
  dropdownOptionTextSelected: {
    fontWeight: '700',
    color: '#28104E',
  },
  fileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#28104E',
    backgroundColor: '#F5F3FF',
  },
  filePickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28104E',
  },
  fileStatusBox: {
    flex: 1,
    minWidth: 150,
  },
  attachedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attachedFileName: {
    flex: 1,
    fontSize: 12,
    color: '#0E1B3D',
  },
  noFileText: {
    fontSize: 12,
    color: '#64748B',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#DCE3F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#56627C',
  },
  saveBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#28104E',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
