// // apps/client/src/invoices/InvoiceFormScreen.tsx
// import React, { useMemo, useState } from 'react';
// import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useQuery } from '@tanstack/react-query';
// import { fetchInvoiceHsnMaster, INVOICE_HSN_MASTER_KEY } from '@/api/hsnMaster';
// import { ProfileSelect } from '@/settings/ProfileFields';
// import { INDIA_STATES } from '@/settings/profileOptions';
// import { Href, useRouter } from 'expo-router';
// import { colors } from '@/theme/colors';
// import { errorMessage } from '@/api/client';
// import { useInvoiceCompanyProfile } from '@/hooks/useInvoiceCompanyProfile';
// import { useInvoiceGstSettings } from '@/hooks/useInvoiceGstSettings';
// import { useInvoiceNonGstSettings } from '@/hooks/useInvoiceNonGstSettings';
// import InvoiceSignature from './InvoiceSignature';
// import InvoiceCompanyDetails from './InvoiceCompanyDetails';
// import { getDocumentCompanyProfile, getDocumentInvoiceSettings } from './companyProfile';
// import { invoiceBranding } from './invoiceBranding';
// import DateTimePickerModal from '@/components/DateTimePickerModal';
// import { useCustomers } from '@/hooks/useCustomers';
// import { useBrochures, useCreateSalesDocument, usePaymentMethods, useUpdateSalesDocument } from '@/hooks/useSalesDocuments';
// import {
//   calculateInvoicePreview,
//   CreateSalesDocumentPayload,
//   DEFAULT_DOCUMENT_CONFIG,
//   DiscountType,
//   GstMode,
//   InvoicePaymentStatus,
//   SalesDocumentItem,
//   SalesDocumentRecord,
//   SalesDocumentType,
//   UpdateSalesDocumentPayload,
// } from '@/types/salesDocuments';

// interface InvoiceFormScreenProps {
//   initialType?: SalesDocumentType;
//   existingDocument?: SalesDocumentRecord;
//   isClone?: boolean;
// }

// type InvoiceFormItem = SalesDocumentItem;

// const DISCOUNT_OPTIONS: { label: string; value: DiscountType }[] = [
//   { label: 'Overall Discount', value: 'OVERALL' },
//   { label: 'Per Item Discount', value: 'FLAT_PER_UNIT' },
// ];

// function getTodayIstFormatted(): { display: string; isoDate: string } {
//   const now = new Date();
//   const istTime = new Date(now.getTime() + 330 * 60 * 1000);
//   const yyyy = istTime.getUTCFullYear();
//   const mm = String(istTime.getUTCMonth() + 1).padStart(2, '0');
//   const dd = String(istTime.getUTCDate()).padStart(2, '0');
//   return {
//     display: `${dd}-${mm}-${yyyy}`,
//     isoDate: `${yyyy}-${mm}-${dd}`,
//   };
// }

// function ddmmyyyyToIso(input: string): string {
//   const parts = input.trim().split('-');
//   if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
//     return `${parts[2]}-${parts[1]}-${parts[0]}`;
//   }
//   return input;
// }

// function isoToDdmmyyyy(iso?: string | null): string {
//   if (!iso) return '';
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return iso;
//   const ist = new Date(d.getTime() + 330 * 60 * 1000);
//   const dd = String(ist.getUTCDate()).padStart(2, '0');
//   const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
//   const yyyy = ist.getUTCFullYear();
//   return `${dd}-${mm}-${yyyy}`;
// }

// export function InvoiceFormScreen({ initialType = 'INVOICE', existingDocument, isClone = false }: InvoiceFormScreenProps) {
//   const router = useRouter();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 768;
//   const editingExisting = Boolean(existingDocument && !isClone);
//   const companyQuery = useInvoiceCompanyProfile(!editingExisting);
//   const companyProfile = editingExisting && existingDocument ? getDocumentCompanyProfile(existingDocument) : companyQuery.data;
//   const companyUnavailable = !editingExisting && (companyQuery.isFetching || companyQuery.isError || !companyProfile?.companyName);
//   const [savedDocument, setSavedDocument] = useState<SalesDocumentRecord | null>(null);
//   const previewCompany = savedDocument ? getDocumentCompanyProfile(savedDocument) : companyProfile;
//   const printStyles = useMemo(() => invoiceBranding(styles, previewCompany), [previewCompany]);

//   const today = useMemo(() => getTodayIstFormatted(), []);
//   const [docType] = useState<SalesDocumentType>(existingDocument?.type ?? initialType);
//   const [dateDisplay, setDateDisplay] = useState<string>(existingDocument ? isoToDdmmyyyy(existingDocument.issueDate) : today.display);
//   const [customerId, setCustomerId] = useState<string>(existingDocument?.customerId ?? '');
//   const [customerState, setCustomerState] = useState<string>(
//     existingDocument?.customerState ?? (existingDocument as any)?.state ?? ''
//   );
//   const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
//   const [customerSearch, setCustomerSearch] = useState('');

//   const applyGstModeForState = (cState: string, compState?: string) => {
//     const sellerState = (compState || companyProfile?.state || '').trim().toLowerCase();
//     const buyerState = (cState || '').trim().toLowerCase();
//     if (sellerState && buyerState) {
//       if (sellerState === buyerState) {
//         setGstMode('SGST_CGST');
//       } else {
//         setGstMode('IGST');
//       }
//     }
//   };

//   const [gstMode, setGstMode] = useState<GstMode>(existingDocument?.gstMode ?? (existingDocument as any)?.gstType ?? 'NON_GST');
//   const [inclusiveGst, setInclusiveGst] = useState<boolean>(existingDocument?.inclusiveGst ?? false);
//   const hsnQuery = useQuery({ queryKey: INVOICE_HSN_MASTER_KEY, queryFn: fetchInvoiceHsnMaster });
//   const isGstInvoice = docType === 'INVOICE' && gstMode !== 'NON_GST';
//   const gstQuery = useInvoiceGstSettings(isGstInvoice && !editingExisting);
//   const nonGstQuery = useInvoiceNonGstSettings(docType === 'INVOICE' && !isGstInvoice && !editingExisting);
//   const settingsQuery = isGstInvoice ? gstQuery : nonGstQuery;
//   const invoiceSettings = docType === 'INVOICE' ? (editingExisting && existingDocument ? getDocumentInvoiceSettings(existingDocument) : settingsQuery.data) : null;
//   const invoiceSettingsUnavailable = docType === 'INVOICE' && !editingExisting && (settingsQuery.isFetching || settingsQuery.isError || !invoiceSettings);
//   const documentBank = invoiceSettings ?? {
//     bankName: editingExisting ? (existingDocument?.bankName ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.bankName,
//     accountNo: editingExisting ? (existingDocument?.bankAccountNo ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.accountNo,
//     ifscCode: editingExisting ? (existingDocument?.bankIfsc ?? '') : docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.ifscCode,
//     paymentUpiId: '',
//     signature: '',
//   };
//   const previewInvoiceSettings = savedDocument ? getDocumentInvoiceSettings(savedDocument) : invoiceSettings;
//   const previewBank =
//     docType === 'INVOICE' && savedDocument
//       ? {
//           bankName: savedDocument.bankName,
//           accountNo: savedDocument.bankAccountNo,
//           ifscCode: savedDocument.bankIfsc,
//           paymentUpiId: previewInvoiceSettings?.paymentUpiId ?? '',
//         }
//       : documentBank;

//   const [currencyOverride, setCurrency] = useState<string | null>(existingDocument?.currency ?? null);
//   const currency = currencyOverride ?? invoiceSettings?.invoiceCurrency ?? 'INR';
//   const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
//   const [discountDropdownIndex, setDiscountDropdownIndex] = useState<number | null>(null);

//   const [items, setItems] = useState<InvoiceFormItem[]>(
//     existingDocument?.items?.length
//       ? existingDocument.items.map((it) => ({
//           id: it.id,
//           productName: it.productName,
//           hsnSac: it.hsnSac || '',
//           hsnMasterId: it.hsnMasterId,
//           hsnDescription: it.hsnDescription || '',
//           unitPrice: it.unitPrice,
//           quantity: it.quantity,
//           discountValue: it.discountValue,
//           discountType: it.discountType === 'FIXED' ? 'OVERALL' : it.discountType || 'OVERALL',
//           igstRate: it.igstRate ?? 18,
//           sgstRate: it.sgstRate ?? 9,
//           cgstRate: it.cgstRate ?? 9,
//           comments: it.comments || '',
//         }))
//       : [
//           {
//             productName: '',
//             hsnSac: '',
//             unitPrice: 0,
//             quantity: 1,
//             discountValue: 0,
//             discountType: 'OVERALL',
//             igstRate: 0,
//             sgstRate: 0,
//             cgstRate: 0,
//             comments: '',
//           },
//         ],
//   );

//   const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>(existingDocument?.paymentStatus === 'HALF_PAID' ? 'PARTIALLY_PAID' : (existingDocument?.paymentStatus ?? 'UNPAID'));
//   const [paidAmountInput, setPaidAmountInput] = useState<string>(existingDocument?.paidAmount ? String(existingDocument.paidAmount) : '0');
//   const [paymentMethodId, setPaymentMethodId] = useState<string | null>(existingDocument?.paymentMethodId ?? null);
//   const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
//   const [paymentDateDisplay, setPaymentDateDisplay] = useState<string>(existingDocument?.paymentDate ? isoToDdmmyyyy(existingDocument.paymentDate) : today.display);
//   const [brochureId, setBrochureId] = useState<string | null>(existingDocument?.brochureId ?? null);
//   const [brochureDropdownOpen, setBrochureDropdownOpen] = useState(false);
//   const [nextPaymentDateDisplay, setNextPaymentDateDisplay] = useState<string>(existingDocument?.nextPaymentDate ? isoToDdmmyyyy(existingDocument.nextPaymentDate) : '');
//   const [nextPaymentDatePickerOpen, setNextPaymentDatePickerOpen] = useState(false);

//   const [termsOverride, setTermsAndConditions] = useState<string | null>(existingDocument?.termsAndConditions ?? null);
//   const termsAndConditions = termsOverride ?? invoiceSettings?.termsAndConditions ?? (docType === 'INVOICE' ? '' : DEFAULT_DOCUMENT_CONFIG.defaultTerms);
//   const effectiveItems = useMemo(
//     () =>
//       items.map((item) => {
//         if (!item.hsnMasterId || (editingExisting && gstMode === existingDocument?.gstMode && !item.applyHsnMaster)) return item;
//         const master = hsnQuery.data?.find((entry) => entry.id === item.hsnMasterId);
//         return master ? { ...item, hsnSac: master.code, hsnDescription: master.description, igstRate: master.igstRate, sgstRate: master.sgstRate, cgstRate: master.cgstRate } : item;
//       }),
//     [items, editingExisting, gstMode, existingDocument?.gstMode, hsnQuery.data],
//   );
//   const [emailAutomation, setEmailAutomation] = useState<boolean>(existingDocument?.emailAutomation ?? false);
//   const [whatsappAutomation, setWhatsappAutomation] = useState<boolean>(existingDocument?.whatsappAutomation ?? false);

//   const [formError, setFormError] = useState<string | null>(null);
//   const [previewModalOpen, setPreviewModalOpen] = useState(false);

//   const { data: customerPage, isLoading: loadingCustomers } = useCustomers({
//     search: '',
//     page: 1,
//     pageSize: 100,
//   });
//   const customers = useMemo(() => {
//     return (Array.isArray(customerPage) ? customerPage : customerPage?.items) ?? [];
//   }, [customerPage]);

//   const { data: brochures = [] } = useBrochures();
//   const { data: paymentMethods = [], isLoading: loadingPaymentMethods, isError: paymentMethodsError, refetch: refetchPaymentMethods } = usePaymentMethods();
//   const createMutation = useCreateSalesDocument();
//   const updateMutation = useUpdateSalesDocument();

//   const selectedCustomer = useMemo(() => {
//     return (customers as any[]).find((c) => c.id === customerId);
//   }, [customers, customerId]);

//   const filteredCustomers = useMemo(() => {
//     const q = customerSearch.trim().toLowerCase();
//     if (!q) return customers as any[];
//     return (customers as any[]).filter((c) => {
//       const name = (c.name || c.lead?.name || '').toLowerCase();
//       const company = (c.companyName || c.lead?.companyName || '').toLowerCase();
//       const phone = (c.phone || c.lead?.phone || '').toLowerCase();
//       return name.includes(q) || company.includes(q) || phone.includes(q);
//     });
//   }, [customers, customerSearch]);

//   const currencySymbol = useMemo(() => {
//     switch (currency) {
//       case 'USD':
//         return '$';
//       case 'EUR':
//         return '€';
//       default:
//         return '₹';
//     }
//   }, [currency]);

//   // Authoritative pure client calculation matching backend
//   const calculations = useMemo(() => {
//     return calculateInvoicePreview({
//       items: effectiveItems,
//       gstMode,
//       inclusiveGst,
//       docType,
//       paymentStatus,
//       paidAmountInput: Number(paidAmountInput) || 0,
//     });
//   }, [effectiveItems, gstMode, inclusiveGst, docType, paymentStatus, paidAmountInput]);

//   const handleUpdateItem = (idx: number, patch: Partial<SalesDocumentItem>) => {
//     setItems((prev) => {
//       const copy = [...prev];
//       copy[idx] = {
//         ...effectiveItems[idx],
//         ...patch,
//       };
//       return copy;
//     });
//   };

//   const handleRemoveItem = (idx: number) => {
//     setDiscountDropdownIndex(null);
//     if (items.length <= 1) {
//       setItems([
//         {
//           productName: '',
//           hsnSac: '',
//           unitPrice: 0,
//           quantity: 1,
//           discountValue: 0,
//           discountType: 'OVERALL',
//           igstRate: 0,
//           sgstRate: 0,
//           cgstRate: 0,
//           comments: '',
//         },
//       ]);
//     } else {
//       setItems((prev) => prev.filter((_, i) => i !== idx));
//     }
//   };

//   const handleAddItem = () => {
//     setDiscountDropdownIndex(null);
//     setItems((prev) => [
//       ...prev,
//       {
//         productName: '',
//         hsnSac: '',
//         unitPrice: 0,
//         quantity: 1,
//         discountValue: 0,
//         discountType: 'OVERALL',
//         igstRate: 0,
//         sgstRate: 0,
//         cgstRate: 0,
//         comments: '',
//       },
//     ]);
//   };

//   const handleSave = async (openPreviewAfter = false) => {
//     setDiscountDropdownIndex(null);
//     setPaymentMethodDropdownOpen(false);
//     setFormError(null);

//     if (companyUnavailable) {
//       setFormError(companyQuery.isFetching ? 'Loading company profile. Please wait.' : 'Save the Company Profile in General Settings → Web Settings before creating this document.');
//       return;
//     }
//     if (invoiceSettingsUnavailable) {
//       setFormError(
//         settingsQuery.isFetching
//           ? 'Loading Invoice Settings. Please wait.'
//           : settingsQuery.isError
//             ? errorMessage(settingsQuery.error)
//             : `Save ${isGstInvoice ? 'GST' : 'Non GST'} Invoice settings in Web Settings → Invoice Settings before creating this invoice.`,
//       );
//       return;
//     }

//     if (!customerId) {
//       setFormError('Please select a customer for this document.');
//       return;
//     }

//     const validItems = effectiveItems.filter((it) => it.productName.trim().length > 0);
//     if (validItems.length === 0) {
//       setFormError('Please add at least one line item with a product name.');
//       return;
//     }

//     if (gstMode !== 'NON_GST') {
//       const needsMaster = validItems.filter((item) => {
//         const original = editingExisting ? existingDocument?.items.find((row) => row.id === item.id) : undefined;
//         return !original || item.applyHsnMaster || gstMode !== existingDocument?.gstMode || original.hsnMasterId !== item.hsnMasterId;
//       });
//       if (needsMaster.length && (hsnQuery.isPending || hsnQuery.isError)) {
//         setFormError(hsnQuery.isError ? errorMessage(hsnQuery.error) : 'Loading HSN master. Please wait.');
//         return;
//       }
//       if (needsMaster.some((item) => !hsnQuery.data?.some((entry) => entry.id === item.hsnMasterId))) {
//         setFormError('Select an active HSN from HSN Master for each item. Add entries in Invoice Settings first.');
//         return;
//       }
//       const missingHsn = validItems.some((it) => !it.hsnSac?.trim());
//       if (missingHsn) {
//         setFormError('HSN/SAC Code is required for all items in GST mode.');
//         return;
//       }
//     }

//     const hasPayment = docType === 'INVOICE' && paymentStatus !== 'UNPAID';
//     const nextPaymentDate = docType === 'INVOICE' && paymentStatus !== 'PAID' && nextPaymentDateDisplay.trim() ? ddmmyyyyToIso(nextPaymentDateDisplay) : null;
//     if (nextPaymentDate !== null) {
//       const parsedNextDate = new Date(nextPaymentDate);
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(nextPaymentDate) || Number.isNaN(parsedNextDate.getTime()) || parsedNextDate.toISOString().slice(0, 10) !== nextPaymentDate) {
//         setFormError('Please enter a valid next payment date in DD-MM-YYYY format.');
//         return;
//       }
//     }
//     const paymentDate = hasPayment ? ddmmyyyyToIso(paymentDateDisplay) : null;
//     if (paymentDate !== null) {
//       const parsedDate = new Date(paymentDate);
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== paymentDate) {
//         setFormError('Please enter a valid payment date in DD-MM-YYYY format.');
//         return;
//       }
//     }

//     const payload: CreateSalesDocumentPayload = {
//       requestKey: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
//       type: docType,
//       customerId,
//       customerState: customerState.trim() || undefined,
//       issueDate: ddmmyyyyToIso(dateDisplay),
//       paymentDate,
//       nextPaymentDate,
//       gstMode,
//       gstType: gstMode,
//       inclusiveGst: gstMode === 'NON_GST' ? false : inclusiveGst,
//       currency,
//       paymentStatus: docType === 'QUOTATION' ? ('UNPAID' as InvoicePaymentStatus) : paymentStatus,
//       paidAmount: docType === 'INVOICE' && paymentStatus === 'PARTIALLY_PAID' ? Number(paidAmountInput) || 0 : paymentStatus === 'PAID' ? calculations.grandTotal : 0,
//       paymentMethodId,
//       brochureId: brochureId || null,
//       termsAndConditions,
//       emailAutomation,
//       whatsappAutomation,
//       items: validItems.map((it) => ({
//         id: editingExisting ? it.id : undefined,
//         productName: it.productName.trim(),
//         hsnSac: gstMode === 'NON_GST' ? '' : it.hsnSac.trim(),
//         hsnMasterId: gstMode === 'NON_GST' ? undefined : it.hsnMasterId,
//         hsnDescription: gstMode === 'NON_GST' ? '' : it.hsnDescription,
//         applyHsnMaster: it.applyHsnMaster,
//         unitPrice: Number(it.unitPrice) || 0,
//         quantity: Math.max(1, Number(it.quantity) || 1),
//         discountValue: Number(it.discountValue) || 0,
//         discountType: it.discountType || 'OVERALL',
//         igstRate: gstMode === 'IGST' ? Number(it.igstRate) || 0 : 0,
//         sgstRate: gstMode === 'SGST_CGST' ? Number(it.sgstRate) || 0 : 0,
//         cgstRate: gstMode === 'SGST_CGST' ? Number(it.cgstRate) || 0 : 0,
//         comments: it.comments?.trim() || '',
//       })),
//     };

//     try {
//       let saved: SalesDocumentRecord;
//       if (existingDocument && !isClone) {
//         saved = await updateMutation.mutateAsync({
//           id: existingDocument.id,
//           payload: {
//             ...payload,
//             version: existingDocument.version,
//           } as UpdateSalesDocumentPayload,
//         });
//       } else {
//         saved = await createMutation.mutateAsync(payload);
//       }
//       setSavedDocument(saved);

//       if (openPreviewAfter) {
//         setPreviewModalOpen(true);
//       } else {
//         router.push((docType === 'QUOTATION' ? '/invoice/quotation' : '/invoice') as Href);
//       }
//     } catch (err: unknown) {
//       setFormError(errorMessage(err));
//     }
//   };

//   const isSaving = createMutation.isPending || updateMutation.isPending;

//   return (
//     <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
//       {/* Main Pure White Container Card */}
//       <View style={styles.mainCard}>
//         {/* Section 1: Company Branding & Document Date */}
//         <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop]}>
//           <View style={styles.companyBlock}>
//             {companyProfile ? <InvoiceCompanyDetails profile={companyProfile} /> : null}
//             {!editingExisting && companyQuery.isFetching ? <ActivityIndicator accessibilityLabel="Loading company profile" color={colors.primary} /> : null}
//             {!editingExisting && !companyQuery.isFetching && (companyQuery.isError || !companyProfile) ? (
//               <View style={{ gap: 8 }}>
//                 <Text accessibilityRole="alert" style={styles.errorBannerText}>
//                   {companyQuery.isError ? errorMessage(companyQuery.error) : 'Save Company Profile in General Settings → Web Settings to create invoices.'}
//                 </Text>
//                 <Pressable
//                   accessibilityRole="button"
//                   onPress={() => {
//                     void companyQuery.refetch();
//                   }}
//                 >
//                   <Text style={styles.outlineActionBtnText}>Reload company profile</Text>
//                 </Pressable>
//               </View>
//             ) : null}
//           </View>

//           <View style={styles.dateBlock}>
//             <Text style={styles.fieldLabel}>
//               Date <Text style={styles.requiredStar}>*</Text>
//             </Text>
//             <TextInput style={styles.dateInput} value={dateDisplay} onChangeText={setDateDisplay} placeholder="DD-MM-YYYY" placeholderTextColor={colors.textMuted} />
//           </View>
//         </View>

//         <View style={styles.divider} />

//         {/* Section 2: Invoice To (Floating Customer Dropdown) & Static Payment Details */}
//         <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 100 }]}>
//           <View style={[styles.halfCol, { position: 'relative', zIndex: 110 }]}>
//             <Text style={styles.fieldLabel}>{docType === 'QUOTATION' ? 'Quotation To:' : 'Invoice To:'}</Text>

//             <View style={{ position: 'relative', zIndex: 120 }}>
//               <Pressable style={styles.dropdownTrigger} onPress={() => setCustomerDropdownOpen((o) => !o)}>
//                 <Text style={[styles.dropdownTriggerText, !selectedCustomer && styles.placeholderText]}>
//                   {selectedCustomer
//                     ? `${selectedCustomer.companyName || selectedCustomer.lead?.companyName || ''} ${
//                         selectedCustomer.name || selectedCustomer.lead?.name || ''
//                       } (${selectedCustomer.phone || selectedCustomer.lead?.phone || ''})`.trim()
//                     : 'Select...'}
//                 </Text>
//                 <Ionicons name={customerDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
//               </Pressable>

//               {customerDropdownOpen && (
//                 <View style={styles.dropdownMenu}>
//                   <TextInput
//                     style={styles.dropdownSearchInput}
//                     value={customerSearch}
//                     onChangeText={setCustomerSearch}
//                     placeholder="Search existing customer by name, company, mobile..."
//                     placeholderTextColor={colors.textMuted}
//                   />
//                   {loadingCustomers ? (
//                     <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
//                   ) : filteredCustomers.length === 0 ? (
//                     <Text style={styles.emptyDropdownText}>No existing customers found</Text>
//                   ) : (
//                     <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
//                       {filteredCustomers.map((cust: any) => {
//                         const cName = cust.name || cust.lead?.name || 'Customer';
//                         const cComp = cust.companyName || cust.lead?.companyName || '';
//                         const cPhone = cust.phone || cust.lead?.phone || '';
//                         const isSelected = cust.id === customerId;
//                         return (
//                           <Pressable
//                             key={cust.id}
//                             style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
//                             onPress={() => {
//                               const cState = cust.lead?.state || cust.state || '';
//                               setCustomerId(cust.id);
//                               if (cState) {
//                                 setCustomerState(cState);
//                                 applyGstModeForState(cState);
//                               }
//                               if (!editingExisting && cust.lead?.service) {
//                                 const s = cust.lead.service;
//                                 setItems((prev) => {
//                                   if (prev.length === 1 && !prev[0].productName.trim()) {
//                                     return [
//                                       {
//                                         ...prev[0],
//                                         productName: s.name,
//                                         hsnSac: (s as any).hsnSac || '',
//                                         hsnDescription: (s as any).description || s.name,
//                                         hsnMasterId: s.id,
//                                         igstRate: Number((s as any).igstRate ?? 18),
//                                         sgstRate: Number((s as any).sgstRate ?? 9),
//                                         cgstRate: Number((s as any).cgstRate ?? 9),
//                                         applyHsnMaster: true,
//                                       },
//                                     ];
//                                   }
//                                   return prev;
//                                 });
//                               }
//                               setCustomerDropdownOpen(false);
//                             }}
//                           >
//                             <Text style={styles.dropdownOptionTitle}>{cComp ? `${cComp} — ${cName}` : cName}</Text>
//                             {Boolean(cPhone) && <Text style={styles.dropdownOptionSub}>{cPhone}</Text>}
//                           </Pressable>
//                         );
//                       })}
//                     </ScrollView>
//                   )}
//                 </View>
//               )}
//             </View>

//             {Boolean(selectedCustomer) && (
//               <>
//                 <View style={styles.customerSummaryPill}>
//                   <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
//                   <Text style={styles.customerSummaryText}>
//                     {[
//                       selectedCustomer.companyName || selectedCustomer.lead?.companyName,
//                       selectedCustomer.name || selectedCustomer.lead?.name,
//                       selectedCustomer.phone || selectedCustomer.lead?.phone,
//                       selectedCustomer.address || selectedCustomer.lead?.address,
//                     ]
//                       .filter(Boolean)
//                       .join(' • ')}
//                   </Text>
//                 </View>

//                 <View style={{ gap: 6, marginTop: 8 }}>
//                   <ProfileSelect
//                     label="Customer State (for GST auto-calculation)"
//                     allowCustom={true}
//                     value={customerState}
//                     options={INDIA_STATES}
//                     onChange={(val) => {
//                       setCustomerState(val);
//                       applyGstModeForState(val);
//                     }}
//                   />
//                   {Boolean(companyProfile?.state) && Boolean(customerState) && (
//                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
//                       <Ionicons
//                         name={customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? 'business' : 'airplane'}
//                         size={14}
//                         color={colors.primary}
//                       />
//                       <Text style={{ fontSize: 11, color: colors.primaryText }}>
//                         Company: <Text style={{ fontWeight: '700' }}>{companyProfile?.state}</Text> | Customer: <Text style={{ fontWeight: '700' }}>{customerState}</Text>
//                         {' → '}
//                         <Text style={{ fontWeight: '700', color: customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? '#15803D' : '#1D4ED8' }}>
//                           {customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase() ? 'Intra-state (CGST + SGST applied)' : 'Inter-state (IGST applied)'}
//                         </Text>
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               </>
//             )}
//           </View>

//           <View style={styles.halfCol}>
//             <Text style={styles.fieldLabel}>Payment Details:</Text>
//             <View style={styles.bankInfoGrid}>
//               <View style={styles.bankInfoRow}>
//                 <Text style={styles.bankInfoKey}>Bank name:</Text>
//                 <Text style={styles.bankInfoVal}>{documentBank.bankName}</Text>
//               </View>
//               <View style={styles.bankInfoRow}>
//                 <Text style={styles.bankInfoKey}>Account No.:</Text>
//                 <Text style={styles.bankInfoVal}>{documentBank.accountNo}</Text>
//               </View>
//               <View style={styles.bankInfoRow}>
//                 <Text style={styles.bankInfoKey}>IFSC Code:</Text>
//                 <Text style={styles.bankInfoVal}>{documentBank.ifscCode}</Text>
//               </View>
//               {documentBank.paymentUpiId ? (
//                 <View style={styles.bankInfoRow}>
//                   <Text style={styles.bankInfoKey}>UPI ID:</Text>
//                   <Text style={styles.bankInfoVal}>{documentBank.paymentUpiId}</Text>
//                 </View>
//               ) : null}
//               {docType === 'INVOICE' && !editingExisting && (settingsQuery.isFetching || settingsQuery.isError || !invoiceSettings) ? (
//                 <View style={{ gap: 8, marginTop: 10 }}>
//                   {settingsQuery.isFetching ? (
//                     <ActivityIndicator accessibilityLabel="Loading Invoice Settings" color={colors.primary} />
//                   ) : (
//                     <>
//                       <Text accessibilityRole="alert" style={styles.errorBannerText}>
//                         {settingsQuery.isError ? errorMessage(settingsQuery.error) : `Save ${isGstInvoice ? 'GST' : 'Non GST'} bank details and signature in Web Settings → Invoice Settings.`}
//                       </Text>
//                       <Pressable
//                         accessibilityRole="button"
//                         onPress={() => {
//                           void settingsQuery.refetch();
//                         }}
//                       >
//                         <Text style={styles.outlineActionBtnText}>Reload Invoice Settings</Text>
//                       </Pressable>
//                     </>
//                   )}
//                 </View>
//               ) : null}
//             </View>
//           </View>
//         </View>

//         <View style={styles.divider} />

//         {/* Section 3: GST Type Store & Invoice Currency */}
//         <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 70 }]}>
//           <View style={styles.halfCol}>
//             <Text style={styles.fieldLabel}>
//               GST Type Store <Text style={styles.requiredStar}>*</Text>
//             </Text>
//             <View style={styles.radioGroupRow}>
//               {(
//                 [
//                   { label: 'Non GST', value: 'NON_GST' },
//                   { label: 'IGST', value: 'IGST' },
//                   { label: 'SGST / CGST', value: 'SGST_CGST' },
//                 ] as const
//               ).map((opt) => {
//                 const selected = gstMode === opt.value;
//                 return (
//                   <Pressable key={opt.value} style={styles.radioOption} onPress={() => setGstMode(opt.value)}>
//                     <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>{selected && <View style={styles.radioInnerDot} />}</View>
//                     <Text style={styles.radioLabel}>{opt.label}</Text>
//                   </Pressable>
//                 );
//               })}
//             </View>

//             {/* Inclusive GST Switch shown right below GST Type Store when GST active */}
//             {gstMode !== 'NON_GST' && (
//               <View style={styles.inclusiveToggleRow}>
//                 <Text style={styles.fieldLabelInline}>Inclusive GST</Text>
//                 <Switch value={inclusiveGst} onValueChange={setInclusiveGst} trackColor={{ false: '#CBD5E1', true: '#0B2F7D' }} />
//               </View>
//             )}
//           </View>

//           <View style={[styles.halfCol, { position: 'relative', zIndex: 80 }]}>
//             <Text style={styles.fieldLabel}>Invoice Currency:</Text>
//             <View style={{ position: 'relative', zIndex: 90 }}>
//               <Pressable style={styles.dropdownTrigger} onPress={() => setCurrencyDropdownOpen((o) => !o)}>
//                 <Text style={styles.dropdownTriggerText}>{currency === 'INR' ? '₹ - India' : currency === 'USD' ? '$ - USD' : '€ - EUR'}</Text>
//                 <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
//               </Pressable>
//               {currencyDropdownOpen && (
//                 <View style={styles.dropdownMenu}>
//                   {[
//                     { label: '₹ - India', value: 'INR' },
//                     { label: '$ - USD', value: 'USD' },
//                     { label: '€ - EUR', value: 'EUR' },
//                   ].map((c) => (
//                     <Pressable
//                       key={c.value}
//                       style={styles.dropdownOption}
//                       onPress={() => {
//                         setCurrency(c.value);
//                         setCurrencyDropdownOpen(false);
//                       }}
//                     >
//                       <Text style={styles.dropdownOptionTitle}>{c.label}</Text>
//                     </Pressable>
//                   ))}
//                 </View>
//               )}
//             </View>
//           </View>
//         </View>

//         <View style={styles.divider} />

//         {/* Section 4: Dynamic Line Items */}
//         {effectiveItems.map((item, idx) => {
//           const lineCalc = calculations.lineBreakdowns[idx] || {
//             grossAmount: 0,
//             discountAmount: 0,
//             afterDiscountAmount: 0,
//             taxableAmount: 0,
//             igstRate: 0,
//             igstAmount: 0,
//             sgstRate: 0,
//             sgstAmount: 0,
//             cgstRate: 0,
//             cgstAmount: 0,
//             taxAmount: 0,
//             totalAmount: 0,
//           };

//           return (
//             <View key={idx} style={[styles.itemCard, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
//               <View style={styles.itemRemoveTopRight}>
//                 <Pressable onPress={() => handleRemoveItem(idx)} hitSlop={8}>
//                   <Ionicons name="close" size={18} color={colors.textMuted} />
//                 </Pressable>
//               </View>

//               {/* Row 1: Item Product Name + HSN Code (when GST mode active) */}
//               <View style={[styles.itemTopRow, isDesktop && styles.itemTopRowDesktop]}>
//                 <View style={{ flex: 3.5, gap: 6 }}>
//                   <ProfileSelect
//                     label="Service / Product Name"
//                     required
//                     allowCustom={true}
//                     value={item.productName}
//                     options={(hsnQuery.data ?? []).map((entry) => (entry as any).name || entry.description || entry.code)}
//                     onChange={(val) => {
//                       const match = (hsnQuery.data ?? []).find(
//                         (entry) => ((entry as any).name || entry.description || entry.code) === val
//                       );
//                       if (match) {
//                         handleUpdateItem(idx, {
//                           productName: (match as any).name || match.description || match.code,
//                           hsnMasterId: match.id,
//                           hsnSac: match.code,
//                           hsnDescription: match.description,
//                           igstRate: match.igstRate,
//                           sgstRate: match.sgstRate,
//                           cgstRate: match.cgstRate,
//                           applyHsnMaster: true,
//                         });
//                       } else {
//                         handleUpdateItem(idx, { productName: val });
//                       }
//                     }}
//                     placeholder="Select service or enter product name"
//                   />
//                 </View>

//                 {gstMode !== 'NON_GST' && (
//                   <View style={{ flex: 2, minWidth: 180, gap: 6 }}>
//                     <ProfileSelect
//                       label="HSN Code"
//                       required
//                       allowCustom={false}
//                       value={item.hsnSac ? `${item.hsnSac}${item.hsnDescription ? ` — ${item.hsnDescription}` : ''}` : ''}
//                       options={(hsnQuery.data ?? []).map((entry) => `${entry.code} — ${(entry as any).name || entry.description}`)}
//                       onChange={(value) => {
//                         const master = hsnQuery.data?.find((entry) => `${entry.code} — ${(entry as any).name || entry.description}` === value);
//                         if (master) {
//                           handleUpdateItem(idx, {
//                             productName: item.productName || (master as any).name || '',
//                             hsnMasterId: master.id,
//                             hsnSac: master.code,
//                             hsnDescription: master.description,
//                             igstRate: master.igstRate,
//                             sgstRate: master.sgstRate,
//                             cgstRate: master.cgstRate,
//                             applyHsnMaster: true,
//                           });
//                         }
//                       }}
//                     />
//                     {item.hsnDescription ? <Text style={styles.fieldLabel}>HSN Description: {item.hsnDescription}</Text> : null}
//                     {hsnQuery.isPending ? <Text style={styles.fieldLabel}>Loading services & HSN...</Text> : hsnQuery.isError ? (
//                       <Pressable accessibilityRole="button" onPress={() => { void hsnQuery.refetch(); }}><Text style={styles.fieldLabel}>Could not load services. Tap to retry.</Text></Pressable>
//                     ) : !hsnQuery.data?.length ? <Text style={styles.fieldLabel}>Add active services in Invoice Settings → Services & HSN Master.</Text> : null}
//                   </View>
//                 )}
//               </View>

//               {/* Row 2: Cost, Qty (- input +), Discount, Discount Type, Sub Total */}
//               <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
//                 <View style={styles.metricCol}>
//                   <Text style={styles.fieldLabel}>
//                     Cost <Text style={styles.requiredStar}>*</Text>
//                   </Text>
//                   <View style={styles.prefixedInputWrap}>
//                     <View style={styles.prefixBox}>
//                       <Text style={styles.prefixText}>{currencySymbol}</Text>
//                     </View>
//                     <TextInput
//                       style={styles.prefixedInput}
//                       keyboardType="numeric"
//                       value={String(item.unitPrice)}
//                       onChangeText={(val) =>
//                         handleUpdateItem(idx, {
//                           unitPrice: Number(val.replace(/[^0-9.]/g, '')) || 0,
//                         })
//                       }
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.metricColQty}>
//                   <Text style={styles.fieldLabel}>
//                     Qty: <Text style={styles.requiredStar}>*</Text>
//                   </Text>
//                   <View style={styles.qtyStepperRow}>
//                     <Pressable
//                       style={styles.qtyBtnMuted}
//                       accessibilityRole="button"
//                       accessibilityLabel={`Decrease quantity for item ${idx + 1}`}
//                       onPress={() =>
//                         handleUpdateItem(idx, {
//                           quantity: Math.max(1, (Number(item.quantity) || 1) - 1),
//                         })
//                       }
//                     >
//                       <Text style={styles.qtyBtnText}>-</Text>
//                     </Pressable>
//                     <TextInput
//                       style={styles.qtyDirectInput}
//                       keyboardType="numeric"
//                       value={String(item.quantity)}
//                       onChangeText={(val) => {
//                         const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
//                         handleUpdateItem(idx, {
//                           quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
//                         });
//                       }}
//                     />
//                     <Pressable
//                       style={styles.qtyBtn}
//                       accessibilityRole="button"
//                       accessibilityLabel={`Increase quantity for item ${idx + 1}`}
//                       onPress={() =>
//                         handleUpdateItem(idx, {
//                           quantity: (Number(item.quantity) || 1) + 1,
//                         })
//                       }
//                     >
//                       <Text style={styles.qtyBtnText}>+</Text>
//                     </Pressable>
//                   </View>
//                 </View>

//                 <View style={styles.metricCol}>
//                   <Text style={styles.fieldLabel}>
//                     Discount: <Text style={styles.requiredStar}>*</Text>
//                   </Text>
//                   <TextInput
//                     style={styles.textInput}
//                     keyboardType="numeric"
//                     value={String(item.discountValue)}
//                     onChangeText={(val) =>
//                       handleUpdateItem(idx, {
//                         discountValue: Number(val.replace(/[^0-9.]/g, '')) || 0,
//                       })
//                     }
//                   />
//                 </View>

//                 <View style={[styles.metricCol, discountDropdownIndex === idx && styles.discountDropdownLayer]}>
//                   <Text style={styles.fieldLabel}>Discount Type :</Text>
//                   <View style={styles.discountDropdownAnchor}>
//                     <Pressable
//                       accessibilityRole="button"
//                       accessibilityLabel={`Discount type for item ${idx + 1}`}
//                       accessibilityState={{
//                         expanded: discountDropdownIndex === idx,
//                       }}
//                       style={[styles.dropdownTrigger, { backgroundColor: '#F1F5F9' }]}
//                       onPress={() => setDiscountDropdownIndex((current) => (current === idx ? null : idx))}
//                     >
//                       <Text style={styles.dropdownTriggerText}>
//                         {item.discountType === 'FLAT_PER_UNIT' ? 'Per Item Discount' : item.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Overall Discount'}
//                       </Text>
//                       <Ionicons name={discountDropdownIndex === idx ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
//                     </Pressable>
//                     {discountDropdownIndex === idx && (
//                       <View style={styles.dropdownMenu}>
//                         {DISCOUNT_OPTIONS.map((option) => {
//                           const selected = item.discountType === option.value;
//                           return (
//                             <Pressable
//                               key={option.value}
//                               accessibilityRole="button"
//                               accessibilityLabel={option.label}
//                               accessibilityState={{ selected }}
//                               style={[styles.dropdownOption, selected && styles.dropdownOptionActive]}
//                               onPress={() => {
//                                 handleUpdateItem(idx, {
//                                   discountType: option.value,
//                                 });
//                                 setDiscountDropdownIndex(null);
//                               }}
//                             >
//                               <Text style={styles.dropdownOptionTitle}>{option.label}</Text>
//                             </Pressable>
//                           );
//                         })}
//                       </View>
//                     )}
//                   </View>
//                 </View>

//                 <View style={styles.metricCol}>
//                   <Text style={styles.fieldLabel}>Sub Total</Text>
//                   <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
//                     <View style={styles.prefixBox}>
//                       <Text style={styles.prefixText}>{currencySymbol}</Text>
//                     </View>
//                     <Text style={styles.readOnlyValueText}>{lineCalc.taxableAmount.toFixed(2)}</Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Row 3: Conditional Tax Fields based on gstMode */}
//               {gstMode === 'IGST' && (
//                 <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop]}>
//                   <View style={styles.metricCol}>
//                     <Text style={styles.fieldLabel}>IGST</Text>
//                     <View style={styles.suffixedInputWrap}>
//                       <TextInput
//                         style={styles.suffixedInput}
//                         keyboardType="numeric"
//                         value={String(item.igstRate)}
//                         editable={false}
//                         accessibilityLabel={`IGST rate from HSN for item ${idx + 1}`}
//                       />
//                       <Text style={styles.suffixPercentText}>%</Text>
//                     </View>
//                   </View>

//                   <View style={styles.metricColWide}>
//                     <Text style={styles.fieldLabel}>Tax Amount</Text>
//                     <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
//                       <View style={styles.prefixBox}>
//                         <Text style={styles.prefixText}>{currencySymbol}</Text>
//                       </View>
//                       <Text style={styles.readOnlyValueText}>{lineCalc.taxAmount.toFixed(2)}</Text>
//                     </View>
//                   </View>

//                   <View style={styles.metricColWide}>
//                     <Text style={styles.fieldLabel}>Total Amount</Text>
//                     <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
//                       <View style={styles.prefixBox}>
//                         <Text style={styles.prefixText}>{currencySymbol}</Text>
//                       </View>
//                       <Text style={styles.readOnlyValueText}>{lineCalc.totalAmount.toFixed(2)}</Text>
//                     </View>
//                   </View>
//                 </View>
//               )}

//               {gstMode === 'SGST_CGST' && (
//                 <View style={[styles.itemMetricsRow, isDesktop && styles.itemMetricsRowDesktop]}>
//                   <View style={styles.metricColSmall}>
//                     <Text style={styles.fieldLabel}>SGST</Text>
//                     <View style={styles.suffixedInputWrap}>
//                       <TextInput
//                         style={styles.suffixedInput}
//                         keyboardType="numeric"
//                         value={String(item.sgstRate)}
//                         editable={false}
//                         accessibilityLabel={`SGST rate from HSN for item ${idx + 1}`}
//                       />
//                       <Text style={styles.suffixPercentText}>%</Text>
//                     </View>
//                   </View>

//                   <View style={styles.metricColSmall}>
//                     <Text style={styles.fieldLabel}>CGST</Text>
//                     <View style={styles.suffixedInputWrap}>
//                       <TextInput
//                         style={styles.suffixedInput}
//                         keyboardType="numeric"
//                         value={String(item.cgstRate)}
//                         editable={false}
//                         accessibilityLabel={`CGST rate from HSN for item ${idx + 1}`}
//                       />
//                       <Text style={styles.suffixPercentText}>%</Text>
//                     </View>
//                   </View>

//                   <View style={styles.metricColWide}>
//                     <Text style={styles.fieldLabel}>Tax Amount</Text>
//                     <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
//                       <View style={styles.prefixBox}>
//                         <Text style={styles.prefixText}>{currencySymbol}</Text>
//                       </View>
//                       <Text style={styles.readOnlyValueText}>{lineCalc.taxAmount.toFixed(2)}</Text>
//                     </View>
//                   </View>

//                   <View style={styles.metricColWide}>
//                     <Text style={styles.fieldLabel}>Total Amount</Text>
//                     <View style={[styles.prefixedInputWrap, styles.readOnlyWrap]}>
//                       <View style={styles.prefixBox}>
//                         <Text style={styles.prefixText}>{currencySymbol}</Text>
//                       </View>
//                       <Text style={styles.readOnlyValueText}>{lineCalc.totalAmount.toFixed(2)}</Text>
//                     </View>
//                   </View>
//                 </View>
//               )}

//               {/* Row 4: Comments */}
//               <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Comments</Text>
//               <TextInput
//                 style={[styles.textInput, styles.commentsInput]}
//                 multiline
//                 value={item.comments || ''}
//                 onChangeText={(val) => handleUpdateItem(idx, { comments: val })}
//                 placeholder="Comments"
//                 placeholderTextColor={colors.textMuted}
//               />
//             </View>
//           );
//         })}

//         {/* Add Item Button */}
//         <Pressable style={styles.addItemBtn} onPress={handleAddItem}>
//           <Text style={styles.addItemBtnText}>+ Add Item</Text>
//         </Pressable>

//         <View style={styles.divider} />

//         {/* Section 5: Payment Info, Brochure, Terms & Financial Summary */}
//         <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop, { zIndex: 40 }]}>
//           {/* Left Column: Payment Status, Brochure, Next Payment Date */}
//           <View style={styles.halfCol}>
//             {docType === 'INVOICE' && (
//               <View>
//                 <Text style={styles.fieldLabel}>Payment Status :</Text>
//                 <View style={styles.radioGroupRow}>
//                   {(
//                     [
//                       { label: 'Unpaid', value: 'UNPAID' },
//                       { label: 'Paid', value: 'PAID' },
//                       { label: 'Half Paid', value: 'PARTIALLY_PAID' },
//                     ] as const
//                   ).map((st) => (
//                     <Pressable
//                       key={st.value}
//                       style={styles.radioOption}
//                       onPress={() => {
//                         setPaymentStatus(st.value);
//                         setPaymentMethodDropdownOpen(false);
//                         setBrochureDropdownOpen(false);
//                       }}
//                     >
//                       <View style={[styles.radioCircle, paymentStatus === st.value && styles.radioCircleSelected]}>{paymentStatus === st.value && <View style={styles.radioInnerDot} />}</View>
//                       <Text style={styles.radioLabel}>{st.label}</Text>
//                     </Pressable>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {/* Select Brochure Dropdown */}
//             <View style={{ marginTop: 14, position: 'relative', zIndex: 60 }}>
//               <Text style={styles.fieldLabel}>Select Brochure :</Text>
//               <Pressable
//                 style={styles.dropdownTrigger}
//                 onPress={() => {
//                   setPaymentMethodDropdownOpen(false);
//                   setBrochureDropdownOpen((o) => !o);
//                 }}
//               >
//                 <Text style={[styles.dropdownTriggerText, !brochureId && styles.placeholderText]}>
//                   {brochureId ? brochures.find((b) => b.id === brochureId)?.brochureName || 'Select Brochure' : 'Select Brochure'}
//                 </Text>
//                 <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
//               </Pressable>

//               {brochureDropdownOpen && (
//                 <View style={styles.dropdownMenu}>
//                   <Pressable
//                     style={styles.dropdownOption}
//                     onPress={() => {
//                       setBrochureId(null);
//                       setBrochureDropdownOpen(false);
//                     }}
//                   >
//                     <Text style={styles.dropdownOptionSub}>None</Text>
//                   </Pressable>
//                   {brochures.map((b) => (
//                     <Pressable
//                       key={b.id}
//                       style={styles.dropdownOption}
//                       onPress={() => {
//                         setBrochureId(b.id);
//                         setBrochureDropdownOpen(false);
//                       }}
//                     >
//                       <Text style={styles.dropdownOptionTitle}>
//                         {b.brochureName} ({b.type})
//                       </Text>
//                     </Pressable>
//                   ))}
//                 </View>
//               )}
//             </View>

//             {docType === 'INVOICE' && paymentStatus !== 'UNPAID' && (
//               <>
//                 <View style={{ marginTop: 14 }}>
//                   <Text style={styles.fieldLabel}>Payment Date :</Text>
//                   <TextInput
//                     accessibilityLabel="Payment Date"
//                     style={styles.dateInput}
//                     value={paymentDateDisplay}
//                     onChangeText={setPaymentDateDisplay}
//                     placeholder="DD-MM-YYYY"
//                     placeholderTextColor={colors.textMuted}
//                   />
//                 </View>

//                 <View style={{ marginTop: 14, position: 'relative', zIndex: 50 }}>
//                   <Text style={styles.fieldLabel}>Accept payments via</Text>
//                   <Pressable
//                     accessibilityRole="button"
//                     accessibilityLabel="Accept payments via"
//                     accessibilityState={{ expanded: paymentMethodDropdownOpen }}
//                     style={styles.dropdownTrigger}
//                     onPress={() => {
//                       setBrochureDropdownOpen(false);
//                       setPaymentMethodDropdownOpen((open) => !open);
//                     }}
//                   >
//                     <Text style={[styles.dropdownTriggerText, !paymentMethodId && styles.placeholderText]}>
//                       {paymentMethods.find((method) => method.id === paymentMethodId)?.method ||
//                         (paymentMethodId === existingDocument?.paymentMethodId ? existingDocument?.paymentMethodName : null) ||
//                         'Select...'}
//                     </Text>
//                     <Ionicons name={paymentMethodDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
//                   </Pressable>
//                   {paymentMethodDropdownOpen && (
//                     <View style={styles.dropdownMenu}>
//                       {loadingPaymentMethods ? (
//                         <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
//                       ) : paymentMethodsError ? (
//                         <Pressable
//                           accessibilityRole="button"
//                           onPress={() => {
//                             void refetchPaymentMethods();
//                           }}
//                           style={styles.dropdownOption}
//                         >
//                           <Text style={styles.dropdownOptionTitle}>Unable to load payment methods. Retry</Text>
//                         </Pressable>
//                       ) : !paymentMethods.some((method) => method.isActive !== false) ? (
//                         <Text style={styles.emptyDropdownText}>No payment methods configured.</Text>
//                       ) : (
//                         <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
//                           {paymentMethods
//                             .filter((method) => method.isActive !== false)
//                             .map((method) => (
//                               <Pressable
//                                 key={method.id}
//                                 accessibilityRole="button"
//                                 accessibilityState={{
//                                   selected: paymentMethodId === method.id,
//                                 }}
//                                 style={[styles.dropdownOption, paymentMethodId === method.id && styles.dropdownOptionActive]}
//                                 onPress={() => {
//                                   setPaymentMethodId(method.id);
//                                   setPaymentMethodDropdownOpen(false);
//                                 }}
//                               >
//                                 <Text style={styles.dropdownOptionTitle}>{method.method}</Text>
//                               </Pressable>
//                             ))}
//                         </ScrollView>
//                       )}
//                     </View>
//                   )}
//                 </View>

//                 <View style={{ marginTop: 14 }}>
//                   <Text style={styles.fieldLabel}>Amount</Text>
//                   <View style={[styles.prefixedInputWrap, paymentStatus === 'PAID' && styles.readOnlyWrap]}>
//                     <View style={styles.prefixBox}>
//                       <Text style={styles.prefixText}>{currencySymbol}</Text>
//                     </View>
//                     <TextInput
//                       accessibilityLabel="Payment Amount"
//                       style={styles.prefixedInput}
//                       keyboardType="numeric"
//                       editable={paymentStatus !== 'PAID'}
//                       value={paymentStatus === 'PAID' ? calculations.grandTotal.toFixed(2) : paidAmountInput}
//                       onChangeText={setPaidAmountInput}
//                       placeholder="0.00"
//                       placeholderTextColor={colors.textMuted}
//                     />
//                   </View>
//                 </View>
//               </>
//             )}

//             {/* Next Payment Date */}
//             {docType === 'INVOICE' && paymentStatus !== 'PAID' && (
//               <View style={{ marginTop: 14 }}>
//                 <Text style={styles.fieldLabel}>Next Payment Date :</Text>
//                 <View style={styles.nextPaymentDateField}>
//                   <TextInput
//                     accessibilityLabel="Next Payment Date (DD-MM-YYYY)"
//                     style={styles.nextPaymentDateInput}
//                     value={nextPaymentDateDisplay}
//                     onChangeText={setNextPaymentDateDisplay}
//                     maxLength={10}
//                     placeholder="DD-MM-YYYY"
//                     placeholderTextColor={colors.textMuted}
//                   />
//                   <Pressable
//                     accessibilityRole="button"
//                     accessibilityLabel="Open next payment date calendar"
//                     style={styles.nextPaymentDateCalendarButton}
//                     onPress={() => {
//                       setPaymentMethodDropdownOpen(false);
//                       setBrochureDropdownOpen(false);
//                       setNextPaymentDatePickerOpen(true);
//                     }}
//                   >
//                     <Ionicons name="calendar-outline" size={20} color={colors.primaryText} />
//                   </Pressable>
//                 </View>
//               </View>
//             )}
//           </View>

//           {/* Right Column: Totals & Static Signature Box */}
//           <View style={styles.totalsAndSignatureCol}>
//             <View style={styles.summaryTable}>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Gross Subtotal:</Text>
//                 <Text style={styles.summaryValue}>
//                   {currencySymbol}
//                   {calculations.grossSubtotal.toFixed(2)}
//                 </Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Discount:</Text>
//                 <Text style={styles.summaryValue}>
//                   {currencySymbol}
//                   {calculations.discountTotal.toFixed(2)}
//                 </Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Taxable Amount:</Text>
//                 <Text style={styles.summaryValue}>
//                   {currencySymbol}
//                   {calculations.taxableSubtotal.toFixed(2)}
//                 </Text>
//               </View>
//               {gstMode === 'IGST' && (
//                 <View style={styles.summaryRow}>
//                   <Text style={styles.summaryLabel}>IGST Total:</Text>
//                   <Text style={styles.summaryValue}>
//                     {currencySymbol}
//                     {calculations.igstTotal.toFixed(2)}
//                   </Text>
//                 </View>
//               )}
//               {gstMode === 'SGST_CGST' && (
//                 <>
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.summaryLabel}>SGST Total:</Text>
//                     <Text style={styles.summaryValue}>
//                       {currencySymbol}
//                       {calculations.sgstTotal.toFixed(2)}
//                     </Text>
//                   </View>
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.summaryLabel}>CGST Total:</Text>
//                     <Text style={styles.summaryValue}>
//                       {currencySymbol}
//                       {calculations.cgstTotal.toFixed(2)}
//                     </Text>
//                   </View>
//                 </>
//               )}
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Total Tax:</Text>
//                 <Text style={styles.summaryValue}>
//                   {currencySymbol}
//                   {calculations.taxTotal.toFixed(2)}
//                 </Text>
//               </View>
//               <View style={[styles.summaryRow, styles.grandTotalRow]}>
//                 <Text style={styles.grandTotalLabel}>Grand Total:</Text>
//                 <Text style={styles.grandTotalValue}>
//                   {currencySymbol}
//                   {calculations.grandTotal.toFixed(2)}
//                 </Text>
//               </View>
//               {docType === 'INVOICE' && (
//                 <>
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.summaryLabel}>Received Amount:</Text>
//                     <Text style={styles.summaryValue}>
//                       {currencySymbol}
//                       {calculations.receivedAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.dueAmountLabel}>Total Due / Outstanding:</Text>
//                     <Text style={styles.dueAmountValue}>
//                       {currencySymbol}
//                       {calculations.dueAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </>
//               )}
//             </View>

//             {/* Signature uses the applicable invoice settings. */}
//             <View style={styles.signatureBox}>
//               {docType === 'INVOICE' ? (
//                 <InvoiceSignature signature={invoiceSettings?.signature} name={editingExisting ? existingDocument?.signatoryName : undefined} color={companyProfile?.fontColor} />
//               ) : (
//                 <>
//                   <Text style={styles.signatureCursiveText}>{DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
//                   <Text style={styles.signatoryLabel}>Authorized Signatory</Text>
//                 </>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* Terms & Conditions Box */}
//         <View style={{ marginTop: 20 }}>
//           <Text style={styles.fieldLabel}>Terms &amp; Conditions</Text>
//           <TextInput style={[styles.textInput, styles.termsInput]} multiline value={termsAndConditions} onChangeText={setTermsAndConditions} />
//         </View>

//         <View style={{ marginTop: 18 }}>
//           <Text style={styles.automationHeading}>Automation</Text>
//           <View style={styles.automationRow}>
//             <View style={styles.automationToggleGroup}>
//               <Text style={styles.fieldLabel}>Email Automation</Text>
//               <Switch value={emailAutomation} onValueChange={setEmailAutomation} trackColor={{ false: '#CBD5E1', true: colors.primary }} />
//             </View>

//             <View style={styles.automationToggleGroup}>
//               <Text style={styles.fieldLabel}>Whatsapp Automation</Text>
//               <Switch value={whatsappAutomation} onValueChange={setWhatsappAutomation} trackColor={{ false: '#CBD5E1', true: colors.primary }} />
//             </View>
//           </View>
//         </View>

//         {formError && (
//           <View style={styles.errorBanner}>
//             <Text style={styles.errorBannerText}>{formError}</Text>
//           </View>
//         )}

//         {/* Footer Buttons: Generate & Download */}
//         <View style={styles.footerActionsRow}>
//           <Pressable
//             style={[styles.outlineActionBtn, (isSaving || companyUnavailable || invoiceSettingsUnavailable) && { opacity: 0.6 }]}
//             disabled={isSaving || Boolean(companyUnavailable) || invoiceSettingsUnavailable}
//             onPress={() => handleSave(false)}
//           >
//             {isSaving ? <ActivityIndicator size="small" color="#0B2F7D" /> : <Text style={styles.outlineActionBtnText}>Generate</Text>}
//           </Pressable>

//           <Pressable
//             style={[styles.outlineActionBtn, (isSaving || companyUnavailable || invoiceSettingsUnavailable) && { opacity: 0.6 }]}
//             disabled={isSaving || Boolean(companyUnavailable) || invoiceSettingsUnavailable}
//             onPress={() => {
//               if (Platform.OS === 'web' && typeof window !== 'undefined') {
//                 setPreviewModalOpen(true);
//               } else {
//                 handleSave(true);
//               }
//             }}
//           >
//             <Text style={styles.outlineActionBtnText}>Download</Text>
//           </Pressable>
//         </View>
//       </View>

//       <DateTimePickerModal
//         visible={nextPaymentDatePickerOpen}
//         value={nextPaymentDateDisplay}
//         dateOnly
//         title="Choose Next Payment Date"
//         onSelect={setNextPaymentDateDisplay}
//         onClose={() => setNextPaymentDatePickerOpen(false)}
//       />

//       {/* Printable Preview / Download Modal */}
//       <Modal visible={previewModalOpen} transparent animationType="fade" onRequestClose={() => setPreviewModalOpen(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.previewModalCard}>
//             <View style={styles.previewHeaderBar}>
//               <Text style={styles.previewHeaderTitle}>{docType === 'QUOTATION' ? 'Quotation Preview' : 'Invoice Preview'}</Text>
//               <View style={{ flexDirection: 'row', gap: 10 }}>
//                 {Platform.OS === 'web' && (
//                   <Pressable
//                     style={styles.navyButton}
//                     onPress={() => {
//                       if (typeof window !== 'undefined') window.print();
//                     }}
//                   >
//                     <Ionicons name="print-outline" size={16} color={colors.white} />
//                     <Text style={styles.navyButtonText}>Print / Save PDF</Text>
//                   </Pressable>
//                 )}
//                 <Pressable style={styles.outlineActionBtn} onPress={() => setPreviewModalOpen(false)}>
//                   <Text style={styles.outlineActionBtnText}>Close</Text>
//                 </Pressable>
//               </View>
//             </View>

//             <ScrollView style={{ maxHeight: 540 }}>
//               <View style={printStyles.printableSheet}>
//                 {previewCompany ? <InvoiceCompanyDetails profile={previewCompany} /> : null}
//                 <View style={printStyles.divider} />
//                 <Text style={printStyles.fieldLabel}>
//                   Billed To:{' '}
//                   {selectedCustomer ? `${selectedCustomer.companyName || selectedCustomer.lead?.companyName || ''} - ${selectedCustomer.name || selectedCustomer.lead?.name || ''}` : 'Customer'}
//                 </Text>
//                 <Text style={printStyles.companyMetaText}>Date: {dateDisplay}</Text>
//                 <Text style={printStyles.companyMetaText}>
//                   GST Mode: {gstMode === 'NON_GST' ? 'Non GST' : gstMode === 'IGST' ? 'IGST' : 'SGST/CGST'} {inclusiveGst && gstMode !== 'NON_GST' ? '(Inclusive GST)' : ''}
//                 </Text>
//                 <View style={printStyles.divider} />

//                 {/* Items Breakdown Table */}
//                 {effectiveItems.map((it, i) => {
//                   const b = calculations.lineBreakdowns[i] || {
//                     taxableAmount: 0,
//                     taxAmount: 0,
//                     totalAmount: 0,
//                   };
//                   return (
//                     <View key={i} style={printStyles.summaryRow}>
//                       <Text style={printStyles.summaryLabel}>
//                         {i + 1}. {it.productName || 'Item'} {Boolean(it.hsnSac && gstMode !== 'NON_GST') && `[HSN: ${it.hsnSac}]`} (Qty: {it.quantity} × {currencySymbol}
//                         {it.unitPrice})
//                         {gstMode !== 'NON_GST' && it.hsnDescription ? `\n${it.hsnDescription}` : ''}
//                       </Text>
//                       <Text style={printStyles.summaryValueBold}>
//                         {currencySymbol}
//                         {b.totalAmount.toFixed(2)}
//                       </Text>
//                     </View>
//                   );
//                 })}

//                 <View style={printStyles.divider} />
//                 <View style={printStyles.summaryRow}>
//                   <Text style={printStyles.summaryLabel}>Gross Subtotal:</Text>
//                   <Text style={printStyles.summaryValue}>
//                     {currencySymbol}
//                     {calculations.grossSubtotal.toFixed(2)}
//                   </Text>
//                 </View>
//                 <View style={printStyles.summaryRow}>
//                   <Text style={printStyles.summaryLabel}>Discount:</Text>
//                   <Text style={printStyles.summaryValue}>
//                     {currencySymbol}
//                     {calculations.discountTotal.toFixed(2)}
//                   </Text>
//                 </View>
//                 <View style={printStyles.summaryRow}>
//                   <Text style={printStyles.summaryLabel}>Taxable Base:</Text>
//                   <Text style={printStyles.summaryValue}>
//                     {currencySymbol}
//                     {calculations.taxableSubtotal.toFixed(2)}
//                   </Text>
//                 </View>
//                 {gstMode === 'IGST' && (
//                   <View style={printStyles.summaryRow}>
//                     <Text style={printStyles.summaryLabel}>IGST Total:</Text>
//                     <Text style={printStyles.summaryValue}>
//                       {currencySymbol}
//                       {calculations.igstTotal.toFixed(2)}
//                     </Text>
//                   </View>
//                 )}
//                 {gstMode === 'SGST_CGST' && (
//                   <>
//                     <View style={printStyles.summaryRow}>
//                       <Text style={printStyles.summaryLabel}>SGST Total:</Text>
//                       <Text style={printStyles.summaryValue}>
//                         {currencySymbol}
//                         {calculations.sgstTotal.toFixed(2)}
//                       </Text>
//                     </View>
//                     <View style={printStyles.summaryRow}>
//                       <Text style={printStyles.summaryLabel}>CGST Total:</Text>
//                       <Text style={printStyles.summaryValue}>
//                         {currencySymbol}
//                         {calculations.cgstTotal.toFixed(2)}
//                       </Text>
//                     </View>
//                   </>
//                 )}
//                 <View style={[printStyles.summaryRow, printStyles.grandTotalRow]}>
//                   <Text style={printStyles.grandTotalLabel}>Grand Total:</Text>
//                   <Text style={printStyles.grandTotalValue}>
//                     {currencySymbol}
//                     {calculations.grandTotal.toFixed(2)}
//                   </Text>
//                 </View>

//                 {/* Bank Details in Preview */}
//                 <View style={printStyles.divider} />
//                 <Text style={[printStyles.fieldLabel, { marginBottom: 4 }]}>Payment Details:</Text>
//                 <Text style={printStyles.companyMetaText}>
//                   Bank: {previewBank.bankName} | A/C: {previewBank.accountNo} | IFSC: {previewBank.ifscCode}
//                 </Text>
//                 {previewBank.paymentUpiId ? <Text style={printStyles.companyMetaText}>UPI ID: {previewBank.paymentUpiId}</Text> : null}
//                 {docType === 'INVOICE' ? (
//                   <InvoiceSignature
//                     signature={previewInvoiceSettings?.signature}
//                     name={savedDocument?.signatoryName ?? (editingExisting ? existingDocument?.signatoryName : undefined)}
//                     color={previewCompany?.fontColor}
//                   />
//                 ) : (
//                   <Text style={[printStyles.companyMetaText, { marginTop: 8 }]}>Authorized Signatory: {DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
//                 )}
//                 {docType === 'INVOICE' ? (
//                   <View style={{ marginTop: 12 }}>
//                     <Text style={printStyles.fieldLabel}>Terms & Conditions</Text>
//                     <Text style={printStyles.companyMetaText}>{savedDocument?.termsAndConditions ?? termsAndConditions}</Text>
//                   </View>
//                 ) : null}
//               </View>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   page: {
//     flex: 1,
//     backgroundColor: '#F7F9FC',
//   },
//   pageContent: {
//     padding: 24,
//     backgroundColor: '#F7F9FC',
//   },
//   mainCard: {
//     backgroundColor: colors.white,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 10,
//     padding: 24,
//   },
//   sectionRow: {
//     flexDirection: 'column',
//     gap: 20,
//   },
//   sectionRowDesktop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   companyBlock: {
//     flex: 1,
//     maxWidth: 520,
//   },
//   logoBox: {
//     width: 140,
//     height: 96,
//     borderWidth: 1,
//     borderColor: '#F1F5F9',
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//     backgroundColor: colors.white,
//   },
//   cloudBadge: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#E4EFFD',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 4,
//   },
//   logoTextTitle: {
//     fontSize: 12,
//     fontWeight: '800',
//     color: '#0B2F7D',
//   },
//   logoTextSub: {
//     fontSize: 9,
//     fontWeight: '700',
//     color: '#64748B',
//     letterSpacing: 1,
//   },
//   companyNameHeading: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0E1B3D',
//     marginBottom: 4,
//   },
//   companyMetaText: {
//     fontSize: 12,
//     color: '#56627C',
//     lineHeight: 18,
//   },
//   dateBlock: {
//     width: 170,
//   },
//   dateInput: {
//     height: 42,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     paddingHorizontal: 12,
//     fontSize: 13,
//     color: '#0E1B3D',
//     backgroundColor: colors.white,
//   },
//   nextPaymentDateField: {
//     minHeight: 42,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     backgroundColor: colors.white,
//   },
//   nextPaymentDateInput: {
//     flex: 1,
//     width: 0,
//     minWidth: 0,
//     height: 40,
//     paddingHorizontal: 12,
//     fontSize: 13,
//     color: '#0E1B3D',
//   },
//   nextPaymentDateCalendarButton: {
//     width: 42,
//     height: 40,
//     flexShrink: 0,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderLeftWidth: 1,
//     borderColor: '#DCE3F0',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#DCE3F0',
//     marginVertical: 20,
//   },
//   halfCol: {
//     flex: 1,
//   },
//   fieldLabel: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#334155',
//     marginBottom: 8,
//   },
//   fieldLabelInline: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#334155',
//   },
//   requiredStar: {
//     color: '#B3261E',
//   },
//   dropdownTrigger: {
//     height: 42,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     paddingHorizontal: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: colors.white,
//   },
//   discountDropdownAnchor: {
//     position: 'relative',
//   },
//   discountDropdownLayer: {
//     zIndex: 50,
//   },
//   dropdownTriggerText: {
//     fontSize: 13,
//     color: '#0E1B3D',
//   },
//   placeholderText: {
//     color: '#64748B',
//   },
//   dropdownMenu: {
//     position: 'absolute',
//     top: '100%',
//     left: 0,
//     right: 0,
//     marginTop: 4,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     backgroundColor: colors.white,
//     padding: 6,
//     zIndex: 9999,
//     elevation: 10,
//     boxShadow: '0 6px 20px rgba(11,47,125,0.14)',
//   },
//   dropdownSearchInput: {
//     height: 36,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     paddingHorizontal: 10,
//     fontSize: 12,
//     marginBottom: 6,
//     color: '#0E1B3D',
//   },
//   dropdownOption: {
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     borderRadius: 4,
//   },
//   dropdownOptionActive: {
//     backgroundColor: '#E4EFFD',
//   },
//   dropdownOptionTitle: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#0E1B3D',
//   },
//   dropdownOptionSub: {
//     fontSize: 12,
//     color: '#56627C',
//   },
//   emptyDropdownText: {
//     padding: 10,
//     fontSize: 12,
//     color: '#56627C',
//     textAlign: 'center',
//   },
//   customerSummaryPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#F8FAFD',
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//     marginTop: 8,
//   },
//   customerSummaryText: {
//     fontSize: 12,
//     color: '#0E1B3D',
//     fontWeight: '500',
//     flexShrink: 1,
//   },
//   bankInfoGrid: {
//     marginTop: 4,
//     gap: 6,
//   },
//   bankInfoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   bankInfoKey: {
//     width: 110,
//     fontSize: 13,
//     color: '#56627C',
//   },
//   bankInfoVal: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#334155',
//   },
//   radioGroupRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: 20,
//     marginTop: 4,
//   },
//   radioOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   radioCircle: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     borderWidth: 2,
//     borderColor: '#94A3B8',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   radioCircleSelected: {
//     borderColor: '#0B2F7D',
//   },
//   radioInnerDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#0B2F7D',
//   },
//   radioLabel: {
//     fontSize: 13,
//     color: '#1E293B',
//     fontWeight: '500',
//   },
//   inclusiveToggleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginTop: 12,
//   },
//   itemCard: {
//     position: 'relative',
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 16,
//     backgroundColor: colors.white,
//   },
//   itemRemoveTopRight: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     zIndex: 10,
//   },
//   itemTopRow: {
//     flexDirection: 'column',
//     gap: 12,
//     paddingRight: 28,
//     marginBottom: 12,
//   },
//   itemTopRowDesktop: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   itemMetricsRow: {
//     flexDirection: 'column',
//     gap: 12,
//     marginTop: 8,
//   },
//   itemMetricsRowDesktop: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   metricCol: {
//     flex: 1,
//     minWidth: 120,
//   },
//   metricColQty: {
//     width: 130,
//     flexShrink: 0,
//   },
//   metricColSmall: {
//     flex: 1,
//     minWidth: 100,
//   },
//   metricColWide: {
//     flex: 1.5,
//     minWidth: 140,
//   },
//   textInput: {
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     paddingHorizontal: 12,
//     fontSize: 13,
//     color: '#0E1B3D',
//     backgroundColor: colors.white,
//   },
//   prefixedInputWrap: {
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.white,
//     overflow: 'hidden',
//   },
//   prefixBox: {
//     width: 36,
//     height: '100%',
//     backgroundColor: '#F1F5F9',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRightWidth: 1,
//     borderRightColor: '#DCE3F0',
//   },
//   prefixText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#56627C',
//   },
//   prefixedInput: {
//     flex: 1,
//     height: '100%',
//     paddingHorizontal: 10,
//     fontSize: 13,
//     color: '#0E1B3D',
//   },
//   suffixedInputWrap: {
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.white,
//     paddingHorizontal: 8,
//   },
//   suffixedInput: {
//     flex: 1,
//     fontSize: 13,
//     color: '#0E1B3D',
//     height: '100%',
//   },
//   suffixPercentText: {
//     fontSize: 13,
//     color: '#56627C',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   qtyStepperRow: {
//     height: 40,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     overflow: 'hidden',
//   },
//   qtyBtn: {
//     width: 34,
//     flexShrink: 0,
//     height: '100%',
//     backgroundColor: '#0B2F7D',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   qtyBtnMuted: {
//     width: 34,
//     flexShrink: 0,
//     height: '100%',
//     backgroundColor: '#0B2F7D',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   qtyBtnText: {
//     color: colors.white,
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   qtyDirectInput: {
//     flex: 1,
//     width: 0,
//     minWidth: 0,
//     height: '100%',
//     textAlign: 'center',
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#0E1B3D',
//     backgroundColor: colors.white,
//   },
//   readOnlyWrap: {
//     backgroundColor: '#F8FAFC',
//   },
//   readOnlyValueText: {
//     paddingHorizontal: 10,
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#334155',
//   },
//   commentsInput: {
//     height: 64,
//     textAlignVertical: 'top',
//     paddingTop: 8,
//   },
//   addItemBtn: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#0B2F7D',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 6,
//     marginTop: 8,
//   },
//   addItemBtnText: {
//     color: colors.white,
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   totalsAndSignatureCol: {
//     flex: 1,
//     gap: 16,
//   },
//   summaryTable: {
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 8,
//     padding: 16,
//     backgroundColor: '#F8FAFD',
//     gap: 10,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   summaryLabel: {
//     fontSize: 13,
//     color: '#56627C',
//   },
//   summaryValue: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#0E1B3D',
//   },
//   summaryValueBold: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#0B2F7D',
//   },
//   grandTotalRow: {
//     borderTopWidth: 1,
//     borderTopColor: '#DCE3F0',
//     paddingTop: 10,
//     marginTop: 4,
//   },
//   grandTotalLabel: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0E1B3D',
//   },
//   grandTotalValue: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#0B2F7D',
//   },
//   dueAmountLabel: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#B3261E',
//   },
//   dueAmountValue: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#B3261E',
//   },
//   signatureBox: {
//     height: 84,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 8,
//     backgroundColor: colors.white,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 8,
//   },
//   signatureCursiveText: {
//     fontStyle: 'italic',
//     fontSize: 20,
//     color: '#0B2F7D',
//     fontWeight: '700',
//   },
//   signatoryLabel: {
//     fontSize: 11,
//     color: '#56627C',
//     marginTop: 4,
//   },
//   termsInput: {
//     height: 84,
//     textAlignVertical: 'top',
//     paddingTop: 8,
//   },
//   automationHeading: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0E1B3D',
//     marginBottom: 10,
//   },
//   automationRow: {
//     flexDirection: 'row',
//     gap: 24,
//     flexWrap: 'wrap',
//   },
//   automationToggleGroup: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   errorBanner: {
//     backgroundColor: '#FBECE8',
//     borderWidth: 1,
//     borderColor: 'rgba(248,113,113,0.40)',
//     borderRadius: 6,
//     padding: 12,
//     marginTop: 16,
//   },
//   errorBannerText: {
//     color: '#B3261E',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   footerActionsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 12,
//     marginTop: 24,
//   },
//   outlineActionBtn: {
//     height: 40,
//     paddingHorizontal: 20,
//     borderWidth: 1,
//     borderColor: '#DCE3F0',
//     borderRadius: 6,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: colors.white,
//   },
//   outlineActionBtnText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#0E1B3D',
//   },
//   navyButton: {
//     height: 40,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     backgroundColor: '#0B2F7D',
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   navyButtonText: {
//     color: colors.white,
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(11,27,69,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   previewModalCard: {
//     width: '100%',
//     maxWidth: 680,
//     backgroundColor: colors.white,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   previewHeaderBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#DCE3F0',
//     backgroundColor: colors.white,
//   },
//   previewHeaderTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0E1B3D',
//   },
//   printableSheet: {
//     padding: 24,
//     backgroundColor: colors.white,
//   },
//   companyNameText: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#0E1B3D',
//   },
// });

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoiceHsnMaster, INVOICE_HSN_MASTER_KEY } from '@/api/hsnMaster';
import type { HsnMasterEntry } from '@/api/hsnMaster';
import { ProfileSelect } from '@/settings/ProfileFields';
import { INDIA_STATES } from '@/settings/profileOptions';
import { Href, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useErrorToast } from '@/components/FeedbackToast';
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
type ItemType = 'SERVICE' | 'PRODUCT';
 
/* ──────────────────────────────────────────────────────────────
 * Design tokens
 * ────────────────────────────────────────────────────────────── */
const ui = {
  page: '#F3F5FA',
  surface: '#FFFFFF',
  tint: '#F8FAFD',
  line: '#E4E9F2',
  lineStrong: '#CBD5E6',
  ink: '#0F1B3D',
  body: '#475569',
  muted: '#6B7690',
  primary: '#0B2F7D',
  primarySoft: '#EAF0FF',
  primaryMid: '#C7D6F7',
  success: '#15803D',
  successSoft: '#E7F6EC',
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  info: '#1D4ED8',
  infoSoft: '#E8EFFE',
  // summary panel (the one bold moment on the screen)
  panel: '#0A1F52',
  panelSoft: 'rgba(255,255,255,0.08)',
  panelLine: 'rgba(255,255,255,0.14)',
  panelMuted: 'rgba(255,255,255,0.68)',
};
 
const DISCOUNT_OPTIONS: { label: string; value: DiscountType }[] = [
  { label: 'Overall discount', value: 'OVERALL' },
  { label: 'Per item discount', value: 'FLAT_PER_UNIT' },
];
 
const PAYMENT_STATUS_OPTIONS = [
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Half paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
] as const;
 
const CURRENCY_OPTIONS = [
  { label: '₹ INR', value: 'INR' },
  { label: '$ USD', value: 'USD' },
  { label: '€ EUR', value: 'EUR' },
] as const;
 
const blankItem = (): InvoiceFormItem => ({
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
});

const blankTypedItem = (itemType: ItemType): InvoiceFormItem => ({ ...blankItem(), itemType });
 
/* ──────────────────────────────────────────────────────────────
 * Date helpers (unchanged)
 * ────────────────────────────────────────────────────────────── */
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
 
const custName = (c: any) => c?.name || c?.lead?.name || '';
const custCompany = (c: any) => c?.companyName || c?.lead?.companyName || '';
const custPhone = (c: any) => c?.phone || c?.lead?.phone || '';
 
/* ──────────────────────────────────────────────────────────────
 * Small presentational building blocks
 * ────────────────────────────────────────────────────────────── */
function SectionCard({
  title,
  subtitle,
  icon,
  right,
  flex,
  zIndex,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  flex?: number;
  zIndex?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.card, flex !== undefined && { flex, minWidth: 0 }, zIndex !== undefined && { position: 'relative', zIndex }]}>
      <View style={s.cardHeader}>
        <View style={s.cardIcon}>
          <Ionicons name={icon} size={17} color={ui.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          {subtitle ? <Text style={s.cardSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}
 
/** Puts children side by side when `cols` is true, otherwise stacks them. `z` keeps dropdowns above later rows. */
function Row({ cols, z, gap = 16, children }: { cols: boolean; z?: number; gap?: number; children: React.ReactNode }) {
  return <View style={[{ gap, zIndex: z }, cols && { flexDirection: 'row', alignItems: 'stretch' }]}>{children}</View>;
}
 
function Field({ label, required, hint, style, children }: { label?: string; required?: boolean; hint?: string; style?: any; children: React.ReactNode }) {
  return (
    <View style={style}>
      {label ? (
        <Text style={s.label}>
          {label}
          {required ? <Text style={s.star}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}
 
function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View style={s.segTrack} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={[s.segItem, active && s.segItemActive]}
          >
            <Text style={[s.segText, active && s.segTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
 
function DropdownField({
  label,
  required,
  text,
  placeholder,
  open,
  onToggle,
  zIndex = 20,
  leadingIcon,
  accessibilityLabel,
  children,
}: {
  label?: string;
  required?: boolean;
  text?: string | null;
  placeholder?: string;
  open: boolean;
  onToggle: () => void;
  zIndex?: number;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ position: 'relative', zIndex: open ? zIndex + 500 : zIndex }}>
      {label ? (
        <Text style={s.label}>
          {label}
          {required ? <Text style={s.star}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded: open }}
        style={[s.select, open && s.selectOpen]}
        onPress={onToggle}
      >
        {leadingIcon ? <Ionicons name={leadingIcon} size={16} color={ui.muted} /> : null}
        <Text style={[s.selectText, !text && { color: ui.muted }]} numberOfLines={1}>
          {text || placeholder || 'Select…'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={ui.muted} />
      </Pressable>
      {open ? <View style={s.menu}>{children}</View> : null}
    </View>
  );
}
 
function MenuOption({ title, sub, active, onPress, muted }: { title: string; sub?: string; active?: boolean; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(active) }} style={[s.menuOption, active && s.menuOptionActive]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[s.menuOptionTitle, muted && { color: ui.muted, fontWeight: '500' }]}>{title}</Text>
        {sub ? <Text style={s.menuOptionSub}>{sub}</Text> : null}
      </View>
      {active ? <Ionicons name="checkmark" size={16} color={ui.primary} /> : null}
    </Pressable>
  );
}
 
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.sumRow}>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={s.sumValue}>{value}</Text>
    </View>
  );
}

function InvoiceCatalogSelect({
  label, selectedId, customValue, options, placeholder, allowCustom, selectedLabel, onSelect, onCustom,
}: {
  label: string; selectedId?: string; customValue: string; options: HsnMasterEntry[]; placeholder: string;
  allowCustom: boolean; selectedLabel?: (entry: HsnMasterEntry) => string; onSelect: (id: string) => void; onCustom: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((entry) => entry.id === selectedId);
  const query = search.trim().toLowerCase();
  const filtered = options.filter((entry) => `${entry.name ?? entry.description} ${entry.code}`.toLowerCase().includes(query));
  const customEntry = allowCustom && query && !options.some((entry) => (entry.name ?? entry.description).toLowerCase() === query);

  const chooseCustom = () => {
    const value = search.trim();
    if (!value) return;
    onCustom(value);
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={s.catalogField}>
      <Text style={s.label}>{label} <Text style={{ color: ui.danger }}>*</Text></Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected?.name ?? customValue ?? placeholder}`} style={s.catalogSelect} onPress={() => setOpen(true)}>
        <Text numberOfLines={1} style={[s.catalogSelectText, !selected && !customValue && s.catalogPlaceholder]}>{selected ? (selectedLabel?.(selected) ?? selected.name ?? selected.description) : customValue || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={ui.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.catalogBackdrop}>
          <Pressable accessibilityLabel="Close selection" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={s.catalogDialog} accessibilityViewIsModal>
            <View style={s.catalogDialogHeader}>
              <Text accessibilityRole="header" style={s.catalogDialogTitle}>{label}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close selection" onPress={() => setOpen(false)} hitSlop={12}><Ionicons name="close" size={22} color={ui.ink} /></Pressable>
            </View>
            <TextInput accessibilityLabel={`Search ${label} by name or HSN/SAC`} value={search} onChangeText={setSearch} placeholder="Search name or HSN/SAC code" style={s.catalogSearch} autoFocus />
            <ScrollView keyboardShouldPersistTaps="handled" style={s.catalogOptions}>
              {customEntry ? <Pressable accessibilityRole="button" style={s.catalogOption} onPress={chooseCustom}><Text style={s.catalogSelectText}>Use “{search.trim()}”</Text></Pressable> : null}
              {filtered.map((entry) => (
                <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected: selectedId === entry.id }} style={s.catalogOption} onPress={() => { onSelect(entry.id); setOpen(false); setSearch(''); }}>
                  <View style={{ flex: 1 }}><Text style={s.catalogSelectText}>{entry.name ?? entry.description}</Text><Text style={s.hint}>{entry.code || 'No HSN/SAC code'}</Text></View>
                  {selectedId === entry.id ? <Ionicons name="checkmark" size={18} color={ui.primary} /> : null}
                </Pressable>
              ))}
              {!filtered.length && !customEntry ? <Text style={s.hint}>No matching {label.toLowerCase()} found.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
 
/* ──────────────────────────────────────────────────────────────
 * Screen
 * ────────────────────────────────────────────────────────────── */
export function InvoiceFormScreen({ initialType = 'INVOICE', existingDocument, isClone = false }: InvoiceFormScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Layout follows the real content width (window width minus sidebar), measured below.
  const [contentWidth, setContentWidth] = useState<number>(Math.max(0, width - 260));
  const onShellLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setContentWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
  };
  const twoCol = contentWidth >= 860; // paired sections side by side
  const wide = contentWidth >= 560; // multi-column field rows
  const editingExisting = Boolean(existingDocument && !isClone);
  const companyQuery = useInvoiceCompanyProfile(!editingExisting);
  const companyProfile = editingExisting && existingDocument ? getDocumentCompanyProfile(existingDocument) : companyQuery.data;
  const companyUnavailable = !editingExisting && (companyQuery.isFetching || companyQuery.isError || !companyProfile?.companyName);
  const [savedDocument, setSavedDocument] = useState<SalesDocumentRecord | null>(null);
  const previewCompany = savedDocument ? getDocumentCompanyProfile(savedDocument) : companyProfile;
  const printStyles = useMemo(() => invoiceBranding(printBase, previewCompany), [previewCompany]);
 
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
  const [inclusiveGst, setInclusiveGst] = useState<boolean>(docType === 'QUOTATION' ? (existingDocument?.inclusiveGst ?? false) : (editingExisting ? (existingDocument?.inclusiveGst ?? false) : false));
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
          itemType: it.itemType,
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
      : [blankItem()],
  );
  const [animatingItemIndex, setAnimatingItemIndex] = useState<number | null>(null);
  const [itemSwitchOpacity] = useState(() => new Animated.Value(1));
  const [itemSwitchOffset] = useState(() => new Animated.Value(0));
  const reduceMotion = useRef(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) reduceMotion.current = enabled;
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotion.current = enabled;
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const switchItemType = (idx: number, next: ItemType) => {
    const currentType = items[idx]?.itemType ?? 'SERVICE';
    if (currentType === next) return;
    setItems((current) => current.map((item, itemIndex) => itemIndex === idx ? {
      ...item,
      itemType: next,
      hsnMasterId: undefined,
      hsnSac: '',
      hsnDescription: '',
      igstRate: 0,
      sgstRate: 0,
      cgstRate: 0,
      applyHsnMaster: false,
    } : item));
    setDiscountDropdownIndex(null);
    itemSwitchOpacity.stopAnimation();
    itemSwitchOffset.stopAnimation();
    if (reduceMotion.current) {
      setAnimatingItemIndex(null);
      itemSwitchOpacity.setValue(1);
      itemSwitchOffset.setValue(0);
      return;
    }
    setAnimatingItemIndex(idx);
    itemSwitchOpacity.setValue(0.75);
    itemSwitchOffset.setValue(4);
    Animated.parallel([
      Animated.timing(itemSwitchOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(itemSwitchOffset, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setAnimatingItemIndex(null); });
  };

  const catalogItems = hsnQuery.data ?? [];
 
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
        const master = hsnQuery.data?.find((entry) => entry.id === item.hsnMasterId && (!item.itemType || entry.itemType === item.itemType));
        return master ? { ...item, hsnSac: master.code, hsnDescription: master.description, igstRate: master.igstRate, sgstRate: master.sgstRate, cgstRate: master.cgstRate } : item;
      }),
    [items, editingExisting, gstMode, existingDocument?.gstMode, hsnQuery.data],
  );
  const [emailAutomation, setEmailAutomation] = useState<boolean>(existingDocument?.emailAutomation ?? false);
  const [whatsappAutomation, setWhatsappAutomation] = useState<boolean>(existingDocument?.whatsappAutomation ?? false);
 
  const [formError, setFormError] = useState<string | null>(null);
  useErrorToast(formError, 'Invoice needs attention');
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
      const name = custName(c).toLowerCase();
      const company = custCompany(c).toLowerCase();
      const phone = custPhone(c).toLowerCase();
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
      inclusiveGst: docType === 'INVOICE' && !editingExisting ? false : inclusiveGst,
      docType,
      paymentStatus,
      paidAmountInput: Number(paidAmountInput) || 0,
    });
  }, [effectiveItems, gstMode, inclusiveGst, docType, editingExisting, paymentStatus, paidAmountInput]);
 
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
      setItems([blankTypedItem('SERVICE')]);
    } else {
      setItems((prev) => prev.filter((_, i) => i !== idx));
    }
  };
 
  const handleAddItem = () => {
    setDiscountDropdownIndex(null);
    setItems((prev) => [...prev, blankTypedItem('SERVICE')]);
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
            : `Save ${isGstInvoice ? 'GST' : 'Non GST'} Invoice settings in Master Data → Invoice Settings before creating this invoice.`,
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
      if (needsMaster.some((item) => !hsnQuery.data?.some((entry) => entry.id === item.hsnMasterId && (entry.itemType === item.itemType || entry.itemType === 'LEGACY_HSN')))) {
        setFormError('Select an active Service, Product, or HSN master entry for each item.');
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
      inclusiveGst: gstMode === 'NON_GST' || (docType === 'INVOICE' && !editingExisting) ? false : inclusiveGst,
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
        itemType: it.itemType,
        hsnSac: gstMode === 'NON_GST' ? '' : it.hsnSac.trim(),
        hsnMasterId: it.hsnMasterId,
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
  const actionsDisabled = isSaving || Boolean(companyUnavailable) || invoiceSettingsUnavailable;
  const docLabel = docType === 'QUOTATION' ? 'Quotation' : 'Invoice';
  const pageTitle = `${editingExisting ? 'Edit' : isClone ? 'Duplicate' : 'New'} ${docLabel.toLowerCase()}`;
  const accent = companyProfile?.themeColor || ui.primary;
  const sameState =
    Boolean(companyProfile?.state) && Boolean(customerState) && customerState.trim().toLowerCase() === companyProfile?.state?.trim().toLowerCase();
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;
  const gstLabel = gstMode === 'NON_GST' ? 'Non GST' : gstMode === 'IGST' ? 'IGST' : 'SGST / CGST';
  const settled = calculations.dueAmount <= 0;
 
  /* ─────────────── Sections ─────────────── */
 
  const headerCard = (
    <View style={s.card}>
      <View style={[s.accentBar, { backgroundColor: accent }]} />
      <View style={[s.headerInner, wide && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <View style={s.companyBlock}>
          {companyProfile ? <InvoiceCompanyDetails profile={companyProfile} /> : null}
          {!editingExisting && companyQuery.isFetching ? <ActivityIndicator accessibilityLabel="Loading company profile" color={colors.primary} /> : null}
          {!editingExisting && !companyQuery.isFetching && (companyQuery.isError || !companyProfile) ? (
            <View style={s.alertBox}>
              <Ionicons name="alert-circle" size={18} color={ui.danger} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text accessibilityRole="alert" style={s.alertText}>
                  {companyQuery.isError ? errorMessage(companyQuery.error) : 'Save Company Profile in General Settings → Web Settings to create invoices.'}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => { void companyQuery.refetch(); }}>
                  <Text style={s.linkText}>Reload company profile</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
 
        <View style={wide ? s.dateBlock : undefined}>
          <Field label="Issue date" required>
            <View style={s.inputWithIcon}>
              <Ionicons name="calendar-outline" size={16} color={ui.muted} />
              <TextInput
                style={s.inputBare}
                value={dateDisplay}
                onChangeText={setDateDisplay}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={ui.muted}
                maxLength={10}
              />
            </View>
          </Field>
        </View>
      </View>
    </View>
  );
 
  const bankRows = [
    ['Bank', documentBank.bankName],
    ['Account no.', documentBank.accountNo],
    ['IFSC', documentBank.ifscCode],
    ...(documentBank.paymentUpiId ? [['UPI ID', documentBank.paymentUpiId]] : []),
  ].filter(([, v]) => Boolean(v?.trim())) as [string, string][];

  const hasBankDetails = bankRows.length > 0;

  const customerCard = (
    <SectionCard flex={twoCol ? (hasBankDetails ? 1.45 : 1) : undefined} title={docType === 'QUOTATION' ? 'Quotation to' : 'Bill to'} subtitle="Choose the customer and confirm their state for tax" icon="person-outline">
      <View style={{ gap: 14 }}>
        <DropdownField
          label="Customer"
          required
          leadingIcon="search-outline"
          open={customerDropdownOpen}
          onToggle={() => setCustomerDropdownOpen((o) => !o)}
          zIndex={120}
          placeholder="Search or select a customer"
          text={
            selectedCustomer
              ? `${custCompany(selectedCustomer)} ${custName(selectedCustomer)} (${custPhone(selectedCustomer)})`.trim()
              : ''
          }
        >
          <TextInput
            style={s.menuSearch}
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Search by name, company or mobile"
            placeholderTextColor={ui.muted}
          />
          {loadingCustomers ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : filteredCustomers.length === 0 ? (
            <Text style={s.menuEmpty}>No customers match your search</Text>
          ) : (
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              {filteredCustomers.map((cust: any) => {
                const cName = custName(cust) || 'Customer';
                const cComp = custCompany(cust);
                const cPhone = custPhone(cust);
                return (
                  <MenuOption
                    key={cust.id}
                    title={cComp ? `${cComp} — ${cName}` : cName}
                    sub={cPhone || undefined}
                    active={cust.id === customerId}
                    onPress={() => {
                      const cState = cust.lead?.state || cust.state || '';
                      setCustomerId(cust.id);
                      setCustomerState(cState);
                      if (cState) applyGstModeForState(cState);
                      if (!editingExisting && cust.lead?.service) {
                        const svc = cust.lead.service;
                        setItems((prev) => {
                          if (prev.length === 1 && !prev[0].productName.trim()) {
                            return [
                              {
                                ...prev[0],
                                productName: svc.name,
                                hsnSac: (svc as any).hsnSac || '',
                                hsnDescription: (svc as any).description || svc.name,
                                hsnMasterId: svc.id,
                                igstRate: Number((svc as any).igstRate ?? 18),
                                sgstRate: Number((svc as any).sgstRate ?? 9),
                                cgstRate: Number((svc as any).cgstRate ?? 9),
                                applyHsnMaster: true,
                              },
                            ];
                          }
                          return prev;
                        });
                      }
                      setCustomerDropdownOpen(false);
                    }}
                  />
                );
              })}
            </ScrollView>
          )}
        </DropdownField>
 
        {Boolean(selectedCustomer) && (
          <>
            <View style={s.customerChip}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(custCompany(selectedCustomer) || custName(selectedCustomer) || 'C').trim().charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.customerChipTitle} numberOfLines={1}>
                  {custCompany(selectedCustomer) || custName(selectedCustomer)}
                </Text>
                <Text style={s.customerChipSub} numberOfLines={2}>
                  {[custCompany(selectedCustomer) ? custName(selectedCustomer) : '', custPhone(selectedCustomer), selectedCustomer.address || selectedCustomer.lead?.address]
                    .filter(Boolean)
                    .join('  •  ')}
                </Text>
              </View>
            </View>
 
            <ProfileSelect
              label="Customer state (used for GST)"
              allowCustom={true}
              value={customerState}
              options={INDIA_STATES}
              onChange={(val) => {
                setCustomerState(val);
                applyGstModeForState(val);
              }}
            />
            {Boolean(companyProfile?.state) && Boolean(customerState) && (
              <View style={[s.taxHint, { backgroundColor: sameState ? ui.successSoft : ui.infoSoft }]}>
                <Ionicons name={sameState ? 'business-outline' : 'swap-horizontal'} size={16} color={sameState ? ui.success : ui.info} />
                <Text style={[s.taxHintText, { color: sameState ? ui.success : ui.info }]}>
                  {companyProfile?.state} → {customerState}.{' '}
                  <Text style={{ fontWeight: '800' }}>{sameState ? 'Same state: CGST + SGST applies' : 'Different state: IGST applies'}</Text>
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </SectionCard>
  );
 
  const bankCard = hasBankDetails ? (
    <SectionCard flex={twoCol ? 1 : undefined} title="Payment details" subtitle="Bank details printed on the document" icon="card-outline">
      <View style={{ gap: 12 }}>
        {bankRows.map(([k, v]) => (
          <View key={k} style={s.bankRow}>
            <Text style={s.bankKey}>{k}</Text>
            <Text style={s.bankVal} numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  ) : null;
 
  const taxCard = (
    <SectionCard title="Tax and currency" subtitle="Rates are filled in automatically from the HSN master" icon="receipt-outline">
      <View style={[wide && { flexDirection: 'row', alignItems: 'flex-start' }, { gap: 20 }]}>
        <View style={{ flex: 1.4, gap: 12 }}>
          <Field label="GST type" required>
            <View style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Non GST"
                accessibilityState={{ checked: gstMode === 'NON_GST' }}
                style={[s.nonGstToggle, gstMode === 'NON_GST' ? s.nonGstToggleOn : s.nonGstToggleOff]}
                onPress={() => {
                  if (gstMode !== 'NON_GST') {
                    setGstMode('NON_GST');
                    return;
                  }
                  if (!companyProfile?.state?.trim() || !customerState.trim()) {
                    setFormError('Select the company and customer states to calculate GST automatically.');
                    return;
                  }
                  applyGstModeForState(customerState, companyProfile.state);
                }}
              >
                <Text style={[s.nonGstToggleText, gstMode === 'NON_GST' && s.nonGstToggleTextOn]}>Non GST</Text>
              </Pressable>
              {gstMode !== 'NON_GST' ? (
                <Text style={s.hint}>
                  GST is automatic from both states: {gstMode === 'IGST' ? 'IGST' : 'CGST + SGST'}.
                </Text>
              ) : null}
            </View>
          </Field>
          {gstMode !== 'NON_GST' && (docType === 'QUOTATION' || editingExisting) && (
            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>{docType === 'INVOICE' ? 'Prices include GST (saved invoice)' : 'Prices include GST'}</Text>
                <Text style={s.switchSub}>Tax is extracted from the entered price</Text>
              </View>
              {docType === 'QUOTATION' ? <Switch value={inclusiveGst} onValueChange={setInclusiveGst} trackColor={{ false: '#CBD5E1', true: ui.primary }} /> : <Text style={s.switchTitle}>{inclusiveGst ? 'Yes' : 'No'}</Text>}
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <DropdownField
            label="Currency"
            text={CURRENCY_OPTIONS.find((option) => option.value === currency)?.label ?? currency}
            open={currencyDropdownOpen}
            onToggle={() => setCurrencyDropdownOpen((open) => !open)}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <MenuOption
                key={option.value}
                title={option.label}
                active={currency === option.value}
                onPress={() => {
                  setCurrency(option.value);
                  setCurrencyDropdownOpen(false);
                }}
              />
            ))}
          </DropdownField>
        </View>
      </View>
    </SectionCard>
  );
 
  const itemsCard = (
    <SectionCard
      title="Items"
      subtitle={`${effectiveItems.length} ${effectiveItems.length === 1 ? 'line' : 'lines'} • ${gstLabel}`}
      icon="cube-outline"
      right={
        <Pressable accessibilityRole="button" style={s.addBtnSmall} onPress={handleAddItem}>
          <Ionicons name="add" size={16} color={ui.primary} />
          <Text style={s.addBtnSmallText}>Add item</Text>
        </Pressable>
      }
    >
      {effectiveItems.map((item, idx) => {
        const itemType = item.itemType ?? 'SERVICE';
        const itemCatalogItems = catalogItems.filter((entry) => entry.itemType === itemType);
        const lineCalc = calculations.lineBreakdowns[idx] || {
          taxableAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
        };
        const layer = effectiveItems.length - idx + (discountDropdownIndex === idx ? 100 : 0);
        return (
          <View key={idx} style={[s.itemCard, { zIndex: layer }]}>
            <View style={s.itemHeader}>
              <View style={s.itemBadge}>
                <Text style={s.itemBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={s.itemHeaderTitle} numberOfLines={1}>
                {item.productName.trim() || `Item ${idx + 1}`}
              </Text>
              <View style={s.itemTypeBadge}>
                <Text style={s.itemTypeBadgeText}>{item.itemType === 'PRODUCT' ? 'Product' : 'Service'}</Text>
              </View>
              <Text style={s.itemHeaderTotal}>{fmt(lineCalc.totalAmount)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${idx + 1}`} onPress={() => handleRemoveItem(idx)} hitSlop={8} style={s.iconBtn}>
                <Ionicons name="trash-outline" size={16} color={ui.danger} />
              </Pressable>
            </View>

            <View style={s.itemTypeSwitch} accessibilityRole="tablist" accessibilityLabel={`Item ${idx + 1} type`}>
              {([
                { type: 'SERVICE', label: 'Service' },
                { type: 'PRODUCT', label: 'Product' },
              ] as const).map((option) => {
                const selected = itemType === option.type;
                return (
                  <Pressable
                    key={option.type}
                    accessibilityRole="tab"
                    accessibilityLabel={`Choose ${option.label} for item ${idx + 1}`}
                    accessibilityState={{ selected }}
                    onPress={() => switchItemType(idx, option.type)}
                    style={(state) => [
                      s.itemTypeOption,
                      selected ? s.itemTypeOptionSelected : s.itemTypeOptionIdle,
                      (state as any).focused && s.itemTypeOptionFocused,
                      (state as any).hovered && !selected && s.itemTypeOptionHovered,
                    ]}
                  >
                    <Text style={[s.itemTypeText, contentWidth < 560 && { fontSize: 16 }, selected && s.itemTypeTextSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Animated.View style={animatingItemIndex === idx ? { opacity: itemSwitchOpacity, transform: [{ translateY: itemSwitchOffset }] } : undefined}>
 
            {/* Product + HSN */}
            <View style={[wide && { flexDirection: 'row', alignItems: 'flex-start' }, { gap: 14, zIndex: 5 }]}>
              <View style={{ flex: 3 }}>
                <InvoiceCatalogSelect
                  key={`${idx}-${itemType}`}
                  label={itemType === 'PRODUCT' ? 'Product' : 'Service'}
                  selectedId={item.hsnMasterId}
                  customValue={item.productName}
                  options={itemCatalogItems}
                  allowCustom={true}
                  onSelect={(id) => {
                    const match = itemCatalogItems.find((entry) => entry.id === id);
                    if (!match) return;
                    handleUpdateItem(idx, {
                      itemType,
                      productName: match.name ?? match.description,
                      hsnMasterId: match.id,
                      hsnSac: match.code,
                      hsnDescription: match.description,
                      igstRate: match.igstRate,
                      sgstRate: match.sgstRate,
                      cgstRate: match.cgstRate,
                      applyHsnMaster: true,
                    });
                  }}
                  onCustom={(val) => handleUpdateItem(idx, { itemType, productName: val, hsnMasterId: undefined, hsnDescription: '', hsnSac: '', igstRate: 0, sgstRate: 0, cgstRate: 0, applyHsnMaster: false })}
                  placeholder={`Select a ${itemType === 'PRODUCT' ? 'product' : 'service'}`}
                />
              </View>
 
              {gstMode !== 'NON_GST' && (
                <View style={{ flex: 2, minWidth: 180 }}>
                  <InvoiceCatalogSelect
                    key={`${idx}-${itemType}`}
                    label="HSN code"
                    selectedId={item.hsnMasterId}
                    customValue={item.hsnSac ? `${item.hsnSac}${item.hsnDescription ? ` — ${item.hsnDescription}` : ''}` : ''}
                    options={catalogItems.filter((entry) => entry.itemType === itemType || entry.itemType === 'LEGACY_HSN')}
                    allowCustom={false}
                    selectedLabel={(entry) => `${entry.code}${entry.description ? ` — ${entry.description}` : ''}`}
                    onSelect={(id) => {
                      const master = catalogItems.find((entry) => entry.id === id && (entry.itemType === itemType || entry.itemType === 'LEGACY_HSN'));
                      if (!master) return;
                      handleUpdateItem(idx, {
                        productName: master.itemType === 'LEGACY_HSN' ? item.productName : (master.name ?? master.description),
                        ...(master.itemType !== 'LEGACY_HSN' ? { itemType: master.itemType } : {}),
                        hsnMasterId: master.id,
                        hsnSac: master.code,
                        hsnDescription: master.description,
                        igstRate: master.igstRate,
                        sgstRate: master.sgstRate,
                        cgstRate: master.cgstRate,
                        applyHsnMaster: true,
                      });
                    }}
                    onCustom={() => undefined}
                    placeholder="Select HSN code"
                  />
                  {item.hsnDescription ? <Text style={s.hint}>{item.hsnDescription}</Text> : null}
                </View>
              )}
            </View>
            {hsnQuery.isPending ? (
              <Text style={s.hint}>Loading {itemType === 'PRODUCT' ? 'products' : 'services'}…</Text>
            ) : hsnQuery.isError ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Retry loading invoice catalogue" onPress={() => { void hsnQuery.refetch(); }}>
                <Text style={[s.hint, { color: ui.danger }]}>Could not load {itemType === 'PRODUCT' ? 'products' : 'services'}. Tap to retry.</Text>
              </Pressable>
            ) : !itemCatalogItems.length ? (
              <Text style={s.hint}>No active {itemType === 'PRODUCT' ? 'products' : 'services'} found in Master Data.</Text>
            ) : null}
 
            {/* Metrics */}
            <View style={[wide && { flexDirection: 'row', alignItems: 'flex-start' }, s.metricsRow, { zIndex: discountDropdownIndex === idx ? 50 : 1 }]}>
              <Field label="Cost" required style={s.metric}>
                <View style={s.prefixWrap}>
                  <View style={s.prefixBox}>
                    <Text style={s.prefixText}>{currencySymbol}</Text>
                  </View>
                  <TextInput
                    style={s.prefixInput}
                    keyboardType="numeric"
                    value={String(item.unitPrice)}
                    onChangeText={(val) => handleUpdateItem(idx, { unitPrice: Number(val.replace(/[^0-9.]/g, '')) || 0 })}
                  />
                </View>
              </Field>
 
              <Field label="Quantity" required style={wide ? s.metricQty : undefined}>
                <View style={s.stepper}>
                  <Pressable
                    style={s.stepBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity for item ${idx + 1}`}
                    onPress={() => handleUpdateItem(idx, { quantity: Math.max(1, (Number(item.quantity) || 1) - 1) })}
                  >
                    <Ionicons name="remove" size={16} color={ui.primary} />
                  </Pressable>
                  <TextInput
                    style={s.stepInput}
                    keyboardType="numeric"
                    value={String(item.quantity)}
                    onChangeText={(val) => {
                      const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                      handleUpdateItem(idx, { quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 });
                    }}
                  />
                  <Pressable
                    style={s.stepBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity for item ${idx + 1}`}
                    onPress={() => handleUpdateItem(idx, { quantity: (Number(item.quantity) || 1) + 1 })}
                  >
                    <Ionicons name="add" size={16} color={ui.primary} />
                  </Pressable>
                </View>
              </Field>
 
              <Field label="Discount" style={s.metric}>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={String(item.discountValue)}
                  onChangeText={(val) => handleUpdateItem(idx, { discountValue: Number(val.replace(/[^0-9.]/g, '')) || 0 })}
                />
              </Field>
 
              <View style={s.metric}>
                <DropdownField
                  label="Discount type"
                  accessibilityLabel={`Discount type for item ${idx + 1}`}
                  open={discountDropdownIndex === idx}
                  onToggle={() => setDiscountDropdownIndex((current) => (current === idx ? null : idx))}
                  text={item.discountType === 'FLAT_PER_UNIT' ? 'Per item' : item.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Overall'}
                >
                  {DISCOUNT_OPTIONS.map((option) => (
                    <MenuOption
                      key={option.value}
                      title={option.label}
                      active={item.discountType === option.value}
                      onPress={() => {
                        handleUpdateItem(idx, { discountType: option.value });
                        setDiscountDropdownIndex(null);
                      }}
                    />
                  ))}
                </DropdownField>
              </View>
            </View>
 
            {/* Tax strip */}
            {docType === 'INVOICE' ? (
              <View style={[s.taxStrip, { flexWrap: 'wrap' }]}>
                <View style={s.taxCell}><Text style={s.taxCellLabel}>Gross amount</Text><Text style={s.taxCellValue}>{fmt(lineCalc.grossAmount)}</Text></View>
                <View style={s.taxCell}><Text style={s.taxCellLabel}>Discount</Text><Text style={s.taxCellValue}>− {fmt(lineCalc.discountAmount)}</Text></View>
                <View style={s.taxCell}><Text style={s.taxCellLabel}>Taxable amount</Text><Text style={s.taxCellValue}>{fmt(lineCalc.taxableAmount)}</Text></View>
                {gstMode === 'IGST' && <View style={s.taxCell}><Text style={s.taxCellLabel}>IGST ({lineCalc.igstRate}%)</Text><Text style={s.taxCellValue}>{fmt(lineCalc.igstAmount)}</Text></View>}
                {gstMode === 'SGST_CGST' && <>
                  <View style={s.taxCell}><Text style={s.taxCellLabel}>CGST ({lineCalc.cgstRate}%)</Text><Text style={s.taxCellValue}>{fmt(lineCalc.cgstAmount)}</Text></View>
                  <View style={s.taxCell}><Text style={s.taxCellLabel}>SGST ({lineCalc.sgstRate}%)</Text><Text style={s.taxCellValue}>{fmt(lineCalc.sgstAmount)}</Text></View>
                </>}
                {gstMode !== 'NON_GST' && <View style={s.taxCell}><Text style={s.taxCellLabel}>Total GST</Text><Text style={s.taxCellValue}>{fmt(lineCalc.taxAmount)}</Text></View>}
                <View style={[s.taxCell, s.taxCellTotal]}><Text style={[s.taxCellLabel, { color: ui.primary }]}>Item total</Text><Text style={[s.taxCellValue, { color: ui.primary, fontWeight: '800' }]}>{fmt(lineCalc.totalAmount)}</Text></View>
              </View>
            ) : <View style={s.taxStrip}>
              <View style={s.taxCell}>
                <Text style={s.taxCellLabel}>Taxable</Text>
                <Text style={s.taxCellValue}>{fmt(lineCalc.taxableAmount)}</Text>
              </View>
              {gstMode === 'IGST' && (
                <View style={s.taxCell}>
                  <Text style={s.taxCellLabel}>IGST</Text>
                  <Text accessibilityLabel={`IGST rate from HSN for item ${idx + 1}`} style={s.taxCellValue}>
                    {item.igstRate}%
                  </Text>
                </View>
              )}
              {gstMode === 'SGST_CGST' && (
                <>
                  <View style={s.taxCell}>
                    <Text style={s.taxCellLabel}>SGST</Text>
                    <Text accessibilityLabel={`SGST rate from HSN for item ${idx + 1}`} style={s.taxCellValue}>
                      {item.sgstRate}%
                    </Text>
                  </View>
                  <View style={s.taxCell}>
                    <Text style={s.taxCellLabel}>CGST</Text>
                    <Text accessibilityLabel={`CGST rate from HSN for item ${idx + 1}`} style={s.taxCellValue}>
                      {item.cgstRate}%
                    </Text>
                  </View>
                </>
              )}
              {gstMode !== 'NON_GST' && (
                <View style={s.taxCell}>
                  <Text style={s.taxCellLabel}>Tax</Text>
                  <Text style={s.taxCellValue}>{fmt(lineCalc.taxAmount)}</Text>
                </View>
              )}
              <View style={[s.taxCell, s.taxCellTotal]}>
                <Text style={[s.taxCellLabel, { color: ui.primary }]}>Line total</Text>
                <Text style={[s.taxCellValue, { color: ui.primary, fontWeight: '800' }]}>{fmt(lineCalc.totalAmount)}</Text>
              </View>
            </View>}
 
            <Field label="Notes for this item" style={{ marginTop: 14 }}>
              <TextInput
                style={[s.input, s.multiline, { height: 60 }]}
                multiline
                value={item.comments || ''}
                onChangeText={(val) => handleUpdateItem(idx, { comments: val })}
                placeholder="Optional — shown on the document"
                placeholderTextColor={ui.muted}
              />
            </Field>
            </Animated.View>
          </View>
        );
      })}
 
      <Pressable accessibilityRole="button" style={s.addItemDashed} onPress={handleAddItem}>
        <Ionicons name="add-circle-outline" size={18} color={ui.primary} />
        <Text style={s.addItemDashedText}>Add another item</Text>
      </Pressable>
    </SectionCard>
  );
 


    const paymentCard = (
    <SectionCard
      flex={twoCol ? 1.35 : undefined}
      zIndex={paymentMethodDropdownOpen || brochureDropdownOpen ? 100 : undefined}
      title="Payment"
      subtitle="Record what has been received, when the next payment is due, and attach a brochure"
      icon="wallet-outline"
    >
      <View style={{ gap: 16 }}>
        <Field label="Payment status">
          <Segmented
            options={PAYMENT_STATUS_OPTIONS}
            value={paymentStatus === 'HALF_PAID' ? 'PARTIALLY_PAID' : paymentStatus}
            onChange={(v) => {
              setPaymentStatus(v);
              setPaymentMethodDropdownOpen(false);
              setBrochureDropdownOpen(false);
            }}
            accessibilityLabel="Payment status"
          />
        </Field>

        <View style={s.grid}>
          {paymentStatus !== 'UNPAID' && (
            <>
              <Field label="Payment date" style={s.cell}>
                <View style={s.inputWithIcon}>
                  <Ionicons name="calendar-outline" size={16} color={ui.muted} />
                  <TextInput
                    accessibilityLabel="Payment Date"
                    style={s.inputBare}
                    value={paymentDateDisplay}
                    onChangeText={setPaymentDateDisplay}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor={ui.muted}
                  />
                </View>
              </Field>

              <View style={[s.cell, paymentMethodDropdownOpen && { position: 'relative', zIndex: 1000, elevation: 1000 }]}>
                <DropdownField
                  label="Accept payments via"
                  open={paymentMethodDropdownOpen}
                  zIndex={50}
                  onToggle={() => {
                    setBrochureDropdownOpen(false);
                    setPaymentMethodDropdownOpen((open) => !open);
                  }}
                  placeholder="Select a method"
                  text={
                    paymentMethods.find((method) => method.id === paymentMethodId)?.method ||
                    (paymentMethodId === existingDocument?.paymentMethodId ? existingDocument?.paymentMethodName : null) ||
                    ''
                  }
                >
                  {loadingPaymentMethods ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : paymentMethodsError ? (
                    <MenuOption title="Unable to load payment methods. Retry" onPress={() => { void refetchPaymentMethods(); }} />
                  ) : !paymentMethods.some((method) => method.isActive !== false) ? (
                    <Text style={s.menuEmpty}>No payment methods configured.</Text>
                  ) : (
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                      {paymentMethods
                        .filter((method) => method.isActive !== false)
                        .map((method) => (
                          <MenuOption
                            key={method.id}
                            title={method.method}
                            active={paymentMethodId === method.id}
                            onPress={() => {
                              setPaymentMethodId(method.id);
                              setPaymentMethodDropdownOpen(false);
                            }}
                          />
                        ))}
                    </ScrollView>
                  )}
                </DropdownField>
              </View>

              <Field label="Amount received" style={s.cell}>
                <View style={[s.prefixWrap, paymentStatus === 'PAID' && { backgroundColor: ui.tint }]}>
                  <View style={s.prefixBox}>
                    <Text style={s.prefixText}>{currencySymbol}</Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Payment Amount"
                    style={s.prefixInput}
                    keyboardType="numeric"
                    editable={paymentStatus !== 'PAID'}
                    value={paymentStatus === 'PAID' ? calculations.grandTotal.toFixed(2) : paidAmountInput}
                    onChangeText={setPaidAmountInput}
                    placeholder="0.00"
                    placeholderTextColor={ui.muted}
                  />
                </View>
              </Field>
            </>
          )}

          {paymentStatus !== 'PAID' && (
            <Field label="Next payment date" style={s.cell}>
              <View style={s.nextDateField}>
                <TextInput
                  accessibilityLabel="Next Payment Date (DD-MM-YYYY)"
                  style={s.nextDateInput}
                  value={nextPaymentDateDisplay}
                  onChangeText={setNextPaymentDateDisplay}
                  maxLength={10}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={ui.muted}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open next payment date calendar"
                  style={s.nextDateBtn}
                  onPress={() => {
                    setPaymentMethodDropdownOpen(false);
                    setBrochureDropdownOpen(false);
                    setNextPaymentDatePickerOpen(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={ui.primary} />
                </Pressable>
              </View>
            </Field>
          )}

          <View style={s.cell}>
            <DropdownField
              label="Brochure"
              open={brochureDropdownOpen}
              zIndex={30}
              onToggle={() => {
                setPaymentMethodDropdownOpen(false);
                setBrochureDropdownOpen((o) => !o);
              }}
              placeholder="None attached"
              text={brochureId ? brochures.find((b) => b.id === brochureId)?.brochureName || 'Select brochure' : ''}
            >
              <MenuOption
                title="None"
                muted
                active={!brochureId}
                onPress={() => {
                  setBrochureId(null);
                  setBrochureDropdownOpen(false);
                }}
              />
              {brochures.map((b) => (
                <MenuOption
                  key={b.id}
                  title={`${b.brochureName} (${b.type})`}
                  active={brochureId === b.id}
                  onPress={() => {
                    setBrochureId(b.id);
                    setBrochureDropdownOpen(false);
                  }}
                />
              ))}
            </DropdownField>
          </View>
        </View>
      </View>
    </SectionCard>
  );
 
  /* The one bold element: dark ledger-style summary. It lives beside Payment, in the normal flow. */
  const summaryCard = (
    <View style={[s.panel, twoCol && { flex: 1, minWidth: 0 }]}>
      <View style={s.panelTop}>
        <Text style={s.panelKicker}>{docLabel} summary</Text>
        <View style={s.panelChips}>
          <View style={s.panelChip}>
            <Text style={s.panelChipText}>{gstLabel}</Text>
          </View>
          {inclusiveGst && gstMode !== 'NON_GST' && (docType === 'QUOTATION' || editingExisting) ? (
            <View style={s.panelChip}>
              <Text style={s.panelChipText}>Incl. GST</Text>
            </View>
          ) : null}
          <View style={s.panelChip}>
            <Text style={s.panelChipText}>
              {effectiveItems.length} {effectiveItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      </View>
 
      <View style={s.panelBody}>
        <SummaryRow label="Gross subtotal" value={fmt(calculations.grossSubtotal)} />
        <SummaryRow label="Discount" value={`− ${fmt(calculations.discountTotal)}`} />
        <SummaryRow label="Taxable amount" value={fmt(calculations.taxableSubtotal)} />
        {gstMode === 'IGST' && <SummaryRow label="IGST" value={fmt(calculations.igstTotal)} />}
        {gstMode === 'SGST_CGST' && (
          <>
            <SummaryRow label="SGST" value={fmt(calculations.sgstTotal)} />
            <SummaryRow label="CGST" value={fmt(calculations.cgstTotal)} />
          </>
        )}
        <SummaryRow label="Total tax" value={fmt(calculations.taxTotal)} />
 
        <View style={s.grandRow}>
          <Text style={s.grandLabel}>Grand total</Text>
          <Text style={s.grandValue} adjustsFontSizeToFit numberOfLines={1}>
            {fmt(calculations.grandTotal)}
          </Text>
        </View>
 
        {docType === 'INVOICE' && (
          <>
            <SummaryRow label="Received" value={fmt(calculations.receivedAmount)} />
            <View style={[s.dueBox, settled && s.dueBoxSettled]}>
              <Text style={s.dueLabel}>{settled ? 'Fully paid' : 'Balance due'}</Text>
              <Text style={s.dueValue}>{fmt(calculations.dueAmount)}</Text>
            </View>
          </>
        )}
 
        <View style={s.signatureWell}>
          {docType === 'INVOICE' ? (
            <InvoiceSignature signature={invoiceSettings?.signature} name={editingExisting ? existingDocument?.signatoryName : undefined} color="#0F1B3D" />
          ) : (
            <>
              <Text style={s.signatureCursive}>{DEFAULT_DOCUMENT_CONFIG.signatoryName}</Text>
              <Text style={s.signatoryLabel}>Authorized Signatory</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
 
  const notesCard = (
    <SectionCard title="Terms and conditions" subtitle="Shown at the bottom of the document" icon="document-text-outline">
      <Field label="Terms & conditions">
        <TextInput style={[s.input, s.multiline, { height: 96 }]} multiline value={termsAndConditions} onChangeText={setTermsAndConditions} placeholder="Add payment terms, delivery notes…" placeholderTextColor={ui.muted} />
      </Field>
    </SectionCard>
  );
 
  /* Fixed bottom bar: always-visible total + actions (replaces the sticky side column) */
  const actionBar = (
    <View style={s.footer}>
      {formError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={ui.danger} />
          <Text style={s.errorBannerText}>{formError}</Text>
        </View>
      ) : null}
      <View style={s.footerRow}>
        <View style={s.footerTotals}>
          <View>
            <Text style={s.footerLabel}>{docLabel} total</Text>
            <Text style={s.footerTotal}>{fmt(calculations.grandTotal)}</Text>
          </View>
          {docType === 'INVOICE' ? (
            <View style={[s.footerDue, settled && { backgroundColor: ui.successSoft }]}>
              <Text style={[s.footerDueLabel, settled && { color: ui.success }]}>{settled ? 'Fully paid' : 'Balance due'}</Text>
              {!settled ? <Text style={s.footerDueValue}>{fmt(calculations.dueAmount)}</Text> : null}
            </View>
          ) : null}
        </View>
 
        <View style={s.footerActions}>
          <Pressable
            accessibilityRole="button"
            style={[s.outlineBtn, s.footerBtn, actionsDisabled && { opacity: 0.6 }]}
            disabled={actionsDisabled}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                setPreviewModalOpen(true);
              } else {
                handleSave(true);
              }
            }}
          >
            <Ionicons name="eye-outline" size={18} color={ui.ink} />
            <Text style={s.outlineBtnText}>Preview and download</Text>
          </Pressable>
 
          <Pressable
            accessibilityRole="button"
            style={[s.navyBtn, s.footerBtn, actionsDisabled && { opacity: 0.6 }]}
            disabled={actionsDisabled}
            onPress={() => handleSave(false)}
          >
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle" size={18} color="#fff" />}
            <Text style={s.navyBtnText}>{editingExisting ? 'Save changes' : `Generate ${docLabel.toLowerCase()}`}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
 
  return (
    <View style={s.screen}>
      <ScrollView style={s.page} contentContainerStyle={s.pageContent} keyboardShouldPersistTaps="handled">
        <View style={s.shell} onLayout={onShellLayout}>
          {/* Page header */}
          <View style={s.pageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.pageTitle}>{pageTitle}</Text>
              <Text style={s.pageSub}>
                {editingExisting && existingDocument?.documentNo ? `${existingDocument.documentNo} • ` : ''}
                Fill in the details — totals update as you type.
              </Text>
            </View>
            <View style={s.typePill}>
              <Ionicons name={docType === 'QUOTATION' ? 'pricetag-outline' : 'document-text-outline'} size={14} color={ui.primary} />
              <Text style={s.typePillText}>{docLabel}</Text>
            </View>
          </View>
 
          <View style={s.formCol}>
            <View style={{ zIndex: 60 }}>{headerCard}</View>
            <Row cols={twoCol && hasBankDetails} z={50}>
              {customerCard}
              {bankCard}
            </Row>
            <View style={{ zIndex: 40 }}>{taxCard}</View>
            <View style={{ zIndex: 30 }}>{itemsCard}</View>
            <Row cols={twoCol} z={paymentMethodDropdownOpen || brochureDropdownOpen ? 80 : 20}>
              {paymentCard}
              {summaryCard}
            </Row>
            <View style={{ zIndex: 10 }}>{notesCard}</View>
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
      </ScrollView>
 
      {actionBar}
 
      {/* Printable preview / download modal */}
      <Modal visible={previewModalOpen} transparent animationType="fade" onRequestClose={() => setPreviewModalOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.previewCard}>
            <View style={s.previewBar}>
              <View style={{ flex: 1 }}>
                <Text style={s.previewTitle}>{docLabel} preview</Text>
                <Text style={s.previewSub}>This is how the document will look when printed</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Platform.OS === 'web' && (
                  <Pressable
                    accessibilityRole="button"
                    style={s.navyBtn}
                    onPress={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                  >
                    <Ionicons name="print-outline" size={16} color="#fff" />
                    <Text style={s.navyBtnText}>Print / Save PDF</Text>
                  </Pressable>
                )}
                <Pressable accessibilityRole="button" style={s.outlineBtn} onPress={() => setPreviewModalOpen(false)}>
                  <Text style={s.outlineBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>
 
            <ScrollView style={{ maxHeight: 560, backgroundColor: ui.page }} contentContainerStyle={{ padding: 16 }}>
              <View style={printStyles.printableSheet}>
                {previewCompany ? <InvoiceCompanyDetails profile={previewCompany} /> : null}
                <View style={printStyles.divider} />
                <Text style={printStyles.fieldLabel}>
                  Billed to:{' '}
                  {selectedCustomer ? `${custCompany(selectedCustomer)} - ${custName(selectedCustomer)}` : 'Customer'}
                </Text>
                <Text style={printStyles.companyMetaText}>Date: {dateDisplay}</Text>
                <Text style={printStyles.companyMetaText}>
                  GST Mode: {gstMode === 'NON_GST' ? 'Non GST' : gstMode === 'IGST' ? 'IGST' : 'SGST/CGST'} {inclusiveGst && gstMode !== 'NON_GST' && (docType === 'QUOTATION' || editingExisting) ? '(Prices include GST)' : ''}
                </Text>
                <View style={printStyles.divider} />
 
                {effectiveItems.map((it, i) => {
                  const b = calculations.lineBreakdowns[i] || { grossAmount: 0, discountAmount: 0, taxableAmount: 0, igstRate: 0, igstAmount: 0, cgstRate: 0, cgstAmount: 0, sgstRate: 0, sgstAmount: 0, taxAmount: 0, totalAmount: 0 };
                  return (
                    <View key={i}>
                      <View style={printStyles.summaryRow}>
                        <Text style={[printStyles.summaryLabel, { flex: 1, paddingRight: 12 }]}>
                          {i + 1}. {it.productName || 'Item'} {Boolean(it.hsnSac && gstMode !== 'NON_GST') && `[HSN: ${it.hsnSac}]`} (Qty: {it.quantity} × {currencySymbol}{it.unitPrice})
                          {gstMode !== 'NON_GST' && it.hsnDescription ? `\n${it.hsnDescription}` : ''}
                        </Text>
                        <Text style={printStyles.summaryValueBold}>{fmt(b.totalAmount)}</Text>
                      </View>
                      {docType === 'INVOICE' && (
                        <View style={{ paddingLeft: 16, paddingBottom: 8 }}>
                          <Text style={printStyles.companyMetaText}>Gross: {fmt(b.grossAmount)}  |  Discount: {fmt(b.discountAmount)}  |  Taxable: {fmt(b.taxableAmount)}</Text>
                          {gstMode === 'IGST' && <Text style={printStyles.companyMetaText}>IGST ({b.igstRate}%): {fmt(b.igstAmount)}</Text>}
                          {gstMode === 'SGST_CGST' && <Text style={printStyles.companyMetaText}>CGST ({b.cgstRate}%): {fmt(b.cgstAmount)}  |  SGST ({b.sgstRate}%): {fmt(b.sgstAmount)}</Text>}
                          {gstMode !== 'NON_GST' && <Text style={printStyles.companyMetaText}>Total GST: {fmt(b.taxAmount)}</Text>}
                          <Text style={printStyles.companyMetaText}>Item total: {fmt(b.totalAmount)}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
 
                <View style={printStyles.divider} />
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Gross Subtotal:</Text>
                  <Text style={printStyles.summaryValue}>{fmt(calculations.grossSubtotal)}</Text>
                </View>
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Discount:</Text>
                  <Text style={printStyles.summaryValue}>{fmt(calculations.discountTotal)}</Text>
                </View>
                <View style={printStyles.summaryRow}>
                  <Text style={printStyles.summaryLabel}>Taxable Base:</Text>
                  <Text style={printStyles.summaryValue}>{fmt(calculations.taxableSubtotal)}</Text>
                </View>
                {gstMode === 'IGST' && (
                  <View style={printStyles.summaryRow}>
                    <Text style={printStyles.summaryLabel}>IGST Total:</Text>
                    <Text style={printStyles.summaryValue}>{fmt(calculations.igstTotal)}</Text>
                  </View>
                )}
                {gstMode === 'SGST_CGST' && (
                  <>
                    <View style={printStyles.summaryRow}>
                      <Text style={printStyles.summaryLabel}>SGST Total:</Text>
                      <Text style={printStyles.summaryValue}>{fmt(calculations.sgstTotal)}</Text>
                    </View>
                    <View style={printStyles.summaryRow}>
                      <Text style={printStyles.summaryLabel}>CGST Total:</Text>
                      <Text style={printStyles.summaryValue}>{fmt(calculations.cgstTotal)}</Text>
                    </View>
                  </>
                )}
                <View style={[printStyles.summaryRow, printStyles.grandTotalRow]}>
                  <Text style={printStyles.grandTotalLabel}>Grand Total:</Text>
                  <Text style={printStyles.grandTotalValue}>{fmt(calculations.grandTotal)}</Text>
                </View>
 
                {Boolean(
                  previewBank.bankName?.trim() ||
                  previewBank.accountNo?.trim() ||
                  previewBank.ifscCode?.trim() ||
                  previewBank.paymentUpiId?.trim()
                ) ? (
                  <>
                    <View style={printStyles.divider} />
                    <Text style={[printStyles.fieldLabel, { marginBottom: 4 }]}>Payment Details:</Text>
                    <Text style={printStyles.companyMetaText}>
                      {[
                        previewBank.bankName?.trim() ? `Bank: ${previewBank.bankName.trim()}` : null,
                        previewBank.accountNo?.trim() ? `A/C: ${previewBank.accountNo.trim()}` : null,
                        previewBank.ifscCode?.trim() ? `IFSC: ${previewBank.ifscCode.trim()}` : null,
                      ].filter(Boolean).join(' | ')}
                    </Text>
                    {previewBank.paymentUpiId?.trim() ? (
                      <Text style={printStyles.companyMetaText}>UPI ID: {previewBank.paymentUpiId.trim()}</Text>
                    ) : null}
                  </>
                ) : null}
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
    </View>
  );
}
 
/* ──────────────────────────────────────────────────────────────
 * Print styles — keys are consumed by invoiceBranding()
 * ────────────────────────────────────────────────────────────── */
const printBase = StyleSheet.create({
  printableSheet: {
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.line,
  },
  divider: { height: 1, backgroundColor: ui.line, marginVertical: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: ui.ink, marginBottom: 4 },
  companyMetaText: { fontSize: 12, color: ui.body, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3 },
  summaryLabel: { fontSize: 12, color: ui.body },
  summaryValue: { fontSize: 12, fontWeight: '600', color: ui.ink },
  summaryValueBold: { fontSize: 12, fontWeight: '700', color: ui.primary },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: ui.line, paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 14, fontWeight: '700', color: ui.ink },
  grandTotalValue: { fontSize: 16, fontWeight: '800', color: ui.primary },
});
 
/* ──────────────────────────────────────────────────────────────
 * Screen styles
 * ────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  // page
  screen: { flex: 1, backgroundColor: ui.page },
  page: { flex: 1, backgroundColor: ui.page },
  pageContent: { padding: 20, paddingBottom: 28 },
  shell: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: ui.ink, letterSpacing: -0.4 },
  pageSub: { fontSize: 13, color: ui.muted, marginTop: 2 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ui.primarySoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  typePillText: { fontSize: 12, fontWeight: '700', color: ui.primary },
  formCol: { gap: 16 },
 
  // cards
  card: {
    backgroundColor: ui.surface,
    borderWidth: 1,
    borderColor: ui.line,
    borderRadius: 16,
    boxShadow: '0 1px 2px rgba(15,27,61,0.04), 0 8px 24px rgba(15,27,61,0.04)',
  },
  accentBar: { height: 5, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  headerInner: { padding: 22, gap: 20 },
  companyBlock: { flex: 1, maxWidth: 560 },
  dateBlock: { width: 200 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: ui.line },
  cardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: ui.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: ui.ink },
  cardSubtitle: { fontSize: 12, color: ui.muted, marginTop: 1 },
  cardBody: { padding: 22 },
 
  // text + fields
  label: { fontSize: 12.5, fontWeight: '600', color: ui.body, marginBottom: 7 },
  star: { color: ui.danger },
  hint: { fontSize: 11.5, color: ui.muted, marginTop: 5, lineHeight: 16 },
  input: { height: 44, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: ui.ink, backgroundColor: ui.surface },
  multiline: { textAlignVertical: 'top', paddingTop: 10, height: 64 },
  inputWithIcon: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, paddingHorizontal: 12, backgroundColor: ui.surface },
  inputBare: { flex: 1, height: '100%', fontSize: 14, color: ui.ink },
  prefixWrap: { height: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, backgroundColor: ui.surface, overflow: 'hidden' },
  prefixBox: { width: 38, height: '100%', backgroundColor: ui.tint, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: ui.line },
  prefixText: { fontSize: 14, fontWeight: '700', color: ui.muted },
  prefixInput: { flex: 1, height: '100%', paddingHorizontal: 10, fontSize: 14, color: ui.ink },
 
  // wrapping field grid (Payment card)
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { flexGrow: 1, flexBasis: 200, minWidth: 180 },
 
  // select + menu
  select: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, paddingHorizontal: 12, backgroundColor: ui.surface },
  selectOpen: { borderColor: ui.primary, boxShadow: '0 0 0 3px rgba(11,47,125,0.12)' },
  selectText: { flex: 1, fontSize: 14, color: ui.ink },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderWidth: 1,
    borderColor: ui.line,
    borderRadius: 12,
    backgroundColor: ui.surface,
    padding: 6,
    zIndex: 9999,
    elevation: 12,
    boxShadow: '0 12px 32px rgba(15,27,61,0.18)',
  },
  menuSearch: { height: 38, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 8, paddingHorizontal: 10, fontSize: 13, marginBottom: 6, color: ui.ink, backgroundColor: ui.tint },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
  menuOptionActive: { backgroundColor: ui.primarySoft },
  menuOptionTitle: { fontSize: 13.5, fontWeight: '600', color: ui.ink },
  menuOptionSub: { fontSize: 12, color: ui.muted, marginTop: 1 },
  menuEmpty: { padding: 12, fontSize: 12.5, color: ui.muted, textAlign: 'center' },
 
  // segmented
  segTrack: { flexDirection: 'row', backgroundColor: '#EDF1F8', borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segItemActive: { backgroundColor: ui.primary, boxShadow: '0 2px 6px rgba(11,47,125,0.28)' },
  segText: { fontSize: 13, fontWeight: '600', color: ui.body },
  segTextActive: { color: '#FFFFFF' },
 
  // switches / chips
  nonGstToggle: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1, borderRadius: 10 },
  nonGstToggleOn: { backgroundColor: ui.primary, borderColor: ui.primary },
  nonGstToggleOff: { backgroundColor: ui.primarySoft, borderColor: ui.primaryMid },
  nonGstToggleText: { color: ui.primary, fontSize: 13, fontWeight: '700' },
  nonGstToggleTextOn: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ui.tint, borderWidth: 1, borderColor: ui.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  switchTitle: { fontSize: 13.5, fontWeight: '600', color: ui.ink },
  switchSub: { fontSize: 11.5, color: ui.muted, marginTop: 1 },
  customerChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ui.tint, borderWidth: 1, borderColor: ui.line, borderRadius: 12, padding: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  customerChipTitle: { fontSize: 14, fontWeight: '700', color: ui.ink },
  customerChipSub: { fontSize: 12, color: ui.muted, marginTop: 2, lineHeight: 17 },
  taxHint: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  taxHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
  bankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: ui.line },
  bankKey: { fontSize: 12.5, color: ui.muted },
  bankVal: { fontSize: 13.5, fontWeight: '700', color: ui.ink, flexShrink: 1, textAlign: 'right' },
 
  // alerts
  alertBox: { flexDirection: 'row', gap: 10, backgroundColor: ui.dangerSoft, borderRadius: 10, padding: 12 },
  alertText: { color: ui.danger, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  linkText: { color: ui.primary, fontSize: 12.5, fontWeight: '700' },
 
  // items
  itemTypeSwitch: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  itemTypeOption: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTypeOptionSelected: { backgroundColor: '#0B2F7D', borderColor: '#0B2F7D' },
  itemTypeOptionIdle: { backgroundColor: '#EAF0FF', borderColor: '#C7D6F7' },
  itemTypeOptionFocused: { borderWidth: 3, borderColor: '#F59E0B' },
  itemTypeOptionHovered: { borderColor: '#0B2F7D' },
  itemTypeText: { fontSize: 18, fontWeight: '700', color: '#0B2F7D' },
  itemTypeTextSelected: { color: '#FFFFFF' },
  itemTypeBadge: { backgroundColor: ui.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  itemTypeBadgeText: { fontSize: 10, fontWeight: '700', color: ui.primary },
  catalogField: { gap: 7, flex: 1, minWidth: 0 },
  catalogSelect: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 8, paddingHorizontal: 10, backgroundColor: ui.surface },
  catalogSelectText: { fontSize: 12, color: ui.ink, flexShrink: 1 },
  catalogPlaceholder: { color: ui.muted },
  catalogBackdrop: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,27,61,0.4)' },
  catalogDialog: { width: '100%', maxWidth: 480, maxHeight: '80%', gap: 12, padding: 18, borderRadius: 12, backgroundColor: ui.surface },
  catalogDialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catalogDialogTitle: { fontSize: 16, fontWeight: '700', color: ui.ink },
  catalogSearch: { minHeight: 42, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 8, paddingHorizontal: 10, fontSize: 13, color: ui.ink },
  catalogOptions: { flexGrow: 0, maxHeight: 320 },
  catalogOption: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: ui.line },
  itemCard: { position: 'relative', borderWidth: 1, borderColor: ui.line, borderRadius: 14, padding: 16, marginBottom: 14, backgroundColor: ui.surface },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  itemBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: ui.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemBadgeText: { fontSize: 12.5, fontWeight: '800', color: ui.primary },
  itemHeaderTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: ui.ink },
  itemHeaderTotal: { fontSize: 14, fontWeight: '800', color: ui.primary },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.dangerSoft },
  metricsRow: { gap: 12, marginTop: 14 },
  metric: { flex: 1, minWidth: 110 },
  metricQty: { width: 148, flexShrink: 0 },
  stepper: { height: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, overflow: 'hidden', backgroundColor: ui.surface },
  stepBtn: { width: 38, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: ui.primarySoft },
  stepInput: { flex: 1, width: 0, minWidth: 0, height: '100%', textAlign: 'center', fontSize: 14, fontWeight: '700', color: ui.ink },
  taxStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  taxCell: { flexGrow: 1, minWidth: 96, backgroundColor: ui.tint, borderWidth: 1, borderColor: ui.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  taxCellTotal: { backgroundColor: ui.primarySoft, borderColor: ui.primaryMid },
  taxCellLabel: { fontSize: 11.5, color: ui.muted, fontWeight: '600' },
  taxCellValue: { fontSize: 14, color: ui.ink, fontWeight: '700', marginTop: 2 },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ui.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnSmallText: { fontSize: 13, fontWeight: '700', color: ui.primary },
  addItemDashed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: ui.primaryMid, borderRadius: 14, paddingVertical: 14, backgroundColor: ui.tint },
  addItemDashedText: { fontSize: 13.5, fontWeight: '700', color: ui.primary },
 
  // next payment date
  nextDateField: { height: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, backgroundColor: ui.surface },
  nextDateInput: { flex: 1, width: 0, minWidth: 0, height: '100%', paddingHorizontal: 12, fontSize: 14, color: ui.ink },
  nextDateBtn: { width: 44, height: '100%', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: ui.line },
 
  // summary panel
  panel: { backgroundColor: ui.panel, borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 32px rgba(10,31,82,0.22)' },
  panelTop: { paddingHorizontal: 22, paddingVertical: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: ui.panelLine },
  panelKicker: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  panelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  panelChip: { backgroundColor: ui.panelSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  panelChipText: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.86)' },
  panelBody: { padding: 22, gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { fontSize: 13, color: ui.panelMuted },
  sumValue: { fontSize: 13.5, fontWeight: '600', color: '#FFFFFF' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: ui.panelLine, paddingTop: 14, marginTop: 4 },
  grandLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  grandValue: { flexShrink: 1, fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  dueBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,138,128,0.16)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 4 },
  dueBoxSettled: { backgroundColor: 'rgba(74,222,128,0.18)' },
  dueLabel: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  dueValue: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  signatureWell: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 84, marginTop: 8 },
  signatureCursive: { fontStyle: 'italic', fontSize: 22, color: ui.primary, fontWeight: '700' },
  signatoryLabel: { fontSize: 11, color: ui.muted, marginTop: 4 },
 
  // fixed bottom action bar
  footer: { backgroundColor: ui.surface, borderTopWidth: 1, borderTopColor: ui.line, paddingHorizontal: 20, paddingVertical: 12, gap: 10, boxShadow: '0 -6px 20px rgba(15,27,61,0.06)' },
  footerRow: { width: '100%', maxWidth: 1240, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerTotals: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  footerLabel: { fontSize: 12, color: ui.muted, fontWeight: '600' },
  footerTotal: { fontSize: 22, fontWeight: '800', color: ui.ink, letterSpacing: -0.4 },
  footerDue: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ui.dangerSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  footerDueLabel: { fontSize: 12.5, fontWeight: '700', color: ui.danger },
  footerDueValue: { fontSize: 13, fontWeight: '800', color: ui.danger },
  footerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footerBtn: { height: 46, paddingHorizontal: 20, borderRadius: 12 },
  errorBanner: { width: '100%', maxWidth: 1240, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ui.dangerSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorBannerText: { flex: 1, color: ui.danger, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
 
  // buttons
  navyBtn: { height: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: ui.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  outlineBtn: { height: 40, paddingHorizontal: 16, borderWidth: 1, borderColor: ui.lineStrong, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ui.surface },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: ui.ink },
 
  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,20,52,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewCard: { width: '100%', maxWidth: 720, backgroundColor: ui.surface, borderRadius: 16, overflow: 'hidden' },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: ui.line },
  previewTitle: { fontSize: 16, fontWeight: '800', color: ui.ink },
  previewSub: { fontSize: 12, color: ui.muted, marginTop: 1 },
});
 
