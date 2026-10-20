export type GstInvoiceSettingsSnapshot = {
  invoiceCurrency: string;
  hsnSac: string;
  invoicePrefix: string;
  invoiceStart: number;
  gstPercentage: number;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  paymentUpiId: string;
  signature: string;
  termsAndConditions: string;
};

export type GstInvoiceSettings = GstInvoiceSettingsSnapshot & {
  nextNumber: number;
};

export const EMPTY_GST_INVOICE_SETTINGS: GstInvoiceSettings = {
  invoiceCurrency: "INR",
  hsnSac: "9983",
  invoicePrefix: "GST",
  invoiceStart: 1,
  nextNumber: 1,
  gstPercentage: 18,
  bankName: "",
  accountNo: "",
  ifscCode: "",
  paymentUpiId: "",
  signature: "",
  termsAndConditions:
    "1. Goods or services will be delivered after full payment.",
};

export function gstInvoiceNumber(prefix: string, number: number): string {
  return `${prefix}${prefix.endsWith("-") ? "" : "-"}${number}`;
}

export function gstSettingsPayload(
  settings: GstInvoiceSettingsSnapshot,
): GstInvoiceSettingsSnapshot {
  return {
    invoiceCurrency: settings.invoiceCurrency,
    hsnSac: settings.hsnSac.trim(),
    invoicePrefix: settings.invoicePrefix.trim(),
    invoiceStart: settings.invoiceStart,
    gstPercentage: settings.gstPercentage,
    bankName: settings.bankName.trim(),
    accountNo: settings.accountNo.trim(),
    ifscCode: settings.ifscCode.trim().toUpperCase(),
    paymentUpiId: settings.paymentUpiId.trim(),
    signature: settings.signature,
    termsAndConditions: settings.termsAndConditions.trim(),
  };
}
