import React, { useMemo, useState } from 'react';
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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import InvoiceCompanyDetails from './InvoiceCompanyDetails';
import InvoiceSignature from './InvoiceSignature';
import { getDocumentCompanyProfile, getDocumentInvoiceSettings } from './companyProfile';
import { invoiceBranding } from './invoiceBranding';
import {
  useConvertQuotationToInvoice,
  useDeleteSalesDocument,
  useSalesDocuments,
} from '@/hooks/useSalesDocuments';
import {
  DEFAULT_DOCUMENT_CONFIG,
  SalesDocumentRecord,
  SalesDocumentType,
} from '@/types/salesDocuments';
import * as XLSX from 'xlsx';

interface InvoiceListScreenProps {
  mode: SalesDocumentType; // 'INVOICE' | 'QUOTATION'
}

function getDefaultMonthRangeIst() {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  return {
    fromIso: `${yyyy}-${mm}-01`,
    toIso: `${yyyy}-${mm}-${dd}`,
    display: `01-${mm}-${yyyy} To ${dd}-${mm}-${yyyy}`,
  };
}

function formatIstDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = ist.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatCurrency(val?: number | null) {
  return `₹${Number(val ?? 0).toFixed(2)}`;
}

export function InvoiceListScreen({ mode }: InvoiceListScreenProps) {
  const router = useRouter();
  const defaultRange = useMemo(() => getDefaultMonthRangeIst(), []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewRecord, setPreviewRecord] =
    useState<SalesDocumentRecord | null>(null);
  const previewCompany = useMemo(
    () => previewRecord ? getDocumentCompanyProfile(previewRecord) : null,
    [previewRecord],
  );
  const previewInvoiceSettings = previewRecord ? getDocumentInvoiceSettings(previewRecord) : null;
  const printStyles = useMemo(
    () => invoiceBranding(styles, previewCompany), [previewCompany],
  );
  const [paymentModalRecord, setPaymentModalRecord] =
    useState<SalesDocumentRecord | null>(null);

  // 1. Accordion & Pagination State
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 2. Toggle Single/Multiple Row Expansion
  const toggleExpandRow = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // 3. Format GST Mode for Display
  const formatGstLabel = (gstMode?: string) => {
    if (!gstMode || gstMode === 'NON_GST') return 'Non GST';
    if (gstMode === 'IGST') return 'IGST';
    if (gstMode === 'SGST_CGST') return 'SGST / CGST';
    return gstMode;
  };

  // 4. Format Currency with ₹ Symbol
  const formatInr = (value?: number | string) => {
    const num = Number(value ?? 0);
    return `₹${num.toFixed(2)}`;
  };

  const {
    data: records = [],
    isLoading,
    refetch,
  } = useSalesDocuments({
    type: mode,
    paymentStatus:
      mode === 'INVOICE' && paymentStatus !== 'ALL'
        ? paymentStatus
        : undefined,
    search: search.trim() || undefined,
  });

  const deleteMutation = useDeleteSalesDocument();
  const convertMutation = useConvertQuotationToInvoice();

  // 5. Pagination Calculations
  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedRecords = records.slice(startIndex, startIndex + rowsPerPage);
  const rangeStart = totalRecords === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + rowsPerPage, totalRecords);

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDownloadPdf = () => {
    const target =
      selectedIds.length > 0
        ? records.find((r) => selectedIds.includes(r.id)) || records[0]
        : records[0];

    if (!target) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`No ${mode === 'QUOTATION' ? 'quotation' : 'invoice'} records available to download.`);
      }
      return;
    }

    setPreviewRecord(target);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  const handleExportExcel = () => {
    const dataset =
      selectedIds.length > 0
        ? records.filter((r) => selectedIds.includes(r.id))
        : records;

    if (!dataset || dataset.length === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`No ${mode === 'QUOTATION' ? 'quotation' : 'invoice'} records available to export.`);
      }
      return;
    }

    const docTypeLabel = mode === 'QUOTATION' ? 'Quotation' : 'Invoice';
    const excelRows = dataset.map((row, index) => ({
      'No.': index + 1,
      [`${docTypeLabel} No`]: row.documentNo,
      'Company Name': row.companyName || '-',
      'Customer Name': row.customerName || '-',
      'Mobile': row.mobile || '-',
      'Date': formatIstDate(row.issueDate),
      'Next Payment Date': row.nextPaymentDate ? formatIstDate(row.nextPaymentDate) : '-',
      'GST Type': formatGstLabel(row.gstMode || row.gstType),
      'Total Amount': Number(row.grandTotal || 0).toFixed(2),
      'Received Amount': Number(row.paidAmount || 0).toFixed(2),
      'Due Amount': Number(row.dueAmount || 0).toFixed(2),
      'Status': row.paymentStatus || 'UNPAID',
      'Created By': row.createdByName || 'System User',
    }));

    try {
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${docTypeLabel}s`);

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const filename = `${docTypeLabel}s_Export_${dateStr}.xlsx`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        XLSX.writeFile(workbook, filename);
      }
    } catch (err: any) {
      console.error('Failed to export excel:', err);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Failed to export Excel file: ${err?.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {/* Top Title & Action Bar Card */}
      <View style={styles.topHeaderCard}>
        <Text style={styles.pageTitle}>
          {mode === 'QUOTATION' ? 'Quotation' : 'Invoice'}
        </Text>

        <View style={styles.headerRightActions}>
          {searchOpen && (
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search No, Company, Customer..."
              placeholderTextColor={colors.textMuted}
            />
          )}
          <Pressable
            style={styles.iconBoxBtn}
            onPress={() => setSearchOpen((o) => !o)}
          >
            <Ionicons name="search-outline" size={18} color="#0E1B3D" />
          </Pressable>

          <Pressable style={styles.reportsDropdownBtn}>
            <Ionicons name="document-text-outline" size={16} color="#56627C" />
            <Text style={styles.reportsBtnText}>Reports</Text>
            <Ionicons name="chevron-down" size={14} color="#56627C" />
          </Pressable>

          <Pressable
            style={styles.navySquareBtn}
            onPress={handleDownloadPdf}
            accessibilityLabel="Download PDF"
          >
            <Ionicons name="download-outline" size={18} color={colors.white} />
          </Pressable>

          <Pressable
            style={styles.navySquareBtn}
            onPress={handleExportExcel}
            accessibilityLabel="Export Excel"
          >
            <Ionicons
              name="cloud-download-outline"
              size={18}
              color={colors.white}
            />
          </Pressable>

          <Pressable style={styles.filterDropdownBtn}>
            <Ionicons name="options-outline" size={16} color="#0E1B3D" />
            <Text style={styles.filterBtnText}>Filter</Text>
            <Ionicons name="chevron-down" size={14} color="#0E1B3D" />
          </Pressable>
        </View>
      </View>

      {/* Sub-Toolbar Card: Create Button, Date Range, Status Filter */}
      <View style={styles.subToolbarCard}>
        <Pressable
          style={styles.createPrimaryBtn}
          onPress={() =>
            router.push(
              mode === 'QUOTATION'
                ? '/invoice/add?type=QUOTATION'
                : '/invoice/add',
            )
          }
        >
          <Text style={styles.createPrimaryBtnText}>
            {mode === 'QUOTATION' ? 'Create Quotation' : 'Create Invoice'}
          </Text>
        </Pressable>

        <Text style={styles.dateRangeText}>{defaultRange.display}</Text>

        {mode === 'INVOICE' ? (
          <View style={styles.statusFilterWrap}>
            <Pressable
              style={styles.statusDropdownTrigger}
              onPress={() => setStatusMenuOpen((o) => !o)}
            >
              <Text style={styles.statusDropdownText}>
                {paymentStatus === 'ALL'
                  ? 'All Statuses'
                  : paymentStatus === 'PARTIALLY_PAID'
                  ? 'Partially Paid'
                  : paymentStatus}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#56627C" />
            </Pressable>
            {statusMenuOpen && (
              <View style={styles.statusDropdownMenu}>
                {[
                  { key: 'ALL', label: 'All Statuses' },
                  { key: 'UNPAID', label: 'Unpaid' },
                  { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
                  { key: 'PAID', label: 'Paid' },
                ].map((st) => (
                  <Pressable
                    key={st.key}
                    style={[
                      styles.statusOption,
                      paymentStatus === st.key && styles.statusOptionActive,
                    ]}
                    onPress={() => {
                      setPaymentStatus(st.key);
                      setStatusMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        paymentStatus === st.key &&
                          styles.statusOptionTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ width: 120 }} />
        )}
      </View>

      {/* Table Card */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 1400 }}>
            {/* Table Header Row */}
            <View style={styles.tableHeaderRow}>
              {/* Header Checkbox */}
              <Pressable onPress={toggleSelectAll} style={styles.cellCheck}>
                <View
                  style={[
                    styles.checkboxHeader,
                    records.length > 0 &&
                      selectedIds.length === records.length &&
                      styles.checkboxChecked,
                  ]}
                />
              </Pressable>

              {/* REQUIRED: Empty Spacer for Chevron Column */}
              <View style={styles.cellExpand} />

              <Text style={[styles.thText, styles.cellNo]}>No.</Text>
              <Text style={[styles.thText, styles.cellActions]}>Actions</Text>
              <Text style={[styles.thText, styles.cellDocNo]}>
                {mode === 'QUOTATION' ? 'Quotation No.' : 'Invoice No.'}
              </Text>
              <Text style={[styles.thText, styles.cellCompany]}>Company Name</Text>
              <Text style={[styles.thText, styles.cellCustomer]}>Customer Name</Text>
              <Text style={[styles.thText, styles.cellMobile]}>Mobile</Text>
              <Text style={[styles.thText, styles.cellDate]}>Date</Text>
              <Text style={[styles.thText, styles.cellDate]}>Next Payment ...</Text>
              <Text style={[styles.thText, styles.cellGst]}>GST Type</Text>
              <Text style={[styles.thText, styles.cellCreatedBy]}>Created By</Text>
            </View>

            {/* Table Body */}
            {isLoading ? (
              <View style={styles.emptyStateBox}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateText}>
                  There are no records to display
                </Text>
              </View>
            ) : (
              paginatedRecords.map((row, idx) => {
                const isExpanded = expandedRowIds.includes(row.id);
                const isSelected = selectedIds.includes(row.id);
                const serialNo = startIndex + idx + 1;
                const docLabel = mode === 'QUOTATION' ? 'Quotation No:' : 'Invoice No:';

                return (
                  <React.Fragment key={row.id}>
                    {/* MAIN TABLE ROW - CLICKABLE ACROSS ENTIRE ROW / CARD */}
                    <Pressable
                      style={[
                        styles.tableBodyRow,
                        isExpanded && styles.tableBodyRowExpanded,
                      ]}
                      onPress={() => toggleExpandRow(row.id)}
                    >
                      {/* 1. Checkbox Cell */}
                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          toggleRow(row.id);
                        }}
                        style={styles.cellCheck}
                      >
                        <View
                          style={[
                            styles.checkboxBody,
                            isSelected && styles.checkboxChecked,
                          ]}
                        />
                      </Pressable>

                      {/* 2. Accordion Chevron Cell */}
                      <View style={styles.cellExpand}>
                        <Ionicons
                          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                          size={16}
                          color="#56627C"
                        />
                      </View>

                      {/* 3. Row Index */}
                      <View style={styles.cellNo}>
                        <Text style={styles.tdText}>{serialNo}</Text>
                      </View>

                      {/* 4. Quick Action Icons */}
                      <View style={[styles.cellActions, styles.actionsRow]}>
                        {/* View / Preview */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setPreviewRecord(row);
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#2563EB" name="eye-outline" size={16} />
                        </Pressable>

                        {/* Sync / Convert */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            refetch();
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#3B82F6" name="sync-outline" size={16} />
                        </Pressable>

                        {/* Edit */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            router.push(
                              mode === 'QUOTATION'
                                ? `/invoice/add?type=QUOTATION&id=${row.id}`
                                : `/invoice/add?id=${row.id}`,
                            );
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#F59E0B" name="create-outline" size={16} />
                        </Pressable>

                        {/* Download / Cloud PDF */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setPreviewRecord(row);
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#16A34A" name="cloud-download-outline" size={16} />
                        </Pressable>

                        {/* WhatsApp Share */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            if (row.mobile) {
                              Linking.openURL(
                                `https://wa.me/${row.mobile.replace(/\D/g, '')}`,
                              );
                            }
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#25D366" name="logo-whatsapp" size={16} />
                        </Pressable>

                        {/* Email Action */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            if (row.email) {
                              const docTypeName = mode === 'QUOTATION' ? 'Quotation' : 'Invoice';
                              const subject = `${docTypeName} #${row.documentNo}${row.sellerCompanyName ? ` from ${row.sellerCompanyName}` : ''}`;
                              const body = `Dear ${row.customerName},\n\nPlease find your ${docTypeName.toLowerCase()} details below:\nDocument No: ${row.documentNo}\nIssue Date: ${formatIstDate(row.issueDate)}\nTotal Amount: ${formatInr(row.grandTotal)}\nDue Amount: ${formatInr(row.dueAmount)}\n\nThank you for your business!`;
                              Linking.openURL(
                                `mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                              );
                            } else {
                              alert(`No email address registered for customer "${row.customerName}".`);
                            }
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#16A34A" name="mail-outline" size={16} />
                        </Pressable>

                        {/* Payment / Card Action */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setPaymentModalRecord(row);
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#B91C1C" name="card-outline" size={16} />
                        </Pressable>

                        {/* Delete Action */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            deleteMutation.mutate(row.id);
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#EF4444" name="trash-outline" size={16} />
                        </Pressable>

                        {/* Duplicate / Copy Action */}
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            router.push(
                              mode === 'QUOTATION'
                                ? `/invoice/add?type=QUOTATION&cloneId=${row.id}`
                                : `/invoice/add?cloneId=${row.id}`,
                            );
                          }}
                          hitSlop={4}
                        >
                          <Ionicons color="#D946EF" name="copy-outline" size={16} />
                        </Pressable>
                      </View>

                      {/* 5. Standard Columns */}
                      <Text numberOfLines={1} style={[styles.tdTextBold, styles.cellDocNo]}>
                        {row.documentNo}
                      </Text>
                      <Text numberOfLines={1} style={[styles.tdText, styles.cellCompany]}>
                        {row.companyName || '-'}
                      </Text>
                      <Text numberOfLines={1} style={[styles.tdText, styles.cellCustomer]}>
                        {row.customerName}
                      </Text>
                      <Text numberOfLines={1} style={[styles.tdText, styles.cellMobile]}>
                        {row.mobile}
                      </Text>
                      <Text style={[styles.tdText, styles.cellDate]}>
                        {formatIstDate(row.issueDate)}
                      </Text>
                      <Text style={[styles.tdText, styles.cellDate]}>
                        {row.nextPaymentDate ? formatIstDate(row.nextPaymentDate) : '-'}
                      </Text>
                      <Text style={[styles.tdText, styles.cellGst]}>
                        {formatGstLabel(row.gstMode || row.gstType)}
                      </Text>
                      <Text numberOfLines={1} style={[styles.tdText, styles.cellCreatedBy]}>
                        {row.createdByName || 'System User'}
                      </Text>
                    </Pressable>

                    {/* COLLAPSIBLE SUB-DETAIL ACCORDION CARD */}
                    {isExpanded && (
                      <View style={styles.expandedContainer}>
                        <View style={styles.expandedGrid}>
                          {/* Left Column */}
                          <View style={styles.expandedColumnLeft}>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>{docLabel}</Text>
                              <Text style={styles.detailValue}>{row.documentNo}</Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Company Name:</Text>
                              <Text style={styles.detailValue}>
                                {row.companyName && row.companyName !== '-'
                                  ? row.companyName
                                  : ''}
                              </Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Customer Name:</Text>
                              <Text style={styles.detailValue}>{row.customerName}</Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Mobile :</Text>
                              <Text style={styles.detailValue}>{row.mobile}</Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Date :</Text>
                              <Text style={styles.detailValue}>
                                {formatIstDate(row.issueDate)}
                              </Text>
                            </View>
                          </View>

                          {/* Right Column */}
                          <View style={styles.expandedColumnRight}>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>GST Type :</Text>
                              <Text style={styles.detailValue}>
                                {formatGstLabel(row.gstMode || row.gstType)}
                              </Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Amount:</Text>
                              <Text style={styles.detailValue}>
                                {formatInr(row.grandTotal)}
                              </Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Due Amount:</Text>
                              <Text style={styles.detailValue}>
                                {formatInr(row.dueAmount)}
                              </Text>
                            </View>
                            <View style={styles.detailItemRow}>
                              <Text style={styles.detailLabel}>Created By :</Text>
                              <Text style={styles.detailValue}>
                                {row.createdByName || 'System User'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Horizontal Accent Scroll Track Bar */}
        <View style={styles.purpleTrackBar} />

        {/* Pagination Footer */}
        <View style={styles.paginationFooter}>
          <View style={styles.paginationLeft}>
            <Text style={styles.paginationLabel}>Rows per page:</Text>
            <Pressable
              onPress={() =>
                setRowsPerPage((prev) =>
                  prev === 10 ? 25 : prev === 25 ? 50 : 10,
                )
              }
              style={styles.rowsPerPageSelector}
            >
              <Text style={styles.rowsPerPageText}>{rowsPerPage}</Text>
              <Ionicons color="#56627C" name="caret-down" size={12} />
            </Pressable>
            <Text style={styles.paginationRangeText}>
              {rangeStart} - {rangeEnd} of {totalRecords}
            </Text>
          </View>

          <View style={styles.paginationRight}>
            <Pressable
              disabled={safePage <= 1}
              onPress={() => setCurrentPage(1)}
              style={[
                styles.pageNavBtn,
                safePage <= 1 && styles.pageNavBtnDisabled,
              ]}
            >
              <Ionicons
                color="#56627C"
                name="play-skip-back-outline"
                size={14}
              />
            </Pressable>

            <Pressable
              disabled={safePage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={[
                styles.pageNavBtn,
                safePage <= 1 && styles.pageNavBtnDisabled,
              ]}
            >
              <Ionicons color="#56627C" name="chevron-back" size={15} />
            </Pressable>

            <View style={styles.pageNumberBox}>
              <Text style={styles.pageNumberText}>{safePage}</Text>
            </View>
            <Text style={styles.paginationLabel}>of {totalPages}</Text>

            <Pressable
              disabled={safePage >= totalPages}
              onPress={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              style={[
                styles.pageNavBtn,
                safePage >= totalPages && styles.pageNavBtnDisabled,
              ]}
            >
              <Ionicons color="#56627C" name="chevron-forward" size={15} />
            </Pressable>

            <Pressable
              disabled={safePage >= totalPages}
              onPress={() => setCurrentPage(totalPages)}
              style={[
                styles.pageNavBtn,
                safePage >= totalPages && styles.pageNavBtnDisabled,
              ]}
            >
              <Ionicons
                color="#56627C"
                name="play-skip-forward-outline"
                size={14}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Payment Details Modal matching Screenshot 2 */}
      <Modal
        visible={Boolean(paymentModalRecord)}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalRecord(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPaymentModalRecord(null)}
        >
          <Pressable
            style={styles.payModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Purple Modal Header */}
            <View style={styles.payModalHeader}>
              <Text style={styles.payModalTitle}>Payment Details</Text>
              <Pressable
                onPress={() => setPaymentModalRecord(null)}
                style={styles.payModalCloseBox}
              >
                <Ionicons name="close" size={18} color="#0E1B3D" />
              </Pressable>
            </View>

            {paymentModalRecord && (
              <View style={styles.payModalBody}>
                {/* Top Info Bar: Customer on left, Summary on right */}
                <View style={styles.payModalInfoRow}>
                  <View style={styles.payModalCustomerCol}>
                    <Text style={styles.payModalCustomerName}>
                      {paymentModalRecord.customerName}
                    </Text>
                  </View>

                  <View style={styles.payModalSummaryCol}>
                    <Text style={styles.payModalMetaLine}>
                      <Text style={styles.payModalMetaLabel}>Invoice No : </Text>
                      <Text style={styles.payModalMetaVal}>#{paymentModalRecord.documentNo}</Text>
                    </Text>
                    <Text style={styles.payModalMetaLine}>
                      <Text style={styles.payModalMetaLabel}>Total Amount : </Text>
                      <Text style={styles.payModalMetaVal}>{formatInr(paymentModalRecord.grandTotal)}</Text>
                    </Text>
                    <Text style={styles.payModalMetaLine}>
                      <Text style={styles.payModalMetaLabel}>Due Amount : </Text>
                      <Text style={styles.payModalMetaVal}>{formatInr(paymentModalRecord.dueAmount)}</Text>
                    </Text>
                  </View>
                </View>

                {/* Payments Table */}
                <View style={styles.payModalTable}>
                  {/* Table Header */}
                  <View style={styles.payModalTableHeader}>
                    <Text style={[styles.payModalTh, styles.payColIndex]}>INDEX</Text>
                    <Text style={[styles.payModalTh, styles.payColDate]}>DATE</Text>
                    <Text style={[styles.payModalTh, styles.payColMethod]}>METHOD</Text>
                    <Text style={[styles.payModalTh, styles.payColAmount]}>AMOUNT</Text>
                    <Text style={[styles.payModalTh, styles.payColActions]}>ACTIONS</Text>
                  </View>

                  {/* Table Rows */}
                  {paymentModalRecord.paidAmount > 0 ? (
                    <View style={styles.payModalTableRow}>
                      <Text style={[styles.payModalTd, styles.payColIndex]}>1</Text>
                      <Text style={[styles.payModalTd, styles.payColDate]}>
                        {formatIstDate(paymentModalRecord.paymentDate || paymentModalRecord.issueDate)}
                      </Text>
                      <Text style={[styles.payModalTd, styles.payColMethod]}>
                        {paymentModalRecord.paymentMethodName || 'Cash / Direct'}
                      </Text>
                      <Text style={[styles.payModalTdBold, styles.payColAmount]}>
                        {formatInr(paymentModalRecord.paidAmount)}
                      </Text>
                      <View style={[styles.payColActions, { flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={styles.payBadgePaid}>
                          <Text style={styles.payBadgePaidText}>Recorded</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.payModalEmptyRow}>
                      <Text style={styles.payModalEmptyText}>No payment records found.</Text>
                    </View>
                  )}
                </View>

                {/* Footer with Cancel Button */}
                <View style={styles.payModalFooter}>
                  <Pressable
                    style={styles.payModalCancelBtn}
                    onPress={() => setPaymentModalRecord(null)}
                  >
                    <Text style={styles.payModalCancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full Screen Printable Preview Modal */}
      <Modal
        visible={Boolean(previewRecord)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewRecord(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.previewModalCard}>
            {/* Modal Top Bar */}
            <View style={styles.previewHeaderBar}>
              <View>
                <Text style={styles.previewHeaderTitle}>
                  {mode === 'QUOTATION'
                    ? 'Quotation Preview'
                    : 'Invoice Preview'}
                </Text>
                <Text style={styles.previewHeaderSub}>
                  {previewRecord?.documentNo}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {Platform.OS === 'web' && (
                  <Pressable
                    style={styles.printNavyBtn}
                    onPress={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                  >
                    <Ionicons
                      name="print-outline"
                      size={16}
                      color={colors.white}
                    />
                    <Text style={styles.printNavyBtnText}>
                      Print / Save PDF
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.closeOutlineBtn}
                  onPress={() => setPreviewRecord(null)}
                >
                  <Text style={styles.closeOutlineBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>

            {/* Document Content */}
            {previewRecord && (
              <ScrollView style={{ maxHeight: 600 }}>
                <View style={printStyles.printableDocument}>
                  {/* Top Company & Bank Info Row */}
                  <View style={printStyles.docHeaderRow}>
                    <View style={printStyles.companyInfoLeft}>
                      {previewCompany ? <InvoiceCompanyDetails profile={previewCompany} /> : null}
                    </View>

                    <View style={printStyles.bankInfoRight}>
                      <Text style={printStyles.bankInfoTitle}>Payment Details</Text>
                      <Text style={printStyles.bankDetailLine}>
                        Bank:{' '}
                        <Text style={printStyles.bankDetailVal}>
                          {previewRecord.type === 'INVOICE' ? previewRecord.bankName ?? '' : previewRecord.bankName || DEFAULT_DOCUMENT_CONFIG.bankName}
                        </Text>
                      </Text>
                      <Text style={printStyles.bankDetailLine}>
                        A/C:{' '}
                        <Text style={printStyles.bankDetailVal}>
                          {previewRecord.type === 'INVOICE' ? previewRecord.bankAccountNo ?? '' : previewRecord.bankAccountNo || DEFAULT_DOCUMENT_CONFIG.accountNo}
                        </Text>
                      </Text>
                      <Text style={printStyles.bankDetailLine}>
                        IFSC:{' '}
                        <Text style={printStyles.bankDetailVal}>
                          {previewRecord.type === 'INVOICE' ? previewRecord.bankIfsc ?? '' : previewRecord.bankIfsc || DEFAULT_DOCUMENT_CONFIG.ifscCode}
                        </Text>
                      </Text>
                      {previewInvoiceSettings?.paymentUpiId ? <Text style={printStyles.bankDetailLine}>
                        UPI ID: <Text style={printStyles.bankDetailVal}>{previewInvoiceSettings.paymentUpiId}</Text>
                      </Text> : null}
                    </View>
                  </View>

                  <View style={printStyles.docDivider} />

                  {/* Document Meta Row */}
                  <View style={printStyles.docMetaBar}>
                    <View>
                      <Text style={printStyles.metaLabel}>DOCUMENT TYPE</Text>
                      <Text style={printStyles.metaValue}>
                        {previewRecord.type === 'QUOTATION'
                          ? 'QUOTATION'
                          : 'TAX INVOICE'}
                      </Text>
                    </View>
                    <View>
                      <Text style={printStyles.metaLabel}>DOCUMENT NO</Text>
                      <Text style={printStyles.metaValue}>
                        {previewRecord.documentNo}
                      </Text>
                    </View>
                    <View>
                      <Text style={printStyles.metaLabel}>DATE</Text>
                      <Text style={printStyles.metaValue}>
                        {formatIstDate(previewRecord.issueDate)}
                      </Text>
                    </View>
                    {previewRecord.nextPaymentDate && (
                      <View>
                        <Text style={printStyles.metaLabel}>NEXT PAYMENT</Text>
                        <Text style={printStyles.metaValue}>
                          {formatIstDate(previewRecord.nextPaymentDate)}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={printStyles.metaLabel}>GST MODE</Text>
                      <Text style={printStyles.metaValue}>
                        {previewRecord.gstMode === 'NON_GST'
                          ? 'Non GST'
                          : previewRecord.gstMode === 'IGST'
                          ? 'IGST'
                          : 'SGST / CGST'}{' '}
                        {previewRecord.inclusiveGst ? '(Inclusive GST)' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={printStyles.docDivider} />

                  {/* Customer / Bill To Section */}
                  <View style={printStyles.customerBox}>
                    <Text style={printStyles.customerHeading}>BILL TO</Text>
                    <Text style={printStyles.customerNameMain}>
                      {previewRecord.customerName}
                    </Text>
                    {Boolean(previewRecord.companyName) && (
                      <Text style={printStyles.customerSubText}>
                        Company: {previewRecord.companyName}
                      </Text>
                    )}
                    {Boolean(previewRecord.mobile) && (
                      <Text style={printStyles.customerSubText}>
                        Phone: {previewRecord.mobile}
                      </Text>
                    )}
                    {Boolean(previewRecord.email) && (
                      <Text style={printStyles.customerSubText}>
                        Email: {previewRecord.email}
                      </Text>
                    )}
                    {Boolean(previewRecord.address) && (
                      <Text style={printStyles.customerSubText}>
                        Address: {previewRecord.address}
                      </Text>
                    )}
                  </View>

                  {/* Line Items Table */}
                  <View style={printStyles.itemTable}>
                    <View style={printStyles.itemTableHeader}>
                      <Text style={[printStyles.itemTh, { width: 36 }]}>#</Text>
                      <Text style={[printStyles.itemTh, { flex: 3 }]}>Item</Text>
                      {previewRecord.gstMode !== 'NON_GST' && (
                        <Text style={[printStyles.itemTh, { width: 90 }]}>
                          HSN/SAC
                        </Text>
                      )}
                      <Text
                        style={[
                          printStyles.itemTh,
                          { width: 80, textAlign: 'right' },
                        ]}
                      >
                        Cost
                      </Text>
                      <Text
                        style={[
                          printStyles.itemTh,
                          { width: 50, textAlign: 'center' },
                        ]}
                      >
                        Qty
                      </Text>
                      <Text
                        style={[
                          printStyles.itemTh,
                          { width: 80, textAlign: 'right' },
                        ]}
                      >
                        Discount
                      </Text>
                      <Text
                        style={[
                          printStyles.itemTh,
                          { width: 90, textAlign: 'right' },
                        ]}
                      >
                        Sub Total
                      </Text>
                      {previewRecord.gstMode !== 'NON_GST' && (
                        <Text
                          style={[
                            printStyles.itemTh,
                            { width: 100, textAlign: 'right' },
                          ]}
                        >
                          Tax
                        </Text>
                      )}
                      <Text
                        style={[
                          printStyles.itemTh,
                          { width: 100, textAlign: 'right' },
                        ]}
                      >
                        Total
                      </Text>
                    </View>

                    {previewRecord.items.map((item, idx) => (
                      <View key={item.id || idx} style={printStyles.itemTableRow}>
                        <Text style={[printStyles.itemTd, { width: 36 }]}>
                          {idx + 1}
                        </Text>
                        <View style={{ flex: 3 }}>
                          <Text style={printStyles.itemTdBold}>
                            {item.productName}
                          </Text>
                          {Boolean(item.comments) && (
                            <Text style={printStyles.itemTdComments}>
                              {item.comments}
                            </Text>
                          )}
                        </View>
                        {previewRecord.gstMode !== 'NON_GST' && (
                          <Text style={[printStyles.itemTd, { width: 90 }]}>
                            {item.hsnSac || '-'}
                          </Text>
                        )}
                        <Text
                          style={[
                            printStyles.itemTd,
                            { width: 80, textAlign: 'right' },
                          ]}
                        >
                          {formatCurrency(item.unitPrice)}
                        </Text>
                        <Text
                          style={[
                            printStyles.itemTd,
                            { width: 50, textAlign: 'center' },
                          ]}
                        >
                          {item.quantity}
                        </Text>
                        <Text
                          style={[
                            printStyles.itemTd,
                            { width: 80, textAlign: 'right' },
                          ]}
                        >
                          {Boolean(item.discountAmount && item.discountAmount > 0)
                            ? formatCurrency(item.discountAmount)
                            : '-'}
                        </Text>
                        <Text
                          style={[
                            printStyles.itemTd,
                            { width: 90, textAlign: 'right' },
                          ]}
                        >
                          {formatCurrency(item.netAmount || item.grossAmount)}
                        </Text>
                        {previewRecord.gstMode !== 'NON_GST' && (
                          <Text
                            style={[
                              printStyles.itemTd,
                              { width: 100, textAlign: 'right' },
                            ]}
                          >
                            {formatCurrency(item.taxAmount)}
                          </Text>
                        )}
                        <Text
                          style={[
                            printStyles.itemTdBold,
                            { width: 100, textAlign: 'right' },
                          ]}
                        >
                          {formatCurrency(item.totalAmount)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Bottom Financial Summary & Signature Row */}
                  <View style={printStyles.bottomFinancialRow}>
                    {/* Left: Terms & Signatory */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={printStyles.termsHeading}>
                        Terms &amp; Conditions
                      </Text>
                      <Text style={printStyles.termsBody}>
                        {previewRecord.type === 'INVOICE' ? previewRecord.termsAndConditions ?? '' : previewRecord.termsAndConditions || DEFAULT_DOCUMENT_CONFIG.defaultTerms}
                      </Text>

                      <View style={printStyles.modalSignatureBox}>
                        {previewRecord.type === 'INVOICE' ? <InvoiceSignature signature={previewInvoiceSettings?.signature} name={previewRecord.signatoryName} color={previewCompany?.fontColor} /> : <>
                          <Text style={printStyles.modalSignatureCursive}>{previewRecord.signatoryName || DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
                          <Text style={printStyles.modalSignatorySub}>Authorized Signatory</Text>
                        </>}
                      </View>
                    </View>

                    {/* Right: Calculations Breakdown */}
                    <View style={printStyles.summaryCard}>
                      <View style={printStyles.summaryLine}>
                        <Text style={printStyles.summaryLineLabel}>
                          Gross Subtotal:
                        </Text>
                        <Text style={printStyles.summaryLineVal}>
                          {formatCurrency(previewRecord.grossSubtotal)}
                        </Text>
                      </View>

                      {previewRecord.discountTotal > 0 && (
                        <View style={printStyles.summaryLine}>
                          <Text style={printStyles.summaryLineLabel}>
                            Total Discount:
                          </Text>
                          <Text style={printStyles.summaryLineVal}>
                            - {formatCurrency(previewRecord.discountTotal)}
                          </Text>
                        </View>
                      )}

                      <View style={printStyles.summaryLine}>
                        <Text style={printStyles.summaryLineLabel}>
                          Taxable Subtotal:
                        </Text>
                        <Text style={printStyles.summaryLineVal}>
                          {formatCurrency(previewRecord.subtotal)}
                        </Text>
                      </View>

                      {previewRecord.gstMode === 'IGST' && (
                        <View style={printStyles.summaryLine}>
                          <Text style={printStyles.summaryLineLabel}>
                            IGST Total:
                          </Text>
                          <Text style={printStyles.summaryLineVal}>
                            {formatCurrency(previewRecord.igstTotal)}
                          </Text>
                        </View>
                      )}

                      {previewRecord.gstMode === 'SGST_CGST' && (
                        <>
                          <View style={printStyles.summaryLine}>
                            <Text style={printStyles.summaryLineLabel}>
                              SGST Total:
                            </Text>
                            <Text style={printStyles.summaryLineVal}>
                              {formatCurrency(previewRecord.sgstTotal)}
                            </Text>
                          </View>
                          <View style={printStyles.summaryLine}>
                            <Text style={printStyles.summaryLineLabel}>
                              CGST Total:
                            </Text>
                            <Text style={printStyles.summaryLineVal}>
                              {formatCurrency(previewRecord.cgstTotal)}
                            </Text>
                          </View>
                        </>
                      )}

                      {previewRecord.gstMode !== 'NON_GST' && (
                        <View style={printStyles.summaryLine}>
                          <Text style={printStyles.summaryLineLabel}>
                            Total Tax:
                          </Text>
                          <Text style={printStyles.summaryLineVal}>
                            {formatCurrency(previewRecord.taxTotal)}
                          </Text>
                        </View>
                      )}

                      <View style={[printStyles.summaryLine, printStyles.grandTotalLine]}>
                        <Text style={printStyles.grandTotalLabel}>Grand Total:</Text>
                        <Text style={printStyles.grandTotalVal}>
                          {formatCurrency(previewRecord.grandTotal)}
                        </Text>
                      </View>

                      <View style={printStyles.summaryLine}>
                        <Text style={printStyles.summaryLineLabel}>
                          Received Amount:
                        </Text>
                        <Text style={printStyles.receivedAmountVal}>
                          {formatCurrency(previewRecord.paidAmount)}
                        </Text>
                      </View>

                      <View style={printStyles.summaryLine}>
                        <Text style={printStyles.dueAmountLabel}>Total Due:</Text>
                        <Text style={printStyles.dueAmountVal}>
                          {formatCurrency(previewRecord.dueAmount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.white,
  },
  pageContent: {
    padding: 20,
    gap: 16,
    backgroundColor: colors.white,
  },
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
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  searchInput: {
    height: 36,
    width: 220,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0E1B3D',
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
    backgroundColor: colors.white,
  },
  reportsDropdownBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
  },
  reportsBtnText: {
    fontSize: 13,
    color: '#56627C',
  },
  navySquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#2B2D6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
  },
  filterBtnText: {
    fontSize: 13,
    color: '#0E1B3D',
  },
  subToolbarCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  createPrimaryBtn: {
    backgroundColor: '#2B2D6E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
  },
  createPrimaryBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statusFilterWrap: {
    width: 220,
    position: 'relative',
    zIndex: 100,
  },
  statusDropdownTrigger: {
    height: 38,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  statusDropdownText: {
    fontSize: 13,
    color: '#334155',
  },
  statusDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    backgroundColor: colors.white,
    zIndex: 9999,
    elevation: 8,
    boxShadow: '0 4px 14px rgba(11,47,125,0.12)',
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusOptionActive: {
    backgroundColor: '#E4EFFD',
  },
  statusOptionText: {
    fontSize: 13,
    color: '#0E1B3D',
  },
  statusOptionTextActive: {
    fontWeight: '700',
    color: '#0B2F7D',
  },
  tableCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28104E',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  thText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableBodyRowExpanded: {
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tdText: {
    fontSize: 13,
    color: '#334155',
  },
  tdTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B2F7D',
  },
  tdTextTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  tdTextReceived: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E7F5C',
  },
  tdTextDue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B3261E',
  },
  cellCheck: {
    width: 44,
    alignItems: 'center',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  checkboxHeader: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checkboxBody: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  checkboxChecked: {
    backgroundColor: '#2BB5F5',
    borderColor: '#2BB5F5',
  },
  cellExpand: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNo: { width: 50 },
  cellActions: {
    width: 210,
  },
  cellDocNo: { width: 140 },
  cellCompany: { width: 170 },
  cellCustomer: { width: 160 },
  cellMobile: { width: 120 },
  cellDate: { width: 110 },
  cellNextDate: { width: 130 },
  cellAmount: { width: 110 },
  cellStatus: { width: 140 },
  cellGst: {
    width: 110,
  },
  cellCreatedBy: {
    width: 140,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  // Accordion Sub-Detail Card Styles
  expandedContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingLeft: 44,
    paddingRight: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expandedGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expandedColumnLeft: {
    width: 340,
    gap: 10,
  },
  expandedColumnRight: {
    minWidth: 280,
    gap: 10,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '400',
    color: '#374151',
  },
  // Pagination & Track Bar Styles
  purpleTrackBar: {
    height: 6,
    backgroundColor: '#6D5B98',
    marginHorizontal: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationLabel: {
    fontSize: 13,
    color: '#56627C',
  },
  rowsPerPageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowsPerPageText: {
    fontSize: 13,
    color: '#0E1B3D',
    fontWeight: '500',
  },
  paginationRangeText: {
    fontSize: 13,
    color: '#56627C',
    marginLeft: 8,
  },
  pageNavBtn: {
    padding: 6,
    borderRadius: 4,
  },
  pageNavBtnDisabled: {
    opacity: 0.35,
  },
  pageNumberBox: {
    minWidth: 44,
    height: 28,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pageNumberText: {
    fontSize: 13,
    color: '#0E1B3D',
    fontWeight: '500',
  },
  actionIconBtn: {
    padding: 4,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgePaid: {
    backgroundColor: '#E6F7F0',
  },
  statusBadgePartial: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeUnpaid: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextPaid: {
    color: '#1E7F5C',
  },
  statusBadgeTextPartial: {
    color: '#D97706',
  },
  statusBadgeTextUnpaid: {
    color: '#DC2626',
  },
  gstPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  gstPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  emptyStateBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#334155',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,47,125,0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModalCard: {
    width: '100%',
    maxWidth: 880,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE3F0',
  },
  previewHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3F0',
    backgroundColor: colors.white,
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  previewHeaderSub: {
    fontSize: 12,
    color: '#56627C',
    fontWeight: '600',
    marginTop: 2,
  },
  printNavyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B2F7D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  printNavyBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  closeOutlineBtn: {
    borderWidth: 1,
    borderColor: '#DCE3F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeOutlineBtnText: {
    fontSize: 12,
    color: '#56627C',
    fontWeight: '600',
  },
  printableDocument: {
    padding: 24,
    backgroundColor: colors.white,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },
  companyInfoLeft: {
    flex: 1,
  },
  logoBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  logoBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B2F7D',
  },
  docAddressText: {
    fontSize: 12,
    color: '#56627C',
    lineHeight: 18,
    marginBottom: 4,
  },
  docMetaText: {
    fontSize: 12,
    color: '#56627C',
  },
  bankInfoRight: {
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#F8FAFD',
    minWidth: 220,
  },
  bankInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B2F7D',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bankDetailLine: {
    fontSize: 12,
    color: '#56627C',
    marginBottom: 2,
  },
  bankDetailVal: {
    fontWeight: '600',
    color: '#0E1B3D',
  },
  docDivider: {
    height: 1,
    backgroundColor: '#DCE3F0',
    marginVertical: 16,
  },
  docMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: '#F8FAFD',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE3F0',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#56627C',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  customerBox: {
    marginBottom: 16,
  },
  customerHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#56627C',
    marginBottom: 4,
  },
  customerNameMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  customerSubText: {
    fontSize: 12,
    color: '#56627C',
    marginTop: 2,
  },
  itemTable: {
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  itemTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2F7D',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  itemTh: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  itemTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3F0',
  },
  itemTd: {
    fontSize: 12,
    color: '#334155',
  },
  itemTdBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  itemTdComments: {
    fontSize: 11,
    color: '#56627C',
    fontStyle: 'italic',
    marginTop: 2,
  },
  bottomFinancialRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  termsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E1B3D',
    marginBottom: 4,
  },
  termsBody: {
    fontSize: 11,
    color: '#56627C',
    lineHeight: 16,
  },
  modalSignatureBox: {
    marginTop: 24,
    height: 70,
    width: 200,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: colors.white,
  },
  modalSignatureCursive: {
    fontStyle: 'italic',
    fontSize: 18,
    fontWeight: '700',
    color: '#0B2F7D',
  },
  modalSignatorySub: {
    fontSize: 10,
    color: '#56627C',
    marginTop: 2,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    padding: 14,
    backgroundColor: '#F8FAFD',
    gap: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLineLabel: {
    fontSize: 12,
    color: '#56627C',
  },
  summaryLineVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E1B3D',
  },
  grandTotalLine: {
    borderTopWidth: 1,
    borderTopColor: '#DCE3F0',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  grandTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B2F7D',
  },
  receivedAmountVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E7F5C',
  },
  dueAmountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B3261E',
  },
  dueAmountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B3261E',
  },
  // Payment Details Modal Styles (Matching Screenshot 2)
  payModalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  payModalHeader: {
    backgroundColor: '#352D7E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  payModalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  payModalCloseBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payModalBody: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  payModalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  payModalCustomerCol: {
    flex: 1,
    minWidth: 180,
  },
  payModalCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E1B3D',
    letterSpacing: 0.3,
  },
  payModalSummaryCol: {
    alignItems: 'flex-start',
    gap: 3,
  },
  payModalMetaLine: {
    fontSize: 12,
  },
  payModalMetaLabel: {
    color: '#56627C',
    fontWeight: '500',
  },
  payModalMetaVal: {
    color: '#0E1B3D',
    fontWeight: '700',
  },
  payModalTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  payModalTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  payModalTh: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  payModalTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  payModalTd: {
    fontSize: 12,
    color: '#475569',
  },
  payModalTdBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  payColIndex: { width: 60 },
  payColDate: { flex: 1.2 },
  payColMethod: { flex: 1.2 },
  payColAmount: { flex: 1.2 },
  payColActions: { width: 90 },
  payBadgePaid: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  payBadgePaidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  payModalEmptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payModalEmptyText: {
    fontSize: 12,
    color: '#64748B',
  },
  payModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  payModalCancelBtn: {
    backgroundColor: '#352D7E',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 6,
  },
  payModalCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
