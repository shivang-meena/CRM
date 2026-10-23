// apps/client/src/invoices/InvoiceFormScreen.tsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoiceHsnMaster, INVOICE_HSN_MASTER_KEY } from '@/api/hsnMaster';
import { ProfileSelect } from '@/settings/ProfileFields';
import { INDIA_STATES } from '@/settings/profileOptions';
import { Href, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useInvoiceCompanyProfile } from '@/hooks/useInvoiceCompanyProfile';
import { useInvoiceGstSettings } from '@/hooks/useInvoiceGstSettings';
import { useInvoiceNonGstSettings } from '@/hooks/useInvoiceNonGstSettings';
import InvoiceSignature from './InvoiceSignature';
import InvoiceCompanyDetails from './InvoiceCompanyDetails';
import { getDocumentCompanyProfile, getDocumentInvoiceSettings } from './companyProfile';
import { invoiceBranding } from './invoiceBranding';
import DateTimePickerModal from '@/components/DateTimePickerModal';
import { useCustomers } from '@/hooks/useCustomers';
import { useBrochures, useCreateSalesDocument, usePaymentMethods, useUpdateSalesDocument } from '@/hooks/useSalesDocuments';
import {
  calculateInvoicePreview,
  CreateSalesDocumentPayload,
  DEFAULT_DOCUMENT_CONFIG,
  DiscountType,
  GstMode,
  InvoicePaymentStatus,
  SalesDocumentItem,
  SalesDocumentRecord,
  SalesDocumentType,
  UpdateSalesDocumentPayload,
} from '@/types/salesDocuments';

interface InvoiceFormScreenProps {
  initialType?: SalesDocumentType;
  existingDocument?: SalesDocumentRecord;
  isClone?: boolean;
}

type InvoiceFormItem = SalesDocumentItem;

const DISCOUNT_OPTIONS: { label: string; value: DiscountType }[] = [
  { label: 'Overall Discount', value: 'OVERALL' },
  { label: 'Per Item Discount', value: 'FLAT_PER_UNIT' },
];

function getTodayIstFormatted(): { display: string; isoDate: string } {
  const now = new Date();
  const istTime = new Date(now.getTime() + 330 * 60 * 1000);
  const yyyy = istTime.getUTCFullYear();
  const mm = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getUTCDate()).padStart(2, '0');
  return {
    display: `${dd}-${mm}-${yyyy}`,
    isoDate: `${yyyy}-${mm}-${dd}`,
  };
}

function ddmmyyyyToIso(input: string): string {
  const parts = input.trim().split('-');
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return input;
}

function isoToDdmmyyyy(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = ist.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function InvoiceFormScreen({ initialType = 'INVOICE', existingDocument, isClone = false }: InvoiceFormScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const editingExisting = Boolean(existingDocument && !isClone);
  const companyQuery = useInvoiceCompanyProfile(!editingExisting);
  const companyProfile = editingExisting && existingDocument ? getDocumentCompanyProfile(existingDocument) : companyQuery.data;
  const companyUnavailable = !editingExisting && (companyQuery.isFetching || companyQuery.isError || !companyProfile?.companyName);
  const [savedDocument, setSavedDocument] = useState<SalesDocumentRecord | null>(null);
  const previewCompany = savedDocument ? getDocumentCompanyProfile(savedDocument) : companyProfile;
  const printStyles = useMemo(() => invoiceBranding(styles, previewCompany), [previewCompany]);

  const today = useMemo(() => getTodayIstFormatted(), []);
  const [docType] = useState<SalesDocumentType>(existingDocument?.type ?? initialType);
  const [dateDisplay, setDateDisplay] = useState<string>(existingDocument ? isoToDdmmyyyy(existingDocument.issueDate) : today.display);
  const [customerId, setCustomerId] = useState<string>(existingDocument?.customerId ?? '');
  const [customerState, setCustomerState] = useState<string>(
    existingDocument?.customerState ?? (existingDocument as any)?.state ?? ''
  );
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const applyGstModeForState = (cState: string, compState?: string) => {
    const sellerState = (compState || companyProfile?.state || '').trim().toLowerCase();
    const buyerState = (cState || '').trim().toLowerCase();
    if (sellerState && buyerState) {
      if (sellerState === buyerState) {
        setGstMode('SGST_CGST');
      } else {
        setGstMode('IGST');
      }
    }
  };

  const [gstMode, setGstMode] = useState<GstMode>(existingDocument?.gstMode ?? (existingDocument as any)?.gstType ?? 'NON_GST');
  const [inclusiveGst, setInclusiveGst] = useState<boolean>(existingDocument?.inclusiveGst ?? false);
  const hsnQuery = useQuery({ queryKey: INVOICE_HSN_MASTER_KEY, queryFn: fetchInvoiceHsnMaster });
  const isGstInvoice = docType === 'INVOICE' && gstMode !== 'NON_GST';
  const gstQuery = useInvoiceGstSettings(isGstInvoice && !editingExisting);
  const nonGstQuery = useInvoiceNonGstSettings(docType === 'INVOICE' && !isGstInvoice && !editingExisting);
  const settingsQuery = isGstInvoice ? gstQuery : nonGstQuery;
  const invoiceSettings = docType === 'INVOICE' ? (editingExisting && existingDocument ? getDocumentInvoiceSettings(existingDocument) : settingsQuery.data) : null;
  const invoiceSettingsUnavailable = docType === 'INVOICE' && !editingExisting && (settingsQuery.isFetching || settingsQuery.isError || !invoiceSettings);
  const documentBank = invoiceSettings ?? {
    bankName: editingExisting ? (existingDocument?.bankName ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.bankName,
    accountNo: editingExisting ? (existingDocument?.bankAccountNo ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.accountNo,
    ifscCode: editingExisting ? (existingDocument?.bankIfsc ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.ifscCode,
    paymentUpiId: '',
    signature: '',
  };
  const previewInvoiceSettings = savedDocument ? getDocumentInvoiceSettings(savedDocument) : invoiceSettings;
  const previewBank =
    docType === 'INVOICE' && savedDocument
      ? {
          bankName: savedDocument.bankName,
          accountNo: savedDocument.bankAccountNo,
          ifscCode: savedDocument.bankIfsc,
          paymentUpiId: previewInvoiceSettings?.paymentUpiId ?? '',
        }
      : documentBank;

  const [currencyOverride, setCurrency] = useState<string | null>(existingDocument?.currency ?? null);
  const currency = currencyOverride ?? invoiceSettings?.invoiceCurrency ?? 'INR';
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [discountDropdownIndex, setDiscountDropdownIndex] = useState<number | null>(null);

  const [items, setItems] = useState<InvoiceFormItem[]>(
    existingDocument?.items?.length
      ? existingDocument.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          hsnSac: it.hsnSac || '',
          hsnMasterId: it.hsnMasterId,
          hsnDescription: it.hsnDescription || '',
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          discountValue: it.discountValue,
          discountType: it.discountType === 'FIXED' ? 'OVERALL' : it.discountType || 'OVERALL',
          igstRate: it.igstRate ?? 18,
          sgstRate: it.sgstRate ?? 9,
          cgstRate: it.cgstRate ?? 9,
          comments: it.comments || '',
        }))
      : [
          {
            productName: '',
            hsnSac: '',
            unitPrice: 0,
            quantity: 1,
            discountValue: 0,
            discountType: 'OVERALL',
            igstRate: 0,
            sgstRate: 0,
            cgstRate: 0,
            comments: '',
          },
        ],
  );

  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>(existingDocument?.paymentStatus === 'HALF_PAID' ? 'PARTIALLY_PAID' : (existingDocument?.paymentStatus ?? 'UNPAID'));
  const [paidAmountInput, setPaidAmountInput] = useState<string>(existingDocument?.paidAmount ? String(existingDocument.paidAmount) : '0');
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(existingDocument?.paymentMethodId ?? null);
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
  const [paymentDateDisplay, setPaymentDateDisplay] = useState<string>(existingDocument?.paymentDate ? isoToDdmmyyyy(existingDocument.paymentDate) : today.display);
  const [brochureId, setBrochureId] = useState<string | null>(existingDocument?.brochureId ?? null);
  const [brochureDropdownOpen, setBrochureDropdownOpen] = useState(false);
  const [nextPaymentDateDisplay, setNextPaymentDateDisplay] = useState<string>(existingDocument?.nextPaymentDate ? isoToDdmmyyyy(existingDocument.nextPaymentDate) : '');
  const [nextPaymentDatePickerOpen, setNextPaymentDatePickerOpen] = useState(false);

  const [termsOverride, setTermsAndConditions] = useState<string | null>(existingDocument?.termsAndConditions ?? null);
  const termsAndConditions = termsOverride ?? invoiceSettings?.termsAndConditions ?? (docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.defaultTerms);
  const effectiveItems = useMemo(
    () =>
      items.map((item) => {
        if (!item.hsnMasterId || (editingExisting && gstMode === existingDocument?.gstMode && !item.applyHsnMaster)) return item;
        const master = hsnQuery.data?.find((entry) => entry.id === item.hsnMasterId);
        return master ? { ...item, hsnSac: master.code, hsnDescription: master.description, igstRate: master.igstRate, sgstRate: master.sgstRate, cgstRate: master.cgstRate } : item;
      }),
    [items, editingExisting, gstMode, existingDocument?.gstMode, hsnQuery.data],
  );
  const [emailAutomation, setEmailAutomation] = useState<boolean>(existingDocument?.emailAutomation ?? false);
  const [whatsappAutomation, setWhatsappAutomation] = useState<boolean>(existingDocument?.whatsappAutomation ?? false);

  const [formError, setFormError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const { data: customerPage, isLoading: loadingCustomers } = useCustomers({
    search: '',
    page: 1,
    pageSize: 100,
  });
  const customers = useMemo(() => {
    return (Array.isArray(customerPage) ? customerPage : customerPage?.items) ?? [];
  }, [customerPage]);

  const { data: brochures = [] } = useBrochures();
  const { data: paymentMethods = [], isLoading: loadingPaymentMethods, isError: paymentMethodsError, refetch: refetchPaymentMethods } = usePaymentMethods();
  const createMutation = useCreateSalesDocument();
  const updateMutation = useUpdateSalesDocument();

  const selectedCustomer = useMemo(() => {
    return (customers as any[]).find((c) => c.id === customerId);
  }, [customers, customerId]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers as any[];
    return (customers as any[]).filter((c) => {
      const name = (c.name || c.lead?.name || '').toLowerCase();
      const company = (c.companyName || c.lead?.companyName || '').toLowerCase();
      const phone = (c.phone || c.lead?.phone || '').toLowerCase();
      return name.includes(q) || company.includes(q) || phone.includes(q);
    });
  }, [customers, customerSearch]);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return '₹';
    }
  }, [currency]);

  // Authoritative pure client calculation matching backend
  const calculations = useMemo(() => {
    return calculateInvoicePreview({
      items: effectiveItems,
      gstMode,
      inclusiveGst,
      docType,
      paymentStatus,
      paidAmountInput: Number(paidAmountInput) || 0,
    });
  }, [effectiveItems, gstMode, inclusiveGst, docType, paymentStatus, paidAmountInput]);

  const handleUpdateItem = (idx: number, patch: Partial<SalesDocumentItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...effectiveItems[idx],
        ...patch,
      };
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setDiscountDropdownIndex(null);
    if (items.length <= 1) {
      setItems([
        {
          productName: '',
          hsnSac: '',
          unitPrice: 0,
          quantity: 1,
          discountValue: 0,
          discountType: 'OVERALL',
          igstRate: 0,
          sgstRate: 0,
          cgstRate: 0,
          comments: '',
        },
      ]);
    } else {
      setItems((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleAddItem = () => {
    setDiscountDropdownIndex(null);
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        hsnSac: '',
        unitPrice: 0,
        quantity: 1,
        discountValue: 0,
        discountType: 'OVERALL',
        igstRate: 0,
        sgstRate: 0,
        cgstRate: 0,
        comments: '',
      },
    ]);
  };

  const handleSave = async (openPreviewAfter = false) => {
    setDiscountDropdownIndex(null);
    setPaymentMethodDropdownOpen(false);
    setFormError(null);

    if (companyUnavailable) {
      setFormError(companyQuery.isFetching ? 'Loading company profile. Please wait.' : 'Save the Company Profile in General Settings → Web Settings before creating this document.');
      return;
    }
    if (invoiceSettingsUnavailable) {
      setFormError(
        settingsQuery.isFetching
          ? 'Loading Invoice Settings. Please wait.'
          : settingsQuery.isError
            ? errorMessage(settingsQuery.error)
            : `Save ${isGstInvoice ? 'GST' : 'Non GST'} Invoice settings in Web Settings → Invoice Settings before creating this invoice.`,
      );
      return;
    }

    if (!customerId) {
      setFormError('Please select a customer for this document.');
      return;
    }

    const validItems = effectiveItems.filter((it) => it.productName.trim().length > 0);
    if (validItems.length === 0) {
      setFormError('Please add at least one line item with a product name.');
      return;
    }

    if (gstMode !== 'NON_GST') {
      const needsMaster = validItems.filter((item) => {
        const original = editingExisting ? existingDocument?.items.find((row) => row.id === item.id) : undefined;
        return !original || item.applyHsnMaster || gstMode !== existingDocument?.gstMode || original.hsnMasterId !== item.hsnMasterId;
      });
      if (needsMaster.length && (hsnQuery.isPending || hsnQuery.isError)) {
        setFormError(hsnQuery.isError ? errorMessage(hsnQuery.error) : 'Loading HSN master. Please wait.');
        return;
      }
      if (needsMaster.some((item) => !hsnQuery.data?.some((entry) => entry.id === item.hsnMasterId))) {
        setFormError('Select an active HSN from HSN Master for each item. Add entries in Invoice Settings first.');
        return;
      }
      const missingHsn = validItems.some((it) => !it.hsnSac?.trim());
      if (missingHsn) {
        setFormError('HSN/SAC Code is required for all items in GST mode.');
        return;
      }
    }

    const hasPayment = docType === 'INVOICE' && paymentStatus !== 'UNPAID';
    const nextPaymentDate = docType === 'INVOICE' && paymentStatus !== 'PAID' && nextPaymentDateDisplay.trim() ? ddmmyyyyToIso(nextPaymentDateDisplay) : null;
    if (nextPaymentDate !== null) {
      const parsedNextDate = new Date(nextPaymentDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextPaymentDate) || Number.isNaN(parsedNextDate.getTime()) || parsedNextDate.toISOString().slice(0, 10) !== nextPaymentDate) {
        setFormError('Please enter a valid next payment date in DD-MM-YYYY format.');
        return;
      }
    }
    const paymentDate = hasPayment ? ddmmyyyyToIso(paymentDateDisplay) : null;
    if (paymentDate !== null) {
      const parsedDate = new Date(paymentDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== paymentDate) {
        setFormError('Please enter a valid payment date in DD-MM-YYYY format.');
        return;
      }
    }

    const payload: CreateSalesDocumentPayload = {
      requestKey: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: docType,
      customerId,
      customerState: customerState.trim() || undefined,
      issueDate: ddmmyyyyToIso(dateDisplay),
      paymentDate,
      nextPaymentDate,
      gstMode,
      gstType: gstMode,
      inclusiveGst: gstMode === 'NON_GST' ? false : inclusiveGst,
      currency,
      paymentStatus: docType === 'QUOTATION' ? ('UNPAID' as InvoicePaymentStatus) : paymentStatus,
      paidAmount: docType === 'INVOICE' && paymentStatus === 'PARTIALLY_PAID' ? Number(paidAmountInput) || 0 : paymentStatus === 'PAID' ? calculations.grandTotal : 0,
      paymentMethodId,
      brochureId: brochureId || null,
      termsAndConditions,
      emailAutomation,
      whatsappAutomation,
      items: validItems.map((it) => ({
        id: editingExisting ? it.id : undefined,
        productName: it.productName.trim(),
        hsnSac: gstMode === 'NON_GST' ? '' : it.hsnSac.trim(),
        hsnMasterId: gstMode === 'NON_GST' ? undefined : it.hsnMasterId,
        hsnDescription: gstMode === 'NON_GST' ? '' : it.hsnDescription,
        applyHsnMaster: it.applyHsnMaster,
        unitPrice: Number(it.unitPrice) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        discountValue: Number(it.discountValue) || 0,
        discountType: it.discountType || 'OVERALL',
        igstRate: gstMode === 'IGST' ? Number(it.igstRate) || 0 : 0,
        sgstRate: gstMode === 'SGST_CGST' ? Number(it.sgstRate) || 0 : 0,
        cgstRate: gstMode === 'SGST_CGST' ? Number(it.cgstRate) || 0 : 0,
        comments: it.comments?.trim() || '',
      })),
    };

    try {
      let saved: SalesDocumentRecord;
      if (existingDocument && !isClone) {
        saved = await updateMutation.mutateAsync({
          id: existingDocument.id,
          payload: {
            ...payload,
            version: existingDocument.version,
          } as UpdateSalesDocumentPayload,
        });
      } else {
        saved = await createMutation.mutateAsync(payload);
      }
      setSavedDocument(saved);

      if (openPreviewAfter) {
        setPreviewModalOpen(true);
      } else {
        router.push((docType === 'QUOTATION' ? '/invoice/quotation' : '/invoice') as Href);
      }
    } catch (err: unknown) {
      setFormError(errorMessage(err));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
      {/* Main Pure White Container Card */}
      <View style={styles.mainCard}>
        {/* Section 1: Company Branding & Document Date */}
        <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop]}>
          <View style={styles.companyBlock}>
            {companyProfile ? <InvoiceCompanyDetails profile={companyProfile} /> : null}
            {!editingExisting && companyQuery.isFetching ? <ActivityIndicator accessibilityLabel="Loading company profile" color={colors.primary} /> : null}
            {!editingExisting && !companyQuery.isFetching && (companyQuery.isError || !companyProfile) ? (
              <View style={{ gap: 8 }}>
                <Text accessibilityRole="alert" style={styles.errorBannerText}>
                  {companyQuery.isError ? errorMessage(companyQuery.error) : 'Save Company Profile in General Settings → Web Settings to create invoices.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void companyQuery.refetch();
                  }}
                >
                  <Text style={styles.outlineActionBtnText}>Reload company profile</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.dateBlock}>
            <Text style={styles.fieldLabel}>
              Date <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput style={styles.dateInput} value={dateDisplay} onChangeText={setDateDisplay} placeholder="DD-MM-YYYY" placeholderTextColor={colors.textMuted} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 2: Invoice To (Floating Customer Dropdown) & Static Payment Details */}
        <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 100 }]}>
          <View style={[styles.halfCol, { position: 'relative', zIndex: 110 }]}>
            <Text style={styles.fieldLabel}>{docType === 'QUOTATION' ? 'Quotation To:' : 'Invoice To:'}</Text>

            <View style={{ position: 'relative', zIndex: 120 }}>
              <Pressable style={styles.dropdownTrigger} onPress={() => setCustomerDropdownOpen((o) => !o)}>
                <Text style={[styles.dropdownTriggerText, !selectedCustomer && styles.placeholderText]}>
                  {selectedCustomer
                    ? `${selectedCustomer.companyName || selectedCustomer.lead?.companyName || ''} ${
                        selectedCustomer.name || selectedCustomer.lead?.name || ''
                      } (${selectedCustomer.phone || selectedCustomer.lead?.phone || ''})`.trim()
                    : 'Select...'}
                </Text>
                <Ionicons name={customerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </Pressable>

              {customerDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <TextInput
                    style={styles.dropdownSearchInput}
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                    placeholder="Search existing customer by name, company, mobile..."
                    placeholderTextColor={colors.textMuted}
                  />
                  {loadingCustomers ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : filteredCustomers.length === 0 ? (
                    <Text style={styles.emptyDropdownText}>No existing customers found</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {filteredCustomers.map((cust: any) => {
                        const cName = cust.name || cust.lead?.name || 'Customer';
                        const cComp = cust.companyName || cust.lead?.companyName || '';
                        const cPhone = cust.phone || cust.lead?.phone || '';
                        const isSelected = cust.id === customerId;
                        return (
                          <Pressable
                            key={cust.id}
                            style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
                            onPress={() => {
                              const cState = cust.lead?.state || cust.state || '';
                              setCustomerId(cust.id);
                              if (cState) {
                                setCustomerState(cState);
                                applyGstModeForState(cState);
                              }
                              if (!editingExisting && cust.lead?.service) {
                                const s = cust.lead.service;
                                setItems((prev) => {
                                  if (prev.length === 1 && !prev[0].productName.trim()) {
                                    return [
                                      {
                                        ...prev[0],
                                        productName: s.name,
                                        hsnSac: (s as any).hsnSac || '',
                                        hsnDescription: (s as any).description || s.name,
                                        hsnMasterId: s.id,
                                        igstRate: Number((s as any).igstRate ?? 18),
                                        sgstRate: Number((s as any).sgstRate ?? 9),
                                        cgstRate: Number((s as any).cgstRate ?? 9),
                                        applyHsnMaster: true,
                                      },
                                    ];
                                  }
                                  return prev;
                                });
                              }
                              setCustomerDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionTitle}>{cComp ? `${cComp} — ${cName}` : cName}</Text>
                            {Boolean(cPhone) && <Text style={styles.dropdownOptionSub}>{cPhone}</Text>}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {Boolean(selectedCustomer) && (
              <>
                <View style={styles.customerSummaryPill}>
                  <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.customerSummaryText}>
                    {[
                      selectedCustomer.companyName || selectedCustomer.lead?.companyName,
                      selectedCustomer.name || selectedCustomer.lead?.name,
                      selectedCustomer.phone || selectedCustomer.lead?.phone,
                      selectedCustomer.address || selectedCustomer.lead?.address,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>

                <View style={{ gap: 6, marginTop: 8 }}>
                  <ProfileSelect
                    label="Customer State (for GST auto-calculation)"
                    allowCustom={true}
                    value={customerState}
                    options={INDIA_STATES}
                    onChange={(val) => {
                      setCustomerState(val);
                      applyGstModeForState(val);
                    }}
                  />
                  {Boolean(companyProfile?.state) && Boolean(customerState) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Ionicons
                        name={customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? 'business' : 'airplane'}
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={{ fontSize: 11, color: colors.primaryText }}>
                        Company: <Text style={{ fontWeight: '700' }}>{companyProfile?.state}</Text> | Customer: <Text style={{ fontWeight: '700' }}>{customerState}</Text>
                        {' → '}
                        <Text style={{ fontWeight: '700', color: customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? '#15803D' : '#1D4ED8' }}>
                          {customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? 'Intra-state (CGST + SGST applied)' : 'Inter-state (IGST applied)'}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          <View style={styles.halfCol}>
            <Text style={styles.fieldLabel}>Payment Details:</Text>
            <View style={styles.bankInfoGrid}>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoKey}>Bank name:</Text>
                <Text style={styles.bankInfoVal}>{documentBank.bankName}</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoKey}>Account No.:</Text>
                <Text style={styles.bankInfoVal}>{documentBank.accountNo}</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoKey}>IFSC Code:</Text>
                <Text style={styles.bankInfoVal}>{documentBank.ifscCode}</Text>
              </View>
              {documentBank.paymentUpiId ? (
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoKey}>UPI ID:</Text>
                  <Text style={styles.bankInfoVal}>{documentBank.paymentUpiId}</Text>
                </View>
              ) : null}
              {docType === 'INVOICE' && !editingExisting && (settingsQuery.isFetching || settingsQuery.isError || !invoiceSettings) ? (
                <View style={{ gap: 8, marginTop: 10 }}>
                  {settingsQuery.isFetching ? (
                    <ActivityIndicator accessibilityLabel="Loading Invoice Settings" color={colors.primary} />
                  ) : (
                    <>
                      <Text accessibilityRole="alert" style={styles.errorBannerText}>
                        {settingsQuery.isError ? errorMessage(settingsQuery.error) : `Save ${isGstInvoice ? 'GST' : 'Non GST'} bank details and signature in Web Settings → Invoice Settings.`}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          void settingsQuery.refetch();
                        }}
                      >
                        <Text style={styles.outlineActionBtnText}>Reload Invoice Settings</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 3: GST Type Store & Invoice Currency */}
        <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 70 }]}>
          <View style={styles.halfCol}>
            <Text style={styles.fieldLabel}>
              GST Type Store <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.radioGroupRow}>
              {(
                [
                  { label: 'Non GST', value: 'NON_GST' },
                  { label: 'IGST', value: 'IGST' },
                  { label: 'SGST / CGST', value: 'SGST_CGST' },
                ] as const
              ).map((opt) => {
                const selected = gstMode === opt.value;
                return (
                  <Pressable key={opt.value} style={styles.radioOption} onPress={() => setGstMode(opt.value)}>
                    <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>{selected && <View style={styles.radioInnerDot} />}</View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Inclusive GST Switch shown right below GST Type Store when GST active */}
            {gstMode !== 'NON_GST' && (
              <View style={styles.inclusiveToggleRow}>
                <Text style={styles.fieldLabelInline}>Inclusive GST</Text>
                <Switch value={inclusiveGst} onValueChange={setInclusiveGst} trackColor={{ false: '#CBD5E1', true: '#0B2F7D' }} />
              </View>
            )}
          </View>

          <View style={[styles.halfCol, { position: 'relative', zIndex: 80 }]}>
            <Text style={styles.fieldLabel}>Invoice Currency:</Text>
            <View style={{ position: 'relative', zIndex: 90 }}>
              <Pressable style={styles.dropdownTrigger} onPress={() => setCurrencyDropdownOpen((o) => !o)}>
                <Text style={styles.dropdownTriggerText}>{currency === 'INR' ? '₹ - India' : currency === 'USD' ? '$ - USD' : '€ - EUR'}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>
              {currencyDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {[
                    { label: '₹ - India', value: 'INR' },
                    { label: '$ - USD', value: 'USD' },
                    { label: '€ - EUR', value: 'EUR' },
                  ].map((c) => (
                    <Pressable
                      key={c.value}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setCurrency(c.value);
                        setCurrencyDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionTitle}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 4: Dynamic Line Items */}
        {effectiveItems.map((item, idx) => {
          const lineCalc = calculations.lineBreakdowns[idx] || {
            grossAmount: 0,
            discountAmount: 0,
            afterDiscountAmount: 0,
            taxableAmount: 0,
            igstRate: 0,
            igstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            cgstRate: 0,
            cgstAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
          };

          return (
            <View key={idx} style={[styles.itemCard, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
              <View style={styles.itemRemoveTopRight}>
                <Pressable onPress={() => handleRemoveItem(idx)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Row 1: Item Product Name + HSN Code (when GST mode active) */}
              <View style={[styles.itemTopRow, isDesktop && styles.itemTopRowDesktop]}>
                <View style={{ flex: 3.5, gap: 6 }}>
                  <ProfileSelect
                    label="Service / Product Name"
                    required
                    allowCustom={true}
                    value={item.productName}
                    options={(hsnQuery.data ?? []).map((entry) => (entry as any).name || entry.description || entry.code)}
                    onChange={(val) => {
                      const match = (hsnQuery.data ?? []).find(
                        (entry) => ((entry as any).name || entry.description || entry.code) === val
                      );
                      if (match) {
                        handleUpdateItem(idx, {
                          productName: (match as any).name || match.description || match.code,
                          hsnMasterId: match.id,
                          hsnSac: match.code,
                          hsnDescription: match.description,
                          igstRate: match.igstRate,
                          sgstRate: match.sgstRate,
                          cgstRate: match.cgstRate,
                          applyHsnMaster: true,
                        });
                      } else {
                        handleUpdateItem(idx, { productName: val });
                      }
                    }}
                    placeholder="Select service or enter product name"
                  />
                </View>

                {gstMode !== 'NON_GST' && (
                  <View style={{ flex: 2, minWidth: 180, gap: 6 }}>
                    <ProfileSelect
                      label="HSN Code"
                      required
                      allowCustom={false}
                      value={item.hsnSac ? `${item.hsnSac}${item.hsnDescription ? ` — ${item.hsnDescription}` : ''}` : ''}
                      options={(hsnQuery.data ?? []).map((entry) => `${entry.code} — ${(entry as any).name || entry.description}`)}
                      onChange={(value) => {
                        const master = hsnQuery.data?.find((entry) => `${entry.code} — ${(entry as any).name || entry.description}` === value);
                        if (master) {
                          handleUpdateItem(idx, {
                            productName: item.productName || (master as any).name || '',
                            hsnMasterId: master.id,
                            hsnSac: master.code,
                            hsnDescription: master.description,
                            igstRate: master.igstRate,
                            sgstRate: master.sgstRate,
                            cgstRate: master.cgstRate,
                            applyHsnMaster: true,
                          });
                        }
                      }}
                    />
                    {item.hsnDescription ? <Text style={styles.fieldLabel}>HSN Description: {item.hsnDescription}</Text> : null}
                    {hsnQuery.isPending ? <Text style={styles.fieldLabel}>Loading services & HSN...</Text> : hsnQuery.isError ? (
                      <Pressable accessibilityRole="button" onPress={() => { void hsnQuery.refetch(); }}><Text style={styles.fieldLabel}>Could not load services. Tap to retry.</Text></Pressable>
                    ) : !hsnQuery.data?.length ? <Text style={styles.fieldLabel}>Add active services in Invoice Settings → Services & HSN Master.</Text> : null}
                  </View>
                )}
              </View>

              {/* Row 2: Cost, Qty (- input +), Discount, Discount Type, Sub Total */}
              <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
                <View style={styles.metricCol}>
                  <Text style={styles.fieldLabel}>
                    Cost <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.prefixedInputWrap}>
                    <View style={styles.prefixBox}>
                      <Text style={styles.prefixText}>{currencySymbol}</Text>
                    </View>
                    <TextInput
                      style={styles.prefixedInput}
                      keyboardType="numeric"
                      value={String(item.unitPrice)}
                      onChangeText={(val) =>
                        handleUpdateItem(idx, {
                          unitPrice: Number(val.replace(/[^0-9.]/g, '')) || 0,
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.metricColQty}>
                  <Text style={styles.fieldLabel}>
                    Qty: <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.qtyStepperRow}>
                    <Pressable
                      style={styles.qtyBtnMuted}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity for item ${idx + 1}`}
                      onPress={() =>
                        handleUpdateItem(idx, {
                          quantity: Math.max(1, (Number(item.quantity) || 1) - 1),
                        })
                      }
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </Pressable>
                    <TextInput
                      style={styles.qtyDirectInput}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                        handleUpdateItem(idx, {
                          quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                        });
                      }}
                    />
                    <Pressable
                      style={styles.qtyBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity for item ${idx + 1}`}
                      onPress={() =>
                        handleUpdateItem(idx, {
                          quantity: (Number(item.quantity) || 1) + 1,
                        })
                      }
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.fieldLabel}>
                    Discount: <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(item.discountValue)}
                    onChangeText={(val) =>
                      handleUpdateItem(idx, {
                        discountValue: Number(val.replace(/[^0-9.]/g, '')) || 0,
                      })
                    }
                  />
                </View>

                <View style={[styles.metricCol, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
                  <Text style={styles.fieldLabel}>Discount Type :</Text>
                  <View style={styles.discountDropdownAnchor}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Discount type for item ${idx + 1}`}
                      accessibilityState={{
                        expanded: discountDropdownIndex === idx,
                      }}
                      style={[styles.dropdownTrigger, { backgroundColor: '#F1F5F9' }]}
                      onPress={() => setDiscountDropdownIndex((current) => (current === idx ? null : idx))}
                    >
                      <Text style={styles.dropdownTriggerText}>
                        {item.discountType === 'FLAT_PER_UNIT' ? 'Per Item Discount' : item.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Overall Discount'}
                      </Text>
                      <Ionicons name={discountDropdownIndex === idx ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                    </Pressable>
                    {discountDropdownIndex === idx && (
                      <View style={styles.dropdownMenu}>
                        {DISCOUNT_OPTIONS.map((option) => {
                          const selected = item.discountType === option.value;
                          return (
                            <Pressable
                              key={option.value}
                              accessibilityRole="button"
                              accessibilityLabel={option.label}
                              accessibilityState={{ selected }}
                              style={[styles.dropdownOption, selected && styles.dropdownOptionActive]}
                              onPress={() => {
                                handleUpdateItem(idx, {
                                  discountType: option.value,
                                });
                                setDiscountDropdownIndex(null);
                              }}
                            >
                              <Text style={styles.dropdownOptionTitle}>{option.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.fieldLabel}>Sub Total</Text>
                  <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
                    <View style={styles.prefixBox}>
                      <Text style={styles.prefixText}>{currencySymbol}</Text>
                    </View>
                    <Text style={styles.readOnlyValueText}>{lineCalc.taxableAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* Row 3: Conditional Tax Fields based on gstMode */}
              {gstMode === 'IGST' && (
                <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop]}>
                  <View style={styles.metricCol}>
                    <Text style={styles.fieldLabel}>IGST</Text>
                    <View style={styles.suffixedInputWrap}>
                      <TextInput
                        style={styles.suffixedInput}
                        keyboardType="numeric"
                        value={String(item.igstRate)}
                        editable={false}
                        accessibilityLabel={`IGST rate from HSN for item ${idx + 1}`}
                      />
                      <Text style={styles.suffixPercentText}>%</Text>
                    </View>
                  </View>

                  <View style={styles.metricColWide}>
                    <Text style={styles.fieldLabel}>Tax Amount</Text>
                    <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>{currencySymbol}</Text>
                      </View>
                      <Text style={styles.readOnlyValueText}>{lineCalc.taxAmount.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.metricColWide}>
                    <Text style={styles.fieldLabel}>Total Amount</Text>
                    <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>{currencySymbol}</Text>
                      </View>
                      <Text style={styles.readOnlyValueText}>{lineCalc.totalAmount.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {gstMode === 'SGST_CGST' && (
                <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop]}>
                  <View style={styles.metricColSmall}>
                    <Text style={styles.fieldLabel}>SGST</Text>
                    <View style={styles.suffixedInputWrap}>
                      <TextInput
                        style={styles.suffixedInput}
                        keyboardType="numeric"
                        value={String(item.sgstRate)}
                        editable={false}
                        accessibilityLabel={`SGST rate from HSN for item ${idx + 1}`}
                      />
                      <Text style={styles.suffixPercentText}>%</Text>
                    </View>
                  </View>

                  <View style={styles.metricColSmall}>
                    <Text style={styles.fieldLabel}>CGST</Text>
                    <View style={styles.suffixedInputWrap}>
                      <TextInput
                        style={styles.suffixedInput}
                        keyboardType="numeric"
                        value={String(item.cgstRate)}
                        editable={false}
                        accessibilityLabel={`CGST rate from HSN for item ${idx + 1}`}
                      />
                      <Text style={styles.suffixPercentText}>%</Text>
                    </View>
                  </View>

                  <View style={styles.metricColWide}>
                    <Text style={styles.fieldLabel}>Tax Amount</Text>
                    <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>{currencySymbol}</Text>
                      </View>
                      <Text style={styles.readOnlyValueText}>{lineCalc.taxAmount.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.metricColWide}>
                    <Text style={styles.fieldLabel}>Total Amount</Text>
                    <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>{currencySymbol}</Text>
                      </View>
                      <Text style={styles.readOnlyValueText}>{lineCalc.totalAmount.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Row 4: Comments */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Comments</Text>
              <TextInput
                style={[styles.textInput, styles.commentsInput]}
                multiline
                value={item.comments || ''}
                onChangeText={(val) => handleUpdateItem(idx, { comments: val })}
                placeholder="Comments"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          );
        })}

        {/* Add Item Button */}
        <Pressable style={styles.addItemBtn} onPress={handleAddItem}>
          <Text style={styles.addItemBtnText}>+ Add Item</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* Section 5: Payment Info, Brochure, Terms & Financial Summary */}
        <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 40 }]}>
          {/* Left Column: Payment Status, Brochure, Next Payment Date */}
          <View style={styles.halfCol}>
            {docType === 'INVOICE' && (
              <View>
                <Text style={styles.fieldLabel}>Payment Status :</Text>
                <View style={styles.radioGroupRow}>
                  {(
                    [
                      { label: 'Unpaid', value: 'UNPAID' },
                      { label: 'Paid', value: 'PAID' },
                      { label: 'Half Paid', value: 'PARTIALLY_PAID' },
                    ] as const
                  ).map((st) => (
                    <Pressable
                      key={st.value}
                      style={styles.radioOption}
                      onPress={() => {
                        setPaymentStatus(st.value);
                        setPaymentMethodDropdownOpen(false);
                        setBrochureDropdownOpen(false);
                      }}
                    >
                      <View style={[styles.radioCircle, paymentStatus === st.value && styles.radioCircleSelected]}>{paymentStatus === st.value && <View style={styles.radioInnerDot} />}</View>
                      <Text style={styles.radioLabel}>{st.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Select Brochure Dropdown */}
            <View style={{ marginTop: 14, position: 'relative', zIndex: 60 }}>
              <Text style={styles.fieldLabel}>Select Brochure :</Text>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => {
                  setPaymentMethodDropdownOpen(false);
                  setBrochureDropdownOpen((o) => !o);
                }}
              >
                <Text style={[styles.dropdownTriggerText, !brochureId && styles.placeholderText]}>
                  {brochureId ? brochures.find((b) => b.id === brochureId)?.brochureName || 'Select Brochure' : 'Select Brochure'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>

              {brochureDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <Pressable
                    style={styles.dropdownOption}
                    onPress={() => {
                      setBrochureId(null);
                      setBrochureDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionSub}>None</Text>
                  </Pressable>
                  {brochures.map((b) => (
                    <Pressable
                      key={b.id}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setBrochureId(b.id);
                        setBrochureDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionTitle}>
                        {b.brochureName} ({b.type})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {docType === 'INVOICE' && paymentStatus !== 'UNPAID' && (
              <>
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.fieldLabel}>Payment Date :</Text>
                  <TextInput
                    accessibilityLabel="Payment Date"
                    style={styles.dateInput}
                    value={paymentDateDisplay}
                    onChangeText={setPaymentDateDisplay}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ marginTop: 14, position: 'relative', zIndex: 50 }}>
                  <Text style={styles.fieldLabel}>Accept payments via</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Accept payments via"
                    accessibilityState={{ expanded: paymentMethodDropdownOpen }}
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      setBrochureDropdownOpen(false);
                      setPaymentMethodDropdownOpen((open) => !open);
                    }}
                  >
                    <Text style={[styles.dropdownTriggerText, !paymentMethodId && styles.placeholderText]}>
                      {paymentMethods.find((method) => method.id === paymentMethodId)?.method ||
                        (paymentMethodId === existingDocument?.paymentMethodId ? existingDocument?.paymentMethodName : null) ||
                        'Select...'}
                    </Text>
                    <Ionicons name={paymentMethodDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </Pressable>
                  {paymentMethodDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {loadingPaymentMethods ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                      ) : paymentMethodsError ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            void refetchPaymentMethods();
                          }}
                          style={styles.dropdownOption}
                        >
                          <Text style={styles.dropdownOptionTitle}>Unable to load payment methods. Retry</Text>
                        </Pressable>
                      ) : !paymentMethods.some((method) => method.isActive !== false) ? (
                        <Text style={styles.emptyDropdownText}>No payment methods configured.</Text>
                      ) : (
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                          {paymentMethods
                            .filter((method) => method.isActive !== false)
                            .map((method) => (
                              <Pressable
                                key={method.id}
                                accessibilityRole="button"
                                accessibilityState={{
                                  selected: paymentMethodId === method.id,
                                }}
                                style={[styles.dropdownOption, paymentMethodId === method.id && styles.dropdownOptionActive]}
                                onPress={() => {
                                  setPaymentMethodId(method.id);
                                  setPaymentMethodDropdownOpen(false);
                                }}
                              >
                                <Text style={styles.dropdownOptionTitle}>{method.method}</Text>
                              </Pressable>
                            ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                <View style={{ marginTop: 14 }}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={[styles.prefixedInputWrap, paymentStatus === 'PAID' && styles.readOnlyWrap]}>
                    <View style={styles.prefixBox}>
                      <Text style={styles.prefixText}>{currencySymbol}</Text>
                    </View>
                    <TextInput
                      accessibilityLabel="Payment Amount"
                      style={styles.prefixedInput}
                      keyboardType="numeric"
                      editable={paymentStatus !== 'PAID'}
                      value={paymentStatus === 'PAID' ? calculations.grandTotal.toFixed(2) : paidAmountInput}
                      onChangeText={setPaidAmountInput}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Next Payment Date */}
            {docType === 'INVOICE' && paymentStatus !== 'PAID' && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Next Payment Date :</Text>
                <View style={styles.nextPaymentDateField}>
                  <TextInput
                    accessibilityLabel="Next Payment Date (DD-MM-YYYY)"
                    style={styles.nextPaymentDateInput}
                    value={nextPaymentDateDisplay}
                    onChangeText={setNextPaymentDateDisplay}
                    maxLength={10}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open next payment date calendar"
                    style={styles.nextPaymentDateCalendarButton}
                    onPress={() => {
                      setPaymentMethodDropdownOpen(false);
                      setBrochureDropdownOpen(false);
                      setNextPaymentDatePickerOpen(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primaryText} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Right Column: Totals & Static Signature Box */}
          <View style={styles.totalsAndSignatureCol}>
            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gross Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  {currencySymbol}
                  {calculations.grossSubtotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={styles.summaryValue}>
                  {currencySymbol}
                  {calculations.discountTotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Amount:</Text>
                <Text style={styles.summaryValue}>
                  {currencySymbol}
                  {calculations.taxableSubtotal.toFixed(2)}
                </Text>
              </View>
              {gstMode === 'IGST' && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>IGST Total:</Text>
                  <Text style={styles.summaryValue}>
                    {currencySymbol}
                    {calculations.igstTotal.toFixed(2)}
                  </Text>
                </View>
              )}
              {gstMode === 'SGST_CGST' && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>SGST Total:</Text>
                    <Text style={styles.summaryValue}>
                      {currencySymbol}
                      {calculations.sgstTotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CGST Total:</Text>
                    <Text style={styles.summaryValue}>
                      {currencySymbol}
                      {calculations.cgstTotal.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Tax:</Text>
                <Text style={styles.summaryValue}>
                  {currencySymbol}
                  {calculations.taxTotal.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                  {currencySymbol}
                  {calculations.grandTotal.toFixed(2)}
                </Text>
              </View>
              {docType === 'INVOICE' && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Received Amount:</Text>
                    <Text style={styles.summaryValue}>
                      {currencySymbol}
                      {calculations.receivedAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.dueAmountLabel}>Total Due / Outstanding:</Text>
                    <Text style={styles.dueAmountValue}>
                      {currencySymbol}
                      {calculations.dueAmount.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Signature uses the applicable invoice settings. */}
            <View style={styles.signatureBox}>
              {docType === 'INVOICE' ? (
                <InvoiceSignature signature={invoiceSettings?.signature} name={editingExisting ? existingDocument?.signatoryName : undefined} color={companyProfile?.fontColor} />
              ) : (
                <>
                  <Text style={styles.signatureCursiveText}>{DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
                  <Text style={styles.signatoryLabel}>Authorized Signatory</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Terms & Conditions Box */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.fieldLabel}>Terms &amp; Conditions</Text>
          <TextInput style={[styles.textInput, styles.termsInput]} multiline value={termsAndConditions} onChangeText={setTermsAndConditions} />
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.automationHeading}>Automation</Text>
          <View style={styles.automationRow}>
            <View style={styles.automationToggleGroup}>
              <Text style={styles.fieldLabel}>Email Automation</Text>
              <Switch value={emailAutomation} onValueChange={setEmailAutomation} trackColor={{ false: '#CBD5E1', true: colors.primary }} />
            </View>

            <View style={styles.automationToggleGroup}>
              <Text style={styles.fieldLabel}>Whatsapp Automation</Text>
              <Switch value={whatsappAutomation} onValueChange={setWhatsappAutomation} trackColor={{ false: '#CBD5E1', true: colors.primary }} />
            </View>
          </View>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {/* Footer Buttons: Generate & Download */}
        <View style={styles.footerActionsRow}>
          <Pressable
            style={[styles.outlineActionBtn, (isSaving || companyUnavailable || invoiceSettingsUnavailable) && { opacity: 0.6 }]}
            disabled={isSaving || Boolean(companyUnavailable) || invoiceSettingsUnavailable}
            onPress={() => handleSave(false)}
          >
            {isSaving ? <ActivityIndicator size="small" color="#0B2F7D" /> : <Text style={styles.outlineActionBtnText}>Generate</Text>}
          </Pressable>

          <Pressable
            style={[styles.outlineActionBtn, (isSaving || companyUnavailable || invoiceSettingsUnavailable) && { opacity: 0.6 }]}
            disabled={isSaving || Boolean(companyUnavailable) || invoiceSettingsUnavailable}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                setPreviewModalOpen(true);
              } else {
                handleSave(true);
              }
            }}
          >
            <Text style={styles.outlineActionBtnText}>Download</Text>
          </Pressable>
        </View>
      </View>

      <DateTimePickerModal
        visible={nextPaymentDatePickerOpen}
        value={nextPaymentDateDisplay}
        dateOnly
        title="Choose Next Payment Date"
        onSelect={setNextPaymentDateDisplay}
        onClose={() => setNextPaymentDatePickerOpen(false)}
      />

      {/* Printable Preview / Download Modal */}
      <Modal visible={previewModalOpen} transparent animationType="fade" onRequestClose={() => setPreviewModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.previewModalCard}>
            <View style={styles.previewHeaderBar}>
              <Text style={styles.previewHeaderTitle}>{docType === 'QUOTATION' ? 'Quotation Preview' : 'Invoice Preview'}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {Platform.OS === 'web' && (
                  <Pressable
                    style={styles.navyButton}
                    onPress={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                  >
                    <Ionicons name="print-outline" size={16} color={colors.white} />
                    <Text style={styles.navyButtonText}>Print / Save PDF</Text>
                  </Pressable>
                )}
                <Pressable style={styles.outlineActionBtn} onPress={() => setPreviewModalOpen(false)}>
                  <Text style={styles.outlineActionBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 540 }}>
              <View style={printStyles.printableSheet}>
                {previewCompany ? <InvoiceCompanyDetails profile={previewCompany} /> : null}
                <View style={printStyles.divider} />
                <Text style={printStyles.fieldLabel}>
                  Billed To:{' '}
                  {selectedCustomer ? `${selectedCustomer.companyName || selectedCustomer.lead?.companyName || ''} - ${selectedCustomer.name || selectedCustomer.lead?.name || ''}` : 'Customer'}
                </Text>
                <Text style={printStyles.companyMetaText}>Date: {dateDisplay}</Text>
                <Text style={printStyles.companyMetaText}>
                  GST Mode: {gstMode === 'NON_GST' ? 'Non GST' : gstMode === 'IGST' ? 'IGST' : 'SGST/CGST'} {inclusiveGst && gstMode !== 'NON_GST' ? '(Inclusive GST)' : ''}
                </Text>
                <View style={printStyles.divider} />

                {/* Items Breakdown Table */}
                {effectiveItems.map((it, i) => {
                  const b = calculations.lineBreakdowns[i] || {
                    taxableAmount: 0,
                    taxAmount: 0,
                    totalAmount: 0,
                  };
                  return (
                    <View key={i} style={printStyles.summaryRow}>
                      <Text style={printStyles.summaryLabel}>
                        {i + 1}. {it.productName || 'Item'} {Boolean(it.hsnSac && gstMode !== 'NON_GST') && `[HSN: ${it.hsnSac}]`} (Qty: {it.quantity} × {currencySymbol}
                        {it.unitPrice})
                        {gstMode !== 'NON_GST' && it.hsnDescription ? `\n${it.hsnDescription}` : ''}
                      </Text>
                      <Text style={printStyles.summaryValueBold}>
                        {currencySymbol}
                        {b.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}

                <View style={printStyles.divider} />
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Gross Subtotal:</Text>
                  <Text style={printStyles.summaryValue}>
                    {currencySymbol}
                    {calculations.grossSubtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Discount:</Text>
                  <Text style={printStyles.summaryValue}>
                    {currencySymbol}
                    {calculations.discountTotal.toFixed(2)}
                  </Text>
                </View>
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Taxable Base:</Text>
                  <Text style={printStyles.summaryValue}>
                    {currencySymbol}
                    {calculations.taxableSubtotal.toFixed(2)}
                  </Text>
                </View>
                {gstMode === 'IGST' && (
                  <View style={printStyles.summaryRow}>
                    <Text style={printStyles.summaryLabel}>IGST Total:</Text>
                    <Text style={printStyles.summaryValue}>
                      {currencySymbol}
                      {calculations.igstTotal.toFixed(2)}
                    </Text>
                  </View>
                )}
                {gstMode === 'SGST_CGST' && (
                  <>
                    <View style={printStyles.summaryRow}>
                      <Text style={printStyles.summaryLabel}>SGST Total:</Text>
                      <Text style={printStyles.summaryValue}>
                        {currencySymbol}
                        {calculations.sgstTotal.toFixed(2)}
                      </Text>
                    </View>
                    <View style={printStyles.summaryRow}>
                      <Text style={printStyles.summaryLabel}>CGST Total:</Text>
                      <Text style={printStyles.summaryValue}>
                        {currencySymbol}
                        {calculations.cgstTotal.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
                <View style={[printStyles.summaryRow, printStyles.grandTotalRow]}>
                  <Text style={printStyles.grandTotalLabel}>Grand Total:</Text>
                  <Text style={printStyles.grandTotalValue}>
                    {currencySymbol}
                    {calculations.grandTotal.toFixed(2)}
                  </Text>
                </View>

                {/* Bank Details in Preview */}
                <View style={printStyles.divider} />
                <Text style={[printStyles.fieldLabel, { marginBottom: 4 }]}>Payment Details:</Text>
                <Text style={printStyles.companyMetaText}>
                  Bank: {previewBank.bankName} | A/C: {previewBank.accountNo} | IFSC: {previewBank.ifscCode}
                </Text>
                {previewBank.paymentUpiId ? <Text style={printStyles.companyMetaText}>UPI ID: {previewBank.paymentUpiId}</Text> : null}
                {docType === 'INVOICE' ? (
                  <InvoiceSignature
                    signature={previewInvoiceSettings?.signature}
                    name={savedDocument?.signatoryName ?? (editingExisting ? existingDocument?.signatoryName : undefined)}
                    color={previewCompany?.fontColor}
                  />
                ) : (
                  <Text style={[printStyles.companyMetaText, { marginTop: 8 }]}>Authorized Signatory: {DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
                )}
                {docType === 'INVOICE' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={printStyles.fieldLabel}>Terms & Conditions</Text>
                    <Text style={printStyles.companyMetaText}>{savedDocument?.termsAndConditions ?? termsAndConditions}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  pageContent: {
    padding: 24,
    backgroundColor: '#F7F9FC',
  },
  mainCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 10,
    padding: 24,
  },
  sectionRow: {
    flexDirection: 'column',
    gap: 20,
  },
  sectionRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyBlock: {
    flex: 1,
    maxWidth: 520,
  },
  logoBox: {
    width: 140,
    height: 96,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  cloudBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E4EFFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoTextTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B2F7D',
  },
  logoTextSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  companyNameHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E1B3D',
    marginBottom: 4,
  },
  companyMetaText: {
    fontSize: 12,
    color: '#56627C',
    lineHeight: 18,
  },
  dateBlock: {
    width: 170,
  },
  dateInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E1B3D',
    backgroundColor: colors.white,
  },
  nextPaymentDateField: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  nextPaymentDateInput: {
    flex: 1,
    width: 0,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E1B3D',
  },
  nextPaymentDateCalendarButton: {
    width: 42,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderColor: '#DCE3F0',
  },
  divider: {
    height: 1,
    backgroundColor: '#DCE3F0',
    marginVertical: 20,
  },
  halfCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  fieldLabelInline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  requiredStar: {
    color: '#B3261E',
  },
  dropdownTrigger: {
    height: 42,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  discountDropdownAnchor: {
    position: 'relative',
  },
  discountDropdownLayer: {
    zIndex: 50,
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#0E1B3D',
  },
  placeholderText: {
    color: '#64748B',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    backgroundColor: colors.white,
    padding: 6,
    zIndex: 9999,
    elevation: 10,
    boxShadow: '0 6px 20px rgba(11,47,125,0.14)',
  },
  dropdownSearchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 6,
    color: '#0E1B3D',
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  dropdownOptionActive: {
    backgroundColor: '#E4EFFD',
  },
  dropdownOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E1B3D',
  },
  dropdownOptionSub: {
    fontSize: 12,
    color: '#56627C',
  },
  emptyDropdownText: {
    padding: 10,
    fontSize: 12,
    color: '#56627C',
    textAlign: 'center',
  },
  customerSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
  },
  customerSummaryText: {
    fontSize: 12,
    color: '#0E1B3D',
    fontWeight: '500',
    flexShrink: 1,
  },
  bankInfoGrid: {
    marginTop: 4,
    gap: 6,
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankInfoKey: {
    width: 110,
    fontSize: 13,
    color: '#56627C',
  },
  bankInfoVal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  radioGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0B2F7D',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B2F7D',
  },
  radioLabel: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  inclusiveToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  itemCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  itemRemoveTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  itemTopRow: {
    flexDirection: 'column',
    gap: 12,
    paddingRight: 28,
    marginBottom: 12,
  },
  itemTopRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemMetricsRow: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },
  itemMetricsRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricCol: {
    flex: 1,
    minWidth: 120,
  },
  metricColQty: {
    width: 130,
    flexShrink: 0,
  },
  metricColSmall: {
    flex: 1,
    minWidth: 100,
  },
  metricColWide: {
    flex: 1.5,
    minWidth: 140,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E1B3D',
    backgroundColor: colors.white,
  },
  prefixedInputWrap: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  prefixBox: {
    width: 36,
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#DCE3F0',
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#56627C',
  },
  prefixedInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0E1B3D',
  },
  suffixedInputWrap: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
  },
  suffixedInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E1B3D',
    height: '100%',
  },
  suffixPercentText: {
    fontSize: 13,
    color: '#56627C',
    fontWeight: '600',
    marginLeft: 4,
  },
  qtyStepperRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 34,
    flexShrink: 0,
    height: '100%',
    backgroundColor: '#0B2F7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnMuted: {
    width: 34,
    flexShrink: 0,
    height: '100%',
    backgroundColor: '#0B2F7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyDirectInput: {
    flex: 1,
    width: 0,
    minWidth: 0,
    height: '100%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#0E1B3D',
    backgroundColor: colors.white,
  },
  readOnlyWrap: {
    backgroundColor: '#F8FAFC',
  },
  readOnlyValueText: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  commentsInput: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  addItemBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B2F7D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  addItemBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  totalsAndSignatureCol: {
    flex: 1,
    gap: 16,
  },
  summaryTable: {
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F8FAFD',
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#56627C',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E1B3D',
  },
  summaryValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B2F7D',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#DCE3F0',
    paddingTop: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B2F7D',
  },
  dueAmountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B3261E',
  },
  dueAmountValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B3261E',
  },
  signatureBox: {
    height: 84,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  signatureCursiveText: {
    fontStyle: 'italic',
    fontSize: 20,
    color: '#0B2F7D',
    fontWeight: '700',
  },
  signatoryLabel: {
    fontSize: 11,
    color: '#56627C',
    marginTop: 4,
  },
  termsInput: {
    height: 84,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  automationHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1B3D',
    marginBottom: 10,
  },
  automationRow: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  automationToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#FBECE8',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.40)',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  errorBannerText: {
    color: '#B3261E',
    fontSize: 13,
    fontWeight: '600',
  },
  footerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  outlineActionBtn: {
    height: 40,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  outlineActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E1B3D',
  },
  navyButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#0B2F7D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,27,69,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0E1B3D',
  },
  printableSheet: {
    padding: 24,
    backgroundColor: colors.white,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E1B3D',
  },
});
