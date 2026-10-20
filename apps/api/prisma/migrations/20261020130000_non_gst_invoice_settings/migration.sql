CREATE TABLE "non_gst_invoice_settings" (
    "id" TEXT NOT NULL DEFAULT 'non-gst',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'NON-GST',
    "invoiceStart" INTEGER NOT NULL DEFAULT 1,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "bankName" TEXT NOT NULL DEFAULT '',
    "accountNo" TEXT NOT NULL DEFAULT '',
    "ifscCode" TEXT NOT NULL DEFAULT '',
    "paymentUpiId" TEXT NOT NULL DEFAULT '',
    "signature" TEXT NOT NULL DEFAULT '',
    "termsAndConditions" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "non_gst_invoice_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sales_documents" ADD COLUMN "nonGstInvoiceSettingsSnapshot" JSONB;
