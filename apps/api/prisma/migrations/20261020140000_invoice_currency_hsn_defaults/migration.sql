ALTER TABLE "gst_invoice_settings"
  ADD COLUMN "invoiceCurrency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "hsnSac" TEXT NOT NULL DEFAULT '9983';

ALTER TABLE "non_gst_invoice_settings"
  ADD COLUMN "invoiceCurrency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "hsnSac" TEXT NOT NULL DEFAULT '9983';
