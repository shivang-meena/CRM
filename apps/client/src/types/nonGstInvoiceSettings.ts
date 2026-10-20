import type {
  GstInvoiceSettings,
  GstInvoiceSettingsSnapshot,
} from "./gstInvoiceSettings";

export type NonGstInvoiceSettingsSnapshot = Omit<
  GstInvoiceSettingsSnapshot,
  "gstPercentage"
>;
export type NonGstInvoiceSettings = NonGstInvoiceSettingsSnapshot & {
  nextNumber: number;
};
export type InvoiceSettings = {
  gst: GstInvoiceSettings | null;
  nonGst: NonGstInvoiceSettings | null;
};
export type InvoiceSettingsPayload = {
  gst: GstInvoiceSettingsSnapshot;
  nonGst: NonGstInvoiceSettingsSnapshot;
};

export const EMPTY_NON_GST_INVOICE_SETTINGS: NonGstInvoiceSettings = {
  invoiceCurrency: "INR",
  hsnSac: "9983",
  invoicePrefix: "NON-GST",
  invoiceStart: 1,
  nextNumber: 1,
  bankName: "",
  accountNo: "",
  ifscCode: "",
  paymentUpiId: "",
  signature: "",
  termsAndConditions:
    "1. Goods or services will be delivered after full payment.",
};
