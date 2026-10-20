ALTER TABLE "sales_documents"
ADD COLUMN "companyProfileSnapshot" JSONB,
ALTER COLUMN "sellerCompanyName" SET DEFAULT '',
ALTER COLUMN "sellerPhone" SET DEFAULT '',
ALTER COLUMN "sellerEmail" SET DEFAULT '',
ALTER COLUMN "sellerAddress" SET DEFAULT '';
