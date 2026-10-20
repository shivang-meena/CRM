import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/permissions';
import { SaveGstInvoiceSettingsDto } from './gst-invoice-settings.dto';
import { GstInvoiceSettingsService } from './gst-invoice-settings.service';

@Controller('settings/invoices/gst')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class GstInvoiceSettingsController {
  constructor(private readonly settings: GstInvoiceSettingsService) {}
  @Get() get() {
    return this.settings.get();
  }
  @Put() save(@Body() data: SaveGstInvoiceSettingsDto) {
    return this.settings.save(data);
  }
  @Post('reset') reset() {
    return this.settings.reset();
  }
}
