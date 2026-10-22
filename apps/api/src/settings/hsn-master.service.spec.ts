import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma, SalesDocumentItem } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { SalesDocumentsService } from '../sales-documents/sales-documents.service';
import {
  DiscountTypeDto,
  GstModeDto,
  SalesDocumentTypeDto,
} from '../sales-documents/dto/sales-document.dto';
import { GstInvoiceSettingsService } from './gst-invoice-settings.service';
import { NonGstInvoiceSettingsService } from './non-gst-invoice-settings.service';
import { SaveHsnMasterDto } from './hsn-master.dto';
import { HsnMasterService } from './hsn-master.service';

describe('HSN master invoice flow', () => {
  const master = {
    id: 'hsn-1',
    code: '9983',
    description: 'Configured services',
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    isActive: true,
  };
  const line = {
    productName: 'Consulting',
    hsnMasterId: master.id,
    hsnSac: 'wrong-client-code',
    hsnDescription: 'wrong-client-description',
    unitPrice: 1000,
    quantity: 1,
    discountValue: 0,
    discountType: DiscountTypeDto.OVERALL,
    igstRate: 99,
    sgstRate: 99,
    cgstRate: 99,
  };
  const db = {
    hsnMaster: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const prisma = db as unknown as PrismaService;
  const service = new HsnMasterService(prisma);
  const documents = new SalesDocumentsService(
    prisma,
    {} as GstInvoiceSettingsService,
    {} as NonGstInvoiceSettingsService,
    service,
  );
  const calculate = (
    items: (typeof line)[],
    mode: GstModeDto,
    inclusiveGst = false,
  ) =>
    documents.calculateDocumentFinancials({
      items,
      gstMode: mode,
      inclusiveGst,
      documentType: SalesDocumentTypeDto.INVOICE,
    });

  beforeEach(() => {
    jest.resetAllMocks();
    db.hsnMaster.findMany.mockResolvedValue([master]);
    db.hsnMaster.create.mockImplementation(
      ({ data }: { data: SaveHsnMasterDto }) =>
        Promise.resolve({ ...master, ...data }),
    );
  });

  it.each([GstModeDto.IGST, GstModeDto.SGST_CGST])(
    'uses master values and calculates %s, ignoring supplied tax rates',
    async (mode) => {
      const resolved = await service.resolveItems([line], mode);
      const result = calculate(resolved as (typeof line)[], mode);
      expect(result.taxTotal).toBe(180);
      expect(result.grandTotal).toBe(1180);
      expect(result.igstTotal).toBe(mode === GstModeDto.IGST ? 180 : 0);
      expect(result.sgstTotal).toBe(mode === GstModeDto.SGST_CGST ? 90 : 0);
      expect(result.cgstTotal).toBe(mode === GstModeDto.SGST_CGST ? 90 : 0);
      expect(result.computedItems[0]).toMatchObject({
        hsnMasterId: master.id,
        hsnSac: master.code,
        hsnDescription: master.description,
      });
    },
  );

  it('applies distinct rates to multiple HSNs, including zero-rate entries', async () => {
    db.hsnMaster.findMany.mockResolvedValue([
      master,
      {
        ...master,
        id: 'hsn-2',
        code: '1001',
        igstRate: 5,
        sgstRate: 2.5,
        cgstRate: 2.5,
      },
      {
        ...master,
        id: 'hsn-zero',
        code: '1002',
        igstRate: 0,
        sgstRate: 0,
        cgstRate: 0,
      },
    ]);
    const resolved = await service.resolveItems(
      [
        line,
        { ...line, hsnMasterId: 'hsn-2' },
        { ...line, hsnMasterId: 'hsn-zero' },
      ],
      GstModeDto.SGST_CGST,
    );
    const result = calculate(resolved as (typeof line)[], GstModeDto.SGST_CGST);
    expect(result.taxTotal).toBe(230);
    expect(result.grandTotal).toBe(3230);
  });

  it('extracts inclusive GST using the selected HSN rate', async () => {
    const resolved = await service.resolveItems(
      [{ ...line, unitPrice: 1180 }],
      GstModeDto.SGST_CGST,
    );
    const result = calculate(
      resolved as (typeof line)[],
      GstModeDto.SGST_CGST,
      true,
    );
    expect(result.subtotal).toBe(1000);
    expect(result.taxTotal).toBe(180);
    expect(result.grandTotal).toBe(1180);
  });

  it('clears tax and HSN data in non-GST mode', async () => {
    const resolved = await service.resolveItems([line], GstModeDto.NON_GST);
    const result = calculate(resolved as (typeof line)[], GstModeDto.NON_GST);
    expect(db.hsnMaster.findMany).not.toHaveBeenCalled();
    expect(result.taxTotal).toBe(0);
    expect(result.computedItems[0]).toMatchObject({
      hsnMasterId: null,
      hsnDescription: null,
      hsnSac: null,
    });
  });

  it('rejects missing or inactive masters for new GST lines', async () => {
    db.hsnMaster.findMany.mockResolvedValue([]);
    await expect(service.resolveItems([line], GstModeDto.IGST)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.resolveItems(
        [{ ...line, hsnMasterId: undefined }],
        GstModeDto.IGST,
      ),
    ).rejects.toThrow('Select an active HSN');
  });

  const savedLine = () =>
    ({
      ...line,
      id: 'saved-item',
      hsnSac: master.code,
      hsnDescription: 'Original description',
      igstRate: new Prisma.Decimal(12),
      sgstRate: new Prisma.Decimal(0),
      cgstRate: new Prisma.Decimal(0),
    }) as unknown as SalesDocumentItem;

  it('preserves an issued invoice snapshot even after its master is changed or deactivated', async () => {
    db.hsnMaster.findMany.mockResolvedValue([]);
    const resolved = await service.resolveItems(
      [{ ...line, id: 'saved-item', hsnSac: master.code }],
      GstModeDto.IGST,
      [savedLine()],
      GstModeDto.IGST,
    );
    expect(resolved[0]).toMatchObject({
      hsnDescription: 'Original description',
      igstRate: 12,
      sgstRate: 0,
      cgstRate: 0,
    });
    expect(
      calculate(resolved as (typeof line)[], GstModeDto.IGST).taxTotal,
    ).toBe(120);
  });

  it('refreshes rates when the same HSN is explicitly selected again', async () => {
    const resolved = await service.resolveItems(
      [
        {
          ...line,
          id: 'saved-item',
          hsnSac: master.code,
          applyHsnMaster: true,
        },
      ],
      GstModeDto.IGST,
      [savedLine()],
      GstModeDto.IGST,
    );
    expect(resolved[0]).toMatchObject({
      hsnDescription: master.description,
      igstRate: 18,
    });
  });

  it('resolves the required tax components when an invoice changes GST mode', async () => {
    const resolved = await service.resolveItems(
      [{ ...line, id: 'saved-item', hsnSac: master.code }],
      GstModeDto.SGST_CGST,
      [savedLine()],
      GstModeDto.IGST,
    );
    expect(resolved[0]).toMatchObject({
      igstRate: 18,
      sgstRate: 9,
      cgstRate: 9,
    });
    expect(
      calculate(resolved as (typeof line)[], GstModeDto.SGST_CGST).taxTotal,
    ).toBe(180);
  });

  it('preserves legacy invoices with no master reference when edited', async () => {
    const legacy = { ...savedLine(), hsnMasterId: null, hsnDescription: null };
    const resolved = await service.resolveItems(
      [{ ...line, id: legacy.id, hsnSac: master.code, hsnMasterId: undefined }],
      GstModeDto.IGST,
      [legacy],
      GstModeDto.IGST,
    );
    expect(resolved[0].igstRate).toBe(12);
  });

  it('validates required descriptions, code format and numeric rate precision', async () => {
    const valid = plainToInstance(SaveHsnMasterDto, {
      ...master,
      code: ' 0012 ',
      description: ' Description ',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.code).toBe('0012');
    const invalid = plainToInstance(SaveHsnMasterDto, {
      code: 'ABC',
      description: ' ',
      igstRate: -1,
      sgstRate: 100.001,
      cgstRate: 101,
    });
    expect((await validate(invalid)).map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'code',
        'description',
        'igstRate',
        'sgstRate',
        'cgstRate',
      ]),
    );
  });

  it('saves configured rates and rejects inconsistent GST totals', async () => {
    expect(await service.save(master)).toMatchObject(master);
    await expect(service.save({ ...master, cgstRate: 5 })).rejects.toThrow(
      'IGST must equal SGST + CGST',
    );
  });

  it('reports duplicate HSN codes without exposing a database error', async () => {
    db.hsnMaster.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique code', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );
    await expect(service.save(master)).rejects.toThrow(ConflictException);
  });
});
