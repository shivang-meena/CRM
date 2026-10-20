import { OmitType } from '@nestjs/mapped-types';
import { SaveGstInvoiceSettingsDto } from './gst-invoice-settings.dto';

export class SaveNonGstInvoiceSettingsDto extends OmitType(
  SaveGstInvoiceSettingsDto,
  ['gstPercentage'] as const,
) {}
