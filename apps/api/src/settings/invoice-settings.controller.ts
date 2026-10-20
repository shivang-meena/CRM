import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { SaveGstInvoiceSettingsDto } from './gst-invoice-settings.dto';
import { SaveNonGstInvoiceSettingsDto } from './non-gst-invoice-settings.dto';
import { GstInvoiceSettingsService } from './gst-invoice-settings.service';
import { NonGstInvoiceSettingsService } from './non-gst-invoice-settings.service';

class SaveInvoiceSettingsDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => SaveGstInvoiceSettingsDto)
  gst: SaveGstInvoiceSettingsDto;
  @IsDefined()
  @ValidateNested()
  @Type(() => SaveNonGstInvoiceSettingsDto)
  nonGst: SaveNonGstInvoiceSettingsDto;
}

@Controller('settings/invoices')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class InvoiceSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gst: GstInvoiceSettingsService,
    private readonly nonGst: NonGstInvoiceSettingsService,
  ) {}

  @Get()
  async get() {
    const [gst, nonGst] = await Promise.all([
      this.gst.get(),
      this.nonGst.get(),
    ]);
    return { gst, nonGst };
  }

  @Put()
  save(@Body() data: SaveInvoiceSettingsDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const gst = await this.gst.saveInTransaction(tx, data.gst);
        const nonGst = await this.nonGst.saveInTransaction(tx, data.nonGst);
        return { gst, nonGst };
      },
      { maxWait: 10000, timeout: 15000 },
    );
  }

  @Get('non-gst')
  nonGstSettings() {
    return this.nonGst.get();
  }
  @Put('non-gst')
  saveNonGst(@Body() data: SaveNonGstInvoiceSettingsDto) {
    return this.nonGst.save(data);
  }
  @Post('non-gst/reset')
  resetNonGst() {
    return this.nonGst.reset();
  }
}
