import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GstInvoiceSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';
import { SaveGstInvoiceSettingsDto } from './gst-invoice-settings.dto';

export function gstDocumentNumber(prefix: string, number: number): string {
  return `${prefix}${prefix.endsWith('-') ? '' : '-'}${number}`;
}

export function gstSettingsSnapshot(settings: GstInvoiceSettings) {
  return {
    invoiceCurrency: settings.invoiceCurrency,
    hsnSac: settings.hsnSac,
    invoicePrefix: settings.invoicePrefix,
    invoiceStart: settings.invoiceStart,
    gstPercentage: settings.gstPercentage,
    bankName: settings.bankName,
    accountNo: settings.accountNo,
    ifscCode: settings.ifscCode,
    paymentUpiId: settings.paymentUpiId,
    signature: settings.signature,
    termsAndConditions: settings.termsAndConditions,
  };
}

@Injectable()
export class GstInvoiceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.gstInvoiceSettings.findFirst();
  }

  private async lock(tx: Prisma.TransactionClient) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(36502026, hashtext(${currentAdminId()}))::text AS locked`;
  }

  private async assertAvailable(
    tx: Prisma.TransactionClient,
    prefix: string,
    number: number,
  ) {
    const documentNo = gstDocumentNumber(prefix, number);
    const existing = await tx.salesDocument.findFirst({
      where: { documentNo },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        `Invoice ${documentNo} already exists. Choose a different prefix or a higher Invoice Start.`,
      );
  }

  save(data: SaveGstInvoiceSettingsDto) {
    return this.prisma.$transaction((tx) => this.saveInTransaction(tx, data));
  }

  async saveInTransaction(
    tx: Prisma.TransactionClient,
    data: SaveGstInvoiceSettingsDto,
  ) {
    await this.lock(tx);
    const existing = await tx.gstInvoiceSettings.findFirst();
    const restart =
      !existing ||
      existing.invoicePrefix !== data.invoicePrefix ||
      existing.invoiceStart !== data.invoiceStart;
    if (restart)
      await this.assertAvailable(tx, data.invoicePrefix, data.invoiceStart);
    return tx.gstInvoiceSettings.upsert({
      where: { adminId: currentAdminId() },
      create: {
        ...data,
        adminId: currentAdminId(),
        invoiceCurrency: data.invoiceCurrency ?? 'INR',
        hsnSac: data.hsnSac ?? '9983',
        ifscCode: data.ifscCode.toUpperCase(),
        nextNumber: data.invoiceStart,
      },
      update: {
        ...data,
        invoiceCurrency:
          data.invoiceCurrency ?? existing?.invoiceCurrency ?? 'INR',
        hsnSac: data.hsnSac ?? existing?.hsnSac ?? '9983',
        ifscCode: data.ifscCode.toUpperCase(),
        ...(restart ? { nextNumber: data.invoiceStart } : {}),
      },
    });
  }

  reset() {
    return this.prisma.$transaction(async (tx) => {
      await this.lock(tx);
      const settings = await tx.gstInvoiceSettings.findFirst();
      if (!settings)
        throw new BadRequestException(
          'Save GST Invoice settings before resetting the invoice start.',
        );
      await this.assertAvailable(
        tx,
        settings.invoicePrefix,
        settings.invoiceStart,
      );
      return tx.gstInvoiceSettings.update({
        where: { adminId: currentAdminId() },
        data: { nextNumber: settings.invoiceStart },
      });
    });
  }

  createInvoice<T>(
    write: (
      tx: Prisma.TransactionClient,
      settings: GstInvoiceSettings,
      documentNo: string,
    ) => Promise<T>,
    replay?: (tx: Prisma.TransactionClient) => Promise<T | null>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.lock(tx);
        const existingResult = replay ? await replay(tx) : null;
        if (existingResult) return existingResult;
        const settings = await tx.gstInvoiceSettings.findFirst();
        if (!settings)
          throw new BadRequestException(
            'Save GST Invoice settings in Web Settings → Invoice Settings before creating a GST invoice.',
          );
        let next = settings.nextNumber;
        while (next < 2147483647) {
          const documentNo = gstDocumentNumber(settings.invoicePrefix, next);
          const existing = await tx.salesDocument.findFirst({
            where: { documentNo },
            select: { id: true },
          });
          if (!existing) {
            const result = await write(tx, settings, documentNo);
            await tx.gstInvoiceSettings.update({
              where: { adminId: currentAdminId() },
              data: { nextNumber: next + 1 },
            });
            return result;
          }
          next++;
        }
        throw new BadRequestException(
          'GST invoice numbering has reached its limit. Choose a new invoice prefix and start number.',
        );
      },
      { timeout: 15000 },
    );
  }
}
