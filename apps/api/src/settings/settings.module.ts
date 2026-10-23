import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { GstInvoiceSettingsController } from './gst-invoice-settings.controller';
import { GstInvoiceSettingsService } from './gst-invoice-settings.service';
import { NonGstInvoiceSettingsService } from './non-gst-invoice-settings.service';
import { InvoiceSettingsController } from './invoice-settings.controller';
import { HsnMasterController } from './hsn-master.controller';
import { HsnMasterService } from './hsn-master.service';
import { ServiceMasterController } from './service-master.controller';
import { ServiceMasterService } from './service-master.service';
import { ProductMasterController } from './product-master.controller';
import { ProductMasterService } from './product-master.service';
import { LeadStatusMasterController } from './lead-status-master.controller';
import { LeadStatusMasterService } from './lead-status-master.service';

@Module({
  controllers: [
    SettingsController,
    GstInvoiceSettingsController,
    InvoiceSettingsController,
    HsnMasterController,
    ServiceMasterController,
    ProductMasterController,
    LeadStatusMasterController,
  ],
  providers: [
    SettingsService,
    GstInvoiceSettingsService,
    NonGstInvoiceSettingsService,
    HsnMasterService,
    ServiceMasterService,
    ProductMasterService,
    LeadStatusMasterService,
  ],
  exports: [
    GstInvoiceSettingsService,
    NonGstInvoiceSettingsService,
    HsnMasterService,
    LeadStatusMasterService,
  ],
})
export class SettingsModule {}
