// // apps/client/src/types/salesDocuments.ts
// import type { InvoiceCompanyProfile } from './companyProfile';
// import type { GstInvoiceSettingsSnapshot } from './gstInvoiceSettings';
// import type { NonGstInvoiceSettingsSnapshot } from './nonGstInvoiceSettings';

// export type SalesDocumentType = 'INVOICE' | 'QUOTATION';
// export type GstMode = 'NON_GST' | 'IGST' | 'SGST_CGST';
// export type GstType = GstMode; // Backward-compatible alias
// export type DiscountType = 'FIXED' | 'PERCENTAGE' | 'OVERALL' | 'FLAT_PER_UNIT';
// export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'HALF_PAID' | 'PAID';

// export const DEFAULT_DOCUMENT_CONFIG = {
//   bankName: '',
//   accountNo: '',
//   ifscCode: '',
//   signatoryName: '',
//   defaultTerms:
//     '1. Goods or services will be delivered after full payment.',
// };

// export interface SalesDocumentItem {
//   id?: string;
//   productName: string;
//   hsnSac: string;
//   hsnMasterId?: string;
//   hsnDescription?: string;
//   applyHsnMaster?: boolean;
//   unitPrice: number;
//   quantity: number;
//   discountValue: number;
//   discountType: DiscountType;
//   igstRate: number;
//   sgstRate: number;
//   cgstRate: number;
//   discountAmount?: number;
//   grossAmount?: number;
//   netAmount?: number;
//   igstAmount?: number;
//   sgstAmount?: number;
//   cgstAmount?: number;
//   taxPercent?: number;
//   taxAmount?: number;
//   totalAmount?: number;
//   comments?: string;
// }

// export interface ComputedLineItemBreakdown {
//   grossAmount: number;
//   discountAmount: number;
//   afterDiscountAmount: number;
//   taxableAmount: number;
//   igstRate: number;
//   igstAmount: number;
//   sgstRate: number;
//   sgstAmount: number;
//   cgstRate: number;
//   cgstAmount: number;
//   taxAmount: number;
//   totalAmount: number;
// }

// export function round2(n: number): number {
//   const val = Number(n);
//   if (!Number.isFinite(val)) return 0;
//   return Math.round((val + Number.EPSILON) * 100) / 100;
// }

// export function calculateInvoicePreview(params: {
//   items: SalesDocumentItem[];
//   gstMode: GstMode;
//   inclusiveGst: boolean;
//   docType: SalesDocumentType;
//   paymentStatus: InvoicePaymentStatus;
//   paidAmountInput: number;
// }) {
//   const { items, gstMode, docType, paymentStatus, paidAmountInput } = params;
//   const effectiveInclusiveGst =
//     gstMode === 'NON_GST' ? false : Boolean(params.inclusiveGst);

//   let grossSubtotal = 0;
//   let discountTotal = 0;
//   let taxableSubtotal = 0;
//   let igstTotal = 0;
//   let sgstTotal = 0;
//   let cgstTotal = 0;
//   let taxTotal = 0;
//   let grandTotal = 0;

//   const lineBreakdowns: ComputedLineItemBreakdown[] = items.map((item) => {
//     const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
//     const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
//     const discountValue = Math.max(0, Number(item.discountValue) || 0);

//     const grossAmount = round2(unitPrice * quantity);
//     let discountAmount = 0;

//     if (item.discountType === 'PERCENTAGE') {
//       const clampedPct = Math.min(100, discountValue);
//       discountAmount = round2((grossAmount * clampedPct) / 100);
//     } else if (item.discountType === 'FLAT_PER_UNIT') {
//       discountAmount = round2(discountValue * quantity);
//     } else {
//       // FIXED or OVERALL
//       discountAmount = round2(discountValue);
//     }
//     discountAmount = Math.min(grossAmount, Math.max(0, discountAmount));

//     const afterDiscountAmount = round2(grossAmount - discountAmount);

//     // Strictly isolate active tax rates by gstMode
//     const igstRate =
//       gstMode === 'IGST'
//         ? Math.min(100, Math.max(0, Number(item.igstRate) || 0))
//         : 0;
//     const sgstRate =
//       gstMode === 'SGST_CGST'
//         ? Math.min(100, Math.max(0, Number(item.sgstRate) || 0))
//         : 0;
//     const cgstRate =
//       gstMode === 'SGST_CGST'
//         ? Math.min(100, Math.max(0, Number(item.cgstRate) || 0))
//         : 0;
//     const combinedRate = round2(
//       gstMode === 'IGST'
//         ? igstRate
//         : gstMode === 'SGST_CGST'
//         ? sgstRate + cgstRate
//         : 0,
//     );

//     let taxableAmount = 0;
//     let igstAmount = 0;
//     let sgstAmount = 0;
//     let cgstAmount = 0;
//     let taxAmount = 0;
//     let totalAmount = 0;

//     if (gstMode === 'NON_GST') {
//       taxableAmount = afterDiscountAmount;
//       totalAmount = afterDiscountAmount;
//     } else if (!effectiveInclusiveGst) {
//       // Tax-Exclusive (Toggle OFF)
//       taxableAmount = afterDiscountAmount;
//       if (gstMode === 'IGST') {
//         igstAmount = round2((taxableAmount * igstRate) / 100);
//         taxAmount = igstAmount;
//       } else {
//         sgstAmount = round2((taxableAmount * sgstRate) / 100);
//         cgstAmount = round2((taxableAmount * cgstRate) / 100);
//         taxAmount = round2(sgstAmount + cgstAmount);
//       }
//       totalAmount = round2(taxableAmount + taxAmount);
//     } else {
//       // Tax-Inclusive (Toggle ON)
//       const inclusiveAmount = afterDiscountAmount;
//       taxableAmount =
//         combinedRate > 0
//           ? round2(inclusiveAmount / (1 + combinedRate / 100))
//           : inclusiveAmount;
//       const extractedTax = round2(inclusiveAmount - taxableAmount);

//       if (gstMode === 'IGST') {
//         igstAmount = extractedTax;
//         taxAmount = igstAmount;
//       } else {
//         sgstAmount =
//           combinedRate > 0
//             ? round2((extractedTax * sgstRate) / combinedRate)
//             : 0;
//         cgstAmount = round2(extractedTax - sgstAmount);
//         taxAmount = round2(sgstAmount + cgstAmount);
//       }
//       totalAmount = inclusiveAmount;
//     }

//     grossSubtotal = round2(grossSubtotal + grossAmount);
//     discountTotal = round2(discountTotal + discountAmount);
//     taxableSubtotal = round2(taxableSubtotal + taxableAmount);
//     igstTotal = round2(igstTotal + igstAmount);
//     sgstTotal = round2(sgstTotal + sgstAmount);
//     cgstTotal = round2(cgstTotal + cgstAmount);
//     taxTotal = round2(taxTotal + taxAmount);
//     grandTotal = round2(grandTotal + totalAmount);

//     return {
//       grossAmount,
//       discountAmount,
//       afterDiscountAmount,
//       taxableAmount,
//       igstRate,
//       igstAmount,
//       sgstRate,
//       sgstAmount,
//       cgstRate,
//       cgstAmount,
//       taxAmount,
//       totalAmount,
//     };
//   });

//   let receivedAmount = 0;
//   if (docType === 'INVOICE') {
//     if (paymentStatus === 'PAID') {
//       receivedAmount = grandTotal;
//     } else if (paymentStatus === 'PARTIALLY_PAID' || paymentStatus === 'HALF_PAID') {
//       receivedAmount = Math.min(
//         grandTotal,
//         Math.max(0, round2(paidAmountInput)),
//       );
//     }
//   }
//   const dueAmount = round2(Math.max(0, grandTotal - receivedAmount));

//   return {
//     effectiveInclusiveGst,
//     lineBreakdowns,
//     grossSubtotal,
//     discountTotal,
//     taxableSubtotal,
//     igstTotal,
//     sgstTotal,
//     cgstTotal,
//     taxTotal,
//     grandTotal,
//     receivedAmount,
//     dueAmount,
//   };
// }

// export interface SalesDocumentRecord {
//   id: string;
//   documentNo: string;
//   type: SalesDocumentType;
//   status: string;
//   sourceQuotationId: string | null;
//   customerId: string;
//   customerState?: string;
//   companyName: string;
//   customerName: string;
//   mobile: string;
//   email: string;
//   address: string;
//   state?: string;
//   issueDate: string;
//   paymentDate?: string | null;
//   nextPaymentDate: string | null;
//   gstMode: GstMode;
//   gstType: GstMode; // backward-compatible alias
//   inclusiveGst: boolean;
//   currency: string;
//   paymentStatus: InvoicePaymentStatus;
//   paymentMethodId: string | null;
//   paymentMethodName: string | null;
//   brochureId: string | null;
//   brochureName: string | null;
//   termsAndConditions: string;
//   emailAutomation: boolean;
//   whatsappAutomation: boolean;
//   grossSubtotal: number;
//   subtotal: number;
//   discountTotal: number;
//   igstTotal: number;
//   sgstTotal: number;
//   cgstTotal: number;
//   taxTotal: number;
//   grandTotal: number;
//   paidAmount: number;
//   dueAmount: number;
//   sellerCompanyName: string;
//   sellerPhone: string;
//   sellerEmail: string;
//   sellerAddress: string;
//   companyProfileSnapshot?: InvoiceCompanyProfile | null;
//   gstInvoiceSettingsSnapshot?: GstInvoiceSettingsSnapshot | null;
//   nonGstInvoiceSettingsSnapshot?: NonGstInvoiceSettingsSnapshot | null;
//   bankName: string;
//   bankAccountNo: string;
//   bankIfsc: string;
//   signatoryName: string;
//   createdByName: string;
//   version: number;
//   createdAt: string;
//   items: SalesDocumentItem[];
// }

// export interface CreateSalesDocumentPayload {
//   requestKey: string;
//   type: SalesDocumentType;
//   customerId: string;
//   customerState?: string;
//   issueDate: string;
//   paymentDate?: string | null;
//   nextPaymentDate?: string | null;
//   gstMode?: GstMode;
//   gstType?: GstMode;
//   inclusiveGst?: boolean;
//   currency?: string;
//   paymentStatus: InvoicePaymentStatus;
//   paidAmount?: number;
//   paymentMethodId?: string | null;
//   brochureId?: string | null;
//   termsAndConditions: string;
//   emailAutomation?: boolean;
//   whatsappAutomation?: boolean;
//   items: SalesDocumentItem[];
// }

// export interface UpdateSalesDocumentPayload extends CreateSalesDocumentPayload {
//   version: number;
// }

// export interface PaymentMethodRecord {
//   id: string;
//   method: string;
//   bankName?: string | null;
//   accountNo?: string | null;
//   ifscCode?: string | null;
//   isDefault?: boolean;
//   isActive?: boolean;
//   version: number;
//   createdAt: string;
// }

// export interface BrochureRecord {
//   id: string;
//   brochureName: string;
//   type: string;
//   startAfter: string;
//   fileUrl?: string | null;
//   version?: number;
//   createdAt?: string;
//   updatedAt?: string;
// }

// // Backward compatibility interfaces for Lead Activity sub-tabs
// export interface Party { name: string; address?: string; phone?: string; email?: string; taxIdentifier?: string }
// export interface DocumentItemInput { description: string; quantity: string; unit?: string; unitPrice: string; discountAmount: string; taxPercent: string; productName?: string; discountValue?: number }
// export interface DocumentItem extends DocumentItemInput { id: string; position: number; grossAmount: string; netAmount: string; taxAmount: string; totalAmount: string }
// export interface PaymentRecord { id: string; amount: string; paidAt: string; method: string; reference: string | null; note: string | null; voidedAt: string | null; voidReason: string | null }
// export interface SalesDocument {
//   id: string; leadId: string; type: 'QUOTATION' | 'INVOICE'; status: string; version: number;
//   documentNumber: string | null; documentDate: string; validUntil: string | null; dueDate: string | null;
//   currency: string; customerSnapshot: Party; issuerSnapshot: Party; notes: string | null; terms: string | null;
//   subtotal: string; discountTotal: string; taxTotal: string; grandTotal: string;
//   paidAmount: string; balance: string; paymentState: string; isOverdue: boolean;
//   sourceQuotationId: string | null; items: DocumentItem[]; payments: PaymentRecord[];
// }

import type { InvoiceCompanyProfile } from './companyProfile';
import type { GstInvoiceSettingsSnapshot } from './gstInvoiceSettings';
import type { NonGstInvoiceSettingsSnapshot } from './nonGstInvoiceSettings';
 
export type SalesDocumentType = 'INVOICE' | 'QUOTATION';
export type GstMode = 'NON_GST' | 'IGST' | 'SGST_CGST';
export type GstType = GstMode; // Backward-compatible alias
export type DiscountType = 'FIXED' | 'PERCENTAGE' | 'OVERALL' | 'FLAT_PER_UNIT';
export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'HALF_PAID' | 'PAID';
 
export const DEFAULT_DOCUMENT_CONFIG = {
  bankName: '',
  accountNo: '',
  ifscCode: '',
  signatoryName: '',
  defaultTerms:
    '1. Goods or services will be delivered after full payment.',
};
 
export interface SalesDocumentItem {
  id?: string;
  productName: string;
  hsnSac: string;
  hsnMasterId?: string;
  itemType?: 'SERVICE' | 'PRODUCT';
  hsnDescription?: string;
  applyHsnMaster?: boolean;
  unitPrice: number;
  quantity: number;
  discountValue: number;
  discountType: DiscountType;
  igstRate: number;
  sgstRate: number;
  cgstRate: number;
  discountAmount?: number;
  grossAmount?: number;
  netAmount?: number;
  igstAmount?: number;
  sgstAmount?: number;
  cgstAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount?: number;
  comments?: string;
}
 
export interface ComputedLineItemBreakdown {
  grossAmount: number;
  discountAmount: number;
  afterDiscountAmount: number;
  taxableAmount: number;
  igstRate: number;
  igstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  taxAmount: number;
  totalAmount: number;
}
 
export function round2(n: number): number {
  const val = Number(n);
  if (!Number.isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
 
export function calculateInvoicePreview(params: {
  items: SalesDocumentItem[];
  gstMode: GstMode;
  inclusiveGst: boolean;
  docType: SalesDocumentType;
  paymentStatus: InvoicePaymentStatus;
  paidAmountInput: number;
}) {
  const { items, gstMode, docType, paymentStatus, paidAmountInput } = params;
  const effectiveInclusiveGst =
    gstMode === 'NON_GST' ? false : Boolean(params.inclusiveGst);
 
  let grossSubtotal = 0;
  let discountTotal = 0;
  let taxableSubtotal = 0;
  let igstTotal = 0;
  let sgstTotal = 0;
  let cgstTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;
 
  const lineBreakdowns: ComputedLineItemBreakdown[] = items.map((item) => {
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const discountValue = Math.max(0, Number(item.discountValue) || 0);
 
    const grossAmount = round2(unitPrice * quantity);
    let discountAmount = 0;
 
    if (item.discountType === 'PERCENTAGE') {
      const clampedPct = Math.min(100, discountValue);
      discountAmount = round2((grossAmount * clampedPct) / 100);
    } else if (item.discountType === 'FLAT_PER_UNIT') {
      discountAmount = round2(discountValue * quantity);
    } else {
      // FIXED or OVERALL
      discountAmount = round2(discountValue);
    }
    discountAmount = Math.min(grossAmount, Math.max(0, discountAmount));
 
    const afterDiscountAmount = round2(grossAmount - discountAmount);
 
    // Strictly isolate active tax rates by gstMode
    const igstRate =
      gstMode === 'IGST'
        ? Math.min(100, Math.max(0, Number(item.igstRate) || 0))
        : 0;
    const sgstRate =
      gstMode === 'SGST_CGST'
        ? Math.min(100, Math.max(0, Number(item.sgstRate) || 0))
        : 0;
    const cgstRate =
      gstMode === 'SGST_CGST'
        ? Math.min(100, Math.max(0, Number(item.cgstRate) || 0))
        : 0;
    const combinedRate = round2(
      gstMode === 'IGST'
        ? igstRate
        : gstMode === 'SGST_CGST'
        ? sgstRate + cgstRate
        : 0,
    );
 
    let taxableAmount = 0;
    let igstAmount = 0;
    let sgstAmount = 0;
    let cgstAmount = 0;
    let taxAmount = 0;
    let totalAmount = 0;
 
    if (gstMode === 'NON_GST') {
      taxableAmount = afterDiscountAmount;
      totalAmount = afterDiscountAmount;
    } else if (!effectiveInclusiveGst) {
      // Tax-Exclusive (Toggle OFF)
      taxableAmount = afterDiscountAmount;
      if (gstMode === 'IGST') {
        igstAmount = round2((taxableAmount * igstRate) / 100);
        taxAmount = igstAmount;
      } else {
        sgstAmount = round2((taxableAmount * sgstRate) / 100);
        cgstAmount = round2((taxableAmount * cgstRate) / 100);
        taxAmount = round2(sgstAmount + cgstAmount);
      }
      totalAmount = round2(taxableAmount + taxAmount);
    } else {
      // Tax-Inclusive (Toggle ON)
      const inclusiveAmount = afterDiscountAmount;
      taxableAmount =
        combinedRate > 0
          ? round2(inclusiveAmount / (1 + combinedRate / 100))
          : inclusiveAmount;
      const extractedTax = round2(inclusiveAmount - taxableAmount);
 
      if (gstMode === 'IGST') {
        igstAmount = extractedTax;
        taxAmount = igstAmount;
      } else {
        sgstAmount =
          combinedRate > 0
            ? round2((extractedTax * sgstRate) / combinedRate)
            : 0;
        cgstAmount = round2(extractedTax - sgstAmount);
        taxAmount = round2(sgstAmount + cgstAmount);
      }
      totalAmount = inclusiveAmount;
    }
 
    grossSubtotal = round2(grossSubtotal + grossAmount);
    discountTotal = round2(discountTotal + discountAmount);
    taxableSubtotal = round2(taxableSubtotal + taxableAmount);
    igstTotal = round2(igstTotal + igstAmount);
    sgstTotal = round2(sgstTotal + sgstAmount);
    cgstTotal = round2(cgstTotal + cgstAmount);
    taxTotal = round2(taxTotal + taxAmount);
    grandTotal = round2(grandTotal + totalAmount);
 
    return {
      grossAmount,
      discountAmount,
      afterDiscountAmount,
      taxableAmount,
      igstRate,
      igstAmount,
      sgstRate,
      sgstAmount,
      cgstRate,
      cgstAmount,
      taxAmount,
      totalAmount,
    };
  });
 
  let receivedAmount = 0;
  if (docType === 'INVOICE') {
    if (paymentStatus === 'PAID') {
      receivedAmount = grandTotal;
    } else if (paymentStatus === 'PARTIALLY_PAID' || paymentStatus === 'HALF_PAID') {
      receivedAmount = Math.min(
        grandTotal,
        Math.max(0, round2(paidAmountInput)),
      );
    }
  }
  const dueAmount = round2(Math.max(0, grandTotal - receivedAmount));
 
  return {
    effectiveInclusiveGst,
    lineBreakdowns,
    grossSubtotal,
    discountTotal,
    taxableSubtotal,
    igstTotal,
    sgstTotal,
    cgstTotal,
    taxTotal,
    grandTotal,
    receivedAmount,
    dueAmount,
  };
}
 
export interface SalesDocumentRecord {
  id: string;
  documentNo: string;
  type: SalesDocumentType;
  status: string;
  sourceQuotationId: string | null;
  customerId: string;
  customerState?: string;
  companyName: string;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  state?: string;
  issueDate: string;
  paymentDate?: string | null;
  nextPaymentDate: string | null;
  gstMode: GstMode;
  gstType: GstMode; // backward-compatible alias
  inclusiveGst: boolean;
  currency: string;
  paymentStatus: InvoicePaymentStatus;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  brochureId: string | null;
  brochureName: string | null;
  termsAndConditions: string;
  emailAutomation: boolean;
  whatsappAutomation: boolean;
  grossSubtotal: number;
  subtotal: number;
  discountTotal: number;
  igstTotal: number;
  sgstTotal: number;
  cgstTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  sellerCompanyName: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;
  companyProfileSnapshot?: InvoiceCompanyProfile | null;
  gstInvoiceSettingsSnapshot?: GstInvoiceSettingsSnapshot | null;
  nonGstInvoiceSettingsSnapshot?: NonGstInvoiceSettingsSnapshot | null;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  signatoryName: string;
  createdByName: string;
  version: number;
  createdAt: string;
  items: SalesDocumentItem[];
}
 
export interface CreateSalesDocumentPayload {
  requestKey: string;
  type: SalesDocumentType;
  customerId: string;
  customerState?: string;
  issueDate: string;
  paymentDate?: string | null;
  nextPaymentDate?: string | null;
  gstMode?: GstMode;
  gstType?: GstMode;
  inclusiveGst?: boolean;
  currency?: string;
  paymentStatus: InvoicePaymentStatus;
  paidAmount?: number;
  paymentMethodId?: string | null;
  brochureId?: string | null;
  termsAndConditions: string;
  emailAutomation?: boolean;
  whatsappAutomation?: boolean;
  items: SalesDocumentItem[];
}
 
export interface UpdateSalesDocumentPayload extends CreateSalesDocumentPayload {
  version: number;
}
 
export interface PaymentMethodRecord {
  id: string;
  method: string;
  bankName?: string | null;
  accountNo?: string | null;
  ifscCode?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  version: number;
  createdAt: string;
}
 
export interface BrochureRecord {
  id: string;
  brochureName: string;
  type: string;
  startAfter: string;
  fileUrl?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}
 
// Backward compatibility interfaces for Lead Activity sub-tabs
export interface Party { name: string; address?: string; phone?: string; email?: string; taxIdentifier?: string }
export interface DocumentItemInput { description: string; quantity: string; unit?: string; unitPrice: string; discountAmount: string; taxPercent: string; productName?: string; discountValue?: number }
export interface DocumentItem extends DocumentItemInput { id: string; position: number; grossAmount: string; netAmount: string; taxAmount: string; totalAmount: string }
export interface PaymentRecord { id: string; amount: string; paidAt: string; method: string; reference: string | null; note: string | null; voidedAt: string | null; voidReason: string | null }
export interface SalesDocument {
  id: string; leadId: string; type: 'QUOTATION' | 'INVOICE'; status: string; version: number;
  documentNumber: string | null; documentDate: string; validUntil: string | null; dueDate: string | null;
  currency: string; customerSnapshot: Party; issuerSnapshot: Party; notes: string | null; terms: string | null;
  subtotal: string; discountTotal: string; taxTotal: string; grandTotal: string;
  paidAmount: string; balance: string; paymentState: string; isOverdue: boolean;
  sourceQuotationId: string | null; items: DocumentItem[]; payments: PaymentRecord[];
}
 
 
 



