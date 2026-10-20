import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { GstInvoiceSettingsController } from './gst-invoice-settings.controller';
import { GstInvoiceSettingsService } from './gst-invoice-settings.service';
import { NonGstInvoiceSettingsService } from './non-gst-invoice-settings.service';
import { InvoiceSettingsController } from './invoice-settings.controller';

@Module({
  controllers: [
    SettingsController,
    GstInvoiceSettingsController,
    InvoiceSettingsController,
  ],
  providers: [
    SettingsService,
    GstInvoiceSettingsService,
    NonGstInvoiceSettingsService,
  ],
  exports: [GstInvoiceSettingsService, NonGstInvoiceSettingsService],
})
export class SettingsModule {}
