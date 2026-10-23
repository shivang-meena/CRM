CREATE TYPE "SalesItemType" AS ENUM ('SERVICE', 'PRODUCT');

ALTER TABLE "sales_document_items"
ADD COLUMN "itemType" "SalesItemType";
