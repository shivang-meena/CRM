import { Module } from '@nestjs/common';
import { SalesDocumentsService } from './sales-documents.service';
import { DocumentCalculationService } from './document-calculation.service';
import { SalesDocumentsController } from './sales-documents.controller';
import { QuotationsController } from './quotations.controller';
import { InvoicesController } from './invoices.controller';

@Module({
  controllers: [
    SalesDocumentsController,
    QuotationsController,
    InvoicesController,
  ],
  providers: [SalesDocumentsService, DocumentCalculationService],
  exports: [SalesDocumentsService],
})
export class SalesDocumentsModule {}
