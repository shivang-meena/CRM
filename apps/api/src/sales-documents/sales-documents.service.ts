import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HsnMasterService } from '../settings/hsn-master.service';
import type {
  GstInvoiceSettings,
  NonGstInvoiceSettings,
  Prisma,
} from '@prisma/client';
import {
  GstInvoiceSettingsService,
  gstSettingsSnapshot,
} from '../settings/gst-invoice-settings.service';
import {
  NonGstInvoiceSettingsService,
  nonGstSettingsSnapshot,
} from '../settings/non-gst-invoice-settings.service';
import {
  CreateSalesDocumentDto,
  DiscountTypeDto,
  GstModeDto,
  GstTypeDto,
  InvoicePaymentStatusDto,
  SalesDocumentItemInputDto,
  SalesDocumentQueryDto,
  SalesDocumentTypeDto,
  UpdateSalesDocumentDto,
  UpsertBrochureDto,
  UpsertPaymentMethodDto,
} from './dto/sales-document.dto';

const DEFAULT_PAYMENT_METHODS = [
  {
    method: 'Internet Banking (NEFT/RTGS/IMPS)',
    bankName: 'HDFC Bank',
    accountNo: '50200103608173',
    ifscCode: 'HDFC0009621',
    isDefault: true,
  },
  { method: 'Cash', isDefault: false },
  { method: 'Credit Card', isDefault: false },
  { method: 'UPI', isDefault: false },
];

const DEFAULT_TERMS =
  '1. Goods or services will be delivered after full payment.';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function assertFiniteNumber(val: unknown, fieldName: string): number {
  const num = Number(val);
  if (!Number.isFinite(num)) {
    throw new BadRequestException(
      `${fieldName} must be a valid finite number.`,
    );
  }
  return num;
}

@Injectable()
export class SalesDocumentsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gstSettings: GstInvoiceSettingsService,
    private readonly nonGstSettings: NonGstInvoiceSettingsService,
    private readonly hsnMaster: HsnMasterService,
  ) {}

  getGstInvoiceSettings() {
    return this.gstSettings.get();
  }
  getNonGstInvoiceSettings() {
    return this.nonGstSettings.get();
  }

  getInvoiceCompanyProfile() {
    // Invoice users can read branding and issuer details, not administrative settings.
    return this.prisma.companyProfile.findUnique({
      where: { id: 'company' },
      select: {
        companyName: true,
        contactNumber: true,
        dialCode: true,
        gstNumber: true,
        email: true,
        address: true,
        logo: true,
        country: true,
        state: true,
        city: true,
        businessCategory: true,
        themeColor: true,
        fontColor: true,
      },
    });
  }

  async onModuleInit() {
    const count = await this.prisma.paymentMethodMaster.count({
      where: { deletedAt: null },
    });
    if (count === 0) {
      await this.prisma.paymentMethodMaster.createMany({
        data: DEFAULT_PAYMENT_METHODS,
      });
    }
  }

  /**
   * Authoritative GST, Discount & Inclusive/Exclusive Calculation Engine
   * Enforces all rules from Sections 3–9:
   * - Normalizes inactive tax rates & amounts to 0
   * - Validates HSN/SAC in IGST and SGST_CGST modes
   * - Reconciles Inclusive GST extraction so taxableBase + tax == inclusiveAmount
   */
  public calculateDocumentFinancials(params: {
    items: SalesDocumentItemInputDto[];
    gstMode: GstModeDto;
    inclusiveGst: boolean;
    documentType: SalesDocumentTypeDto;
    requestedPaymentStatus?: InvoicePaymentStatusDto;
    explicitPaidAmount?: number;
  }) {
    const {
      items,
      gstMode,
      documentType,
      requestedPaymentStatus,
      explicitPaidAmount,
    } = params;

    // Rule 4: In Non-GST mode, inclusiveGst is ignored and forced to false
    const effectiveInclusiveGst =
      gstMode === GstModeDto.NON_GST ? false : Boolean(params.inclusiveGst);

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'At least one valid line item is required.',
      );
    }

    let grossSubtotal = 0;
    let discountTotal = 0;
    let taxableSubtotal = 0;
    let igstTotal = 0;
    let sgstTotal = 0;
    let cgstTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const computedItems = items.map((item, idx) => {
      const productName = (item.productName || '').trim();
      if (!productName) {
        throw new BadRequestException(
          `Item #${idx + 1}: Product/service name is required.`,
        );
      }

      const hsnSac = (item.hsnSac || '').trim();
      if (
        (gstMode === GstModeDto.IGST || gstMode === GstModeDto.SGST_CGST) &&
        !hsnSac
      ) {
        throw new BadRequestException(
          `Item #${idx + 1} (${productName}): HSN/SAC Code is required in GST mode.`,
        );
      }

      const quantity = assertFiniteNumber(
        item.quantity,
        `Item #${idx + 1} quantity`,
      );
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException(
          `Item #${idx + 1} (${productName}): Quantity must be a positive integer.`,
        );
      }

      const unitPrice = assertFiniteNumber(
        item.unitPrice,
        `Item #${idx + 1} unitPrice`,
      );
      if (unitPrice < 0) {
        throw new BadRequestException(
          `Item #${idx + 1} (${productName}): Cost cannot be negative.`,
        );
      }

      const discountValue = assertFiniteNumber(
        item.discountValue ?? 0,
        `Item #${idx + 1} discountValue`,
      );
      if (discountValue < 0) {
        throw new BadRequestException(
          `Item #${idx + 1} (${productName}): Discount cannot be negative.`,
        );
      }

      const grossAmount = round2(unitPrice * quantity);
      let discountAmount = 0;

      if (item.discountType === DiscountTypeDto.PERCENTAGE) {
        if (discountValue > 100) {
          throw new BadRequestException(
            `Item #${idx + 1} (${productName}): Percentage discount must be between 0 and 100.`,
          );
        }
        discountAmount = round2((grossAmount * discountValue) / 100);
      } else if (item.discountType === DiscountTypeDto.FLAT_PER_UNIT) {
        discountAmount = round2(discountValue * quantity);
      } else {
        // FIXED / OVERALL: Fixed amount deducted once on this item line
        discountAmount = round2(discountValue);
      }

      if (discountAmount > grossAmount) {
        throw new BadRequestException(
          `Item #${idx + 1} (${productName}): Discount (${discountAmount}) cannot exceed item gross amount (${grossAmount}).`,
        );
      }

      const afterDiscountAmount = round2(grossAmount - discountAmount);

      // Normalize active vs inactive tax rates strictly by gstMode
      let igstRate = 0;
      let sgstRate = 0;
      let cgstRate = 0;

      if (gstMode === GstModeDto.IGST) {
        igstRate = assertFiniteNumber(
          item.igstRate ?? 0,
          `Item #${idx + 1} IGST %`,
        );
        if (igstRate < 0 || igstRate > 100) {
          throw new BadRequestException(
            `Item #${idx + 1} (${productName}): IGST rate must be between 0 and 100.`,
          );
        }
      } else if (gstMode === GstModeDto.SGST_CGST) {
        sgstRate = assertFiniteNumber(
          item.sgstRate ?? 0,
          `Item #${idx + 1} SGST %`,
        );
        cgstRate = assertFiniteNumber(
          item.cgstRate ?? 0,
          `Item #${idx + 1} CGST %`,
        );
        if (sgstRate < 0 || sgstRate > 100 || cgstRate < 0 || cgstRate > 100) {
          throw new BadRequestException(
            `Item #${idx + 1} (${productName}): SGST and CGST rates must be between 0 and 100.`,
          );
        }
      }

      const combinedRate = round2(
        gstMode === GstModeDto.IGST
          ? igstRate
          : gstMode === GstModeDto.SGST_CGST
            ? sgstRate + cgstRate
            : 0,
      );

      let netAmount = 0; // Taxable base
      let igstAmount = 0;
      let sgstAmount = 0;
      let cgstAmount = 0;
      let taxAmount = 0;
      let totalAmount = 0;

      if (gstMode === GstModeDto.NON_GST) {
        netAmount = afterDiscountAmount;
        totalAmount = afterDiscountAmount;
      } else if (!effectiveInclusiveGst) {
        // Toggle OFF: Tax-Exclusive
        netAmount = afterDiscountAmount;
        if (gstMode === GstModeDto.IGST) {
          igstAmount = round2((netAmount * igstRate) / 100);
          taxAmount = igstAmount;
        } else {
          sgstAmount = round2((netAmount * sgstRate) / 100);
          cgstAmount = round2((netAmount * cgstRate) / 100);
          taxAmount = round2(sgstAmount + cgstAmount);
        }
        totalAmount = round2(netAmount + taxAmount);
      } else {
        // Toggle ON: Tax-Inclusive
        const inclusiveAmount = afterDiscountAmount;
        netAmount =
          combinedRate > 0
            ? round2(inclusiveAmount / (1 + combinedRate / 100))
            : inclusiveAmount;
        const extractedTax = round2(inclusiveAmount - netAmount);

        if (gstMode === GstModeDto.IGST) {
          igstAmount = extractedTax;
          taxAmount = igstAmount;
        } else {
          // Split extracted tax proportionally between SGST and CGST and reconcile rounding
          sgstAmount =
            combinedRate > 0
              ? round2((extractedTax * sgstRate) / combinedRate)
              : 0;
          cgstAmount = round2(extractedTax - sgstAmount);
          taxAmount = round2(sgstAmount + cgstAmount);
        }
        totalAmount = inclusiveAmount;
      }

      grossSubtotal = round2(grossSubtotal + grossAmount);
      discountTotal = round2(discountTotal + discountAmount);
      taxableSubtotal = round2(taxableSubtotal + netAmount);
      igstTotal = round2(igstTotal + igstAmount);
      sgstTotal = round2(sgstTotal + sgstAmount);
      cgstTotal = round2(cgstTotal + cgstAmount);
      taxTotal = round2(taxTotal + taxAmount);
      grandTotal = round2(grandTotal + totalAmount);

      return {
        productName,
        hsnSac: hsnSac || null,
        hsnMasterId: item.hsnMasterId || null,
        hsnDescription: item.hsnDescription?.trim() || null,
        quantity,
        unitPrice,
        discountValue,
        discountType: item.discountType,
        discountAmount,
        grossAmount,
        netAmount,
        igstRate,
        igstAmount,
        sgstRate,
        sgstAmount,
        cgstRate,
        cgstAmount,
        taxPercent: combinedRate,
        taxAmount,
        totalAmount,
        comments: item.comments?.trim() || null,
        sortOrder: idx,
      };
    });

    // Derive authoritative payment amounts and status (Section 11)
    let paidAmount = 0;
    let derivedPaymentStatus: InvoicePaymentStatusDto =
      InvoicePaymentStatusDto.UNPAID;

    if (documentType === SalesDocumentTypeDto.INVOICE) {
      if (requestedPaymentStatus === InvoicePaymentStatusDto.PAID) {
        paidAmount = grandTotal;
      } else if (
        requestedPaymentStatus === InvoicePaymentStatusDto.PARTIALLY_PAID ||
        requestedPaymentStatus === InvoicePaymentStatusDto.HALF_PAID
      ) {
        const rawPaid = assertFiniteNumber(
          explicitPaidAmount ?? 0,
          'paidAmount',
        );
        if (rawPaid < 0 || rawPaid > grandTotal) {
          throw new BadRequestException(
            `Paid amount (${rawPaid}) must be between 0 and Grand Total (${grandTotal}).`,
          );
        }
        paidAmount = round2(rawPaid);
      } else {
        paidAmount = 0;
      }

      if (paidAmount <= 0 || grandTotal === 0) {
        derivedPaymentStatus =
          grandTotal === 0 &&
          requestedPaymentStatus === InvoicePaymentStatusDto.PAID
            ? InvoicePaymentStatusDto.PAID
            : InvoicePaymentStatusDto.UNPAID;
      } else if (paidAmount >= grandTotal) {
        paidAmount = grandTotal;
        derivedPaymentStatus = InvoicePaymentStatusDto.PAID;
      } else {
        derivedPaymentStatus = InvoicePaymentStatusDto.PARTIALLY_PAID;
      }
    }

    const dueAmount = round2(Math.max(0, grandTotal - paidAmount));

    return {
      effectiveInclusiveGst,
      grossSubtotal,
      subtotal: taxableSubtotal,
      discountTotal,
      igstTotal,
      sgstTotal,
      cgstTotal,
      taxTotal,
      grandTotal,
      paidAmount,
      dueAmount,
      derivedPaymentStatus,
      computedItems,
    };
  }

  private async generateNextDocumentNo(
    type: SalesDocumentTypeDto,
  ): Promise<string> {
    const prefix = type === SalesDocumentTypeDto.QUOTATION ? 'QTN' : 'INV';
    const year = new Date().getFullYear();
    const count = await this.prisma.salesDocument.count({
      where: { type },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
  }

  async listDocuments(query: SalesDocumentQueryDto) {
    const where: any = { deletedAt: null };

    if (query.type) {
      where.type = query.type;
    }

    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      if (
        query.paymentStatus === 'PARTIALLY_PAID' ||
        query.paymentStatus === 'HALF_PAID'
      ) {
        where.paymentStatus = { in: ['PARTIALLY_PAID', 'HALF_PAID'] };
      } else {
        where.paymentStatus = query.paymentStatus;
      }
    }

    if (query.gstMode && query.gstMode !== 'ALL') {
      where.gstMode = query.gstMode;
    }

    if (query.fromDate || query.toDate) {
      where.issueDate = {};
      if (query.fromDate) {
        where.issueDate.gte = new Date(`${query.fromDate}T00:00:00+05:30`);
      }
      if (query.toDate) {
        where.issueDate.lte = new Date(`${query.toDate}T23:59:59.999+05:30`);
      }
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { documentNo: { contains: q, mode: 'insensitive' } },
        { customerNameSnapshot: { contains: q, mode: 'insensitive' } },
        { companyNameSnapshot: { contains: q, mode: 'insensitive' } },
        { customerPhoneSnapshot: { contains: q, mode: 'insensitive' } },
        { customer: { lead: { name: { contains: q, mode: 'insensitive' } } } },
        {
          customer: {
            lead: { companyName: { contains: q, mode: 'insensitive' } },
          },
        },
        { customer: { lead: { phone: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const docs = await this.prisma.salesDocument.findMany({
      where,
      include: {
        customer: { include: { lead: true } },
        brochure: true,
        paymentMethod: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { issueDate: 'desc' },
    });

    return docs.map((doc) => this.mapDocumentResponse(doc));
  }

  async getDocumentById(id: string) {
    const doc = await this.prisma.salesDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { include: { lead: true } },
        brochure: true,
        paymentMethod: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!doc) {
      throw new NotFoundException('Sales document not found.');
    }
    return this.mapDocumentResponse(doc);
  }

  async createDocument(
    dto: CreateSalesDocumentDto,
    actor: { userId?: string; userName?: string },
  ) {
    // Idempotency check by requestKey
    if (dto.requestKey) {
      const existingByKey = await this.prisma.salesDocument.findUnique({
        where: { requestKey: dto.requestKey },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (existingByKey) {
        return this.mapDocumentResponse(existingByKey);
      }
    }

    const companyProfile = await this.getInvoiceCompanyProfile();
    if (!companyProfile?.companyName.trim()) {
      throw new BadRequestException(
        'Save the company profile in General Settings → Web Settings before creating an invoice or quotation.',
      );
    }

    const customer: any = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { lead: true },
    });
    if (!customer) {
      throw new NotFoundException('Selected customer does not exist.');
    }

    const activeGstMode = dto.gstMode ?? dto.gstType ?? GstModeDto.NON_GST;
    const isGstInvoice =
      dto.type === SalesDocumentTypeDto.INVOICE &&
      activeGstMode !== GstModeDto.NON_GST;

    const resolvedItems = await this.hsnMaster.resolveItems(dto.items, activeGstMode);

    const financials = isGstInvoice
      ? null
      : this.calculateDocumentFinancials({
          items: resolvedItems,
          gstMode: activeGstMode,
          inclusiveGst: Boolean(dto.inclusiveGst),
          documentType: dto.type,
          requestedPaymentStatus: dto.paymentStatus,
          explicitPaidAmount: dto.paidAmount,
        });

    // Resolve bank details from configured PaymentMethodMaster if available
    const defaultBankMethod = await this.prisma.paymentMethodMaster.findFirst({
      where: {
        deletedAt: null,
        ...(dto.paymentMethodId
          ? { id: dto.paymentMethodId }
          : { isDefault: true }),
      },
    });

    const documentNo =
      dto.type === SalesDocumentTypeDto.INVOICE
        ? ''
        : await this.generateNextDocumentNo(dto.type);
    const lead = customer.lead || {};

    const create = (
      tx: Prisma.TransactionClient,
      settings?: GstInvoiceSettings | NonGstInvoiceSettings,
      gstDocumentNo?: string,
    ) => {
      const invoiceSettings = settings;
      const calculated = isGstInvoice
        ? this.calculateDocumentFinancials({
            items: resolvedItems,
            gstMode: activeGstMode,
            inclusiveGst: Boolean(dto.inclusiveGst),
            documentType: dto.type,
            requestedPaymentStatus: dto.paymentStatus,
            explicitPaidAmount: dto.paidAmount,
          })
        : financials;
      if (!calculated)
        throw new BadRequestException('GST Invoice settings are required.');
      return tx.salesDocument.create({
        data: {
          requestKey: dto.requestKey,
          documentNo: gstDocumentNo ?? documentNo,
          type: dto.type,
          status: 'ISSUED',
          customerId: customer.id,
          leadId: customer.leadId || null,
          issueDate: new Date(dto.issueDate),
          paymentDate:
            dto.type === SalesDocumentTypeDto.INVOICE &&
            calculated.paidAmount > 0 &&
            dto.paymentDate
              ? new Date(dto.paymentDate)
              : null,
          nextPaymentDate: dto.nextPaymentDate
            ? new Date(dto.nextPaymentDate)
            : null,
          gstMode: activeGstMode,
          inclusiveGst: calculated.effectiveInclusiveGst,
          currency: dto.currency || invoiceSettings?.invoiceCurrency || 'INR',
          paymentStatus: calculated.derivedPaymentStatus,
          paymentMethodId: dto.paymentMethodId || defaultBankMethod?.id || null,
          brochureId: dto.brochureId || null,
          termsAndConditions:
            dto.termsAndConditions ??
            invoiceSettings?.termsAndConditions ??
            (dto.type === SalesDocumentTypeDto.INVOICE ? '' : DEFAULT_TERMS),
          emailAutomation: Boolean(dto.emailAutomation),
          whatsappAutomation: Boolean(dto.whatsappAutomation),

          grossSubtotal: calculated.grossSubtotal,
          subtotal: calculated.subtotal,
          discountTotal: calculated.discountTotal,
          igstTotal: calculated.igstTotal,
          sgstTotal: calculated.sgstTotal,
          cgstTotal: calculated.cgstTotal,
          taxTotal: calculated.taxTotal,
          grandTotal: calculated.grandTotal,
          paidAmount: calculated.paidAmount,
          dueAmount: calculated.dueAmount,

          // Preserve issuer, customer and bank snapshots at creation time.
          companyProfileSnapshot: companyProfile,
          sellerCompanyName: companyProfile.companyName,
          sellerPhone: [companyProfile.dialCode, companyProfile.contactNumber]
            .filter(Boolean)
            .join(' '),
          sellerEmail: companyProfile.email,
          sellerAddress: [
            companyProfile.address,
            companyProfile.city,
            companyProfile.state,
            companyProfile.country,
          ]
            .filter(Boolean)
            .join(', '),
          customerNameSnapshot: customer.name || lead.name || 'Customer',
          companyNameSnapshot: customer.companyName || lead.companyName || '-',
          customerPhoneSnapshot: customer.phone || lead.phone || '-',
          customerEmailSnapshot: customer.email || lead.email || '',
          customerAddressSnapshot: customer.address || lead.address || '',
          customerStateSnapshot: dto.customerState || lead.state || '',
          customerGstinSnapshot: customer.gstin || '',
          bankName:
            invoiceSettings?.bankName ??
            (dto.type === SalesDocumentTypeDto.INVOICE
              ? ''
              : defaultBankMethod?.bankName || 'HDFC Bank'),
          bankAccountNo:
            invoiceSettings?.accountNo ??
            (dto.type === SalesDocumentTypeDto.INVOICE
              ? ''
              : defaultBankMethod?.accountNo || '50200103608173'),
          bankIfsc:
            invoiceSettings?.ifscCode ??
            (dto.type === SalesDocumentTypeDto.INVOICE
              ? ''
              : defaultBankMethod?.ifscCode || 'HDFC0009621'),
          ...(dto.type === SalesDocumentTypeDto.INVOICE
            ? { signatoryName: '' }
            : {}),
          ...(invoiceSettings
            ? {
                ...('gstPercentage' in invoiceSettings
                  ? {
                      gstInvoiceSettingsSnapshot:
                        gstSettingsSnapshot(invoiceSettings),
                    }
                  : {
                      nonGstInvoiceSettingsSnapshot:
                        nonGstSettingsSnapshot(invoiceSettings),
                    }),
                signatoryName: '',
              }
            : {}),

          createdById: actor.userId || null,
          createdByName: actor.userName || 'Subadmin',
          items: {
            create: calculated.computedItems,
          },
        },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
    };

    const replay = (tx: Prisma.TransactionClient) =>
      tx.salesDocument.findUnique({
        where: { requestKey: dto.requestKey },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
    const created =
      dto.type === SalesDocumentTypeDto.INVOICE
        ? isGstInvoice
          ? await this.gstSettings.createInvoice(
              (tx, settings, number) => create(tx, settings, number),
              replay,
            )
          : await this.nonGstSettings.createInvoice(
              (tx, settings, number) => create(tx, settings, number),
              replay,
            )
        : await create(this.prisma);
    return this.mapDocumentResponse(created);
  }

  async updateDocument(
    id: string,
    dto: UpdateSalesDocumentDto,
    actor: { userId?: string; userName?: string },
  ) {
    const existing = await this.prisma.salesDocument.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException('Sales document not found.');
    }
    if (existing.version !== dto.version) {
      throw new ConflictException(
        'Document was modified by another user. Please refresh and try again.',
      );
    }

    const customer: any = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { lead: true },
    });
    if (!customer) {
      throw new NotFoundException('Selected customer does not exist.');
    }

    const activeGstMode = dto.gstMode ?? dto.gstType ?? GstModeDto.NON_GST;
    const resolvedItems = await this.hsnMaster.resolveItems(dto.items, activeGstMode, existing.items, existing.gstMode);
    const financials = this.calculateDocumentFinancials({
      items: resolvedItems,
      gstMode: activeGstMode,
      inclusiveGst: Boolean(dto.inclusiveGst),
      documentType: dto.type,
      requestedPaymentStatus: dto.paymentStatus,
      explicitPaidAmount: dto.paidAmount,
    });

    const lead = customer.lead || {};

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salesDocumentItem.deleteMany({
        where: { salesDocumentId: id },
      });

      return tx.salesDocument.update({
        where: { id },
        data: {
          customerId: dto.customerId,
          leadId: customer.leadId || null,
          issueDate: new Date(dto.issueDate),
          paymentDate:
            dto.type === SalesDocumentTypeDto.INVOICE &&
            financials.paidAmount > 0
              ? dto.paymentDate === undefined
                ? existing.paymentDate
                : dto.paymentDate
                  ? new Date(dto.paymentDate)
                  : null
              : null,
          nextPaymentDate: dto.nextPaymentDate
            ? new Date(dto.nextPaymentDate)
            : null,
          gstMode: activeGstMode,
          inclusiveGst: financials.effectiveInclusiveGst,
          currency: dto.currency || 'INR',
          paymentStatus: financials.derivedPaymentStatus,
          paymentMethodId: dto.paymentMethodId || existing.paymentMethodId,
          brochureId: dto.brochureId || null,
          termsAndConditions: dto.termsAndConditions ?? DEFAULT_TERMS,
          emailAutomation: Boolean(dto.emailAutomation),
          whatsappAutomation: Boolean(dto.whatsappAutomation),

          grossSubtotal: financials.grossSubtotal,
          subtotal: financials.subtotal,
          discountTotal: financials.discountTotal,
          igstTotal: financials.igstTotal,
          sgstTotal: financials.sgstTotal,
          cgstTotal: financials.cgstTotal,
          taxTotal: financials.taxTotal,
          grandTotal: financials.grandTotal,
          paidAmount: financials.paidAmount,
          dueAmount: financials.dueAmount,

          customerNameSnapshot:
            customer.name || lead.name || existing.customerNameSnapshot,
          companyNameSnapshot:
            customer.companyName ||
            lead.companyName ||
            existing.companyNameSnapshot,
          customerPhoneSnapshot:
            customer.phone || lead.phone || existing.customerPhoneSnapshot,
          customerEmailSnapshot:
            customer.email || lead.email || existing.customerEmailSnapshot,
          customerAddressSnapshot:
            customer.address ||
            lead.address ||
            existing.customerAddressSnapshot,
          customerStateSnapshot:
            dto.customerState ||
            lead.state ||
            existing.customerStateSnapshot,

          version: { increment: 1 },
          items: {
            create: financials.computedItems,
          },
        },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return this.mapDocumentResponse(updated);
  }

  async deleteDocument(id: string) {
    await this.prisma.salesDocument.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    return { id, deleted: true };
  }

  /**
   * Section 12: Idempotent Quotation -> Invoice Conversion
   * Preserves all tax modes, inclusiveGst, item rates, HSN/SAC, discounts, and snapshots.
   * Prevents duplicate invoices if called repeatedly for the same quotation.
   */
  async convertQuotationToInvoice(
    quotationId: string,
    actor: { userId?: string; userName?: string },
  ) {
    const quotation = await this.prisma.salesDocument.findFirst({
      where: { id: quotationId, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!quotation) {
      throw new NotFoundException('Quotation not found.');
    }

    // Prevent accidental duplicate conversion
    const existingConverted = await this.prisma.salesDocument.findFirst({
      where: {
        sourceQuotationId: quotationId,
        deletedAt: null,
      },
      include: {
        customer: { include: { lead: true } },
        brochure: true,
        paymentMethod: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (existingConverted) {
      return this.mapDocumentResponse(existingConverted);
    }

    const isGstInvoice = quotation.gstMode !== GstModeDto.NON_GST;
    const documentNo = '';

    const create = (
      tx: Prisma.TransactionClient,
      settings?: GstInvoiceSettings | NonGstInvoiceSettings,
      gstDocumentNo?: string,
    ) =>
      tx.salesDocument.create({
        data: {
          documentNo: gstDocumentNo ?? documentNo,
          type: SalesDocumentTypeDto.INVOICE,
          status: 'ISSUED',
          sourceQuotationId: quotation.id,
          customerId: quotation.customerId,
          leadId: quotation.leadId,
          issueDate: new Date(),
          gstMode: quotation.gstMode,
          inclusiveGst: quotation.inclusiveGst,
          currency: quotation.currency,
          paymentStatus: InvoicePaymentStatusDto.UNPAID,
          paymentMethodId: quotation.paymentMethodId,
          brochureId: quotation.brochureId,
          termsAndConditions: quotation.termsAndConditions,
          emailAutomation: quotation.emailAutomation,
          whatsappAutomation: quotation.whatsappAutomation,
          grossSubtotal: quotation.grossSubtotal,
          subtotal: quotation.subtotal,
          discountTotal: quotation.discountTotal,
          igstTotal: quotation.igstTotal,
          sgstTotal: quotation.sgstTotal,
          cgstTotal: quotation.cgstTotal,
          taxTotal: quotation.taxTotal,
          grandTotal: quotation.grandTotal,
          paidAmount: 0,
          dueAmount: quotation.grandTotal,
          customerNameSnapshot: quotation.customerNameSnapshot,
          companyNameSnapshot: quotation.companyNameSnapshot,
          customerPhoneSnapshot: quotation.customerPhoneSnapshot,
          customerEmailSnapshot: quotation.customerEmailSnapshot,
          customerAddressSnapshot: quotation.customerAddressSnapshot,
          customerStateSnapshot: quotation.customerStateSnapshot,
          customerGstinSnapshot: quotation.customerGstinSnapshot,
          sellerCompanyName: quotation.sellerCompanyName,
          sellerPhone: quotation.sellerPhone,
          sellerEmail: quotation.sellerEmail,
          sellerAddress: quotation.sellerAddress,
          ...(quotation.companyProfileSnapshot
            ? { companyProfileSnapshot: quotation.companyProfileSnapshot }
            : {}),
          bankName: settings?.bankName ?? quotation.bankName,
          bankAccountNo: settings?.accountNo ?? quotation.bankAccountNo,
          bankIfsc: settings?.ifscCode ?? quotation.bankIfsc,
          signatoryName: settings ? '' : quotation.signatoryName,
          ...(settings
            ? {
                ...('gstPercentage' in settings
                  ? {
                      gstInvoiceSettingsSnapshot: gstSettingsSnapshot(settings),
                    }
                  : {
                      nonGstInvoiceSettingsSnapshot:
                        nonGstSettingsSnapshot(settings),
                    }),
              }
            : {}),
          createdById: actor.userId || null,
          createdByName: actor.userName || quotation.createdByName,
          items: {
            create: quotation.items.map((item, idx) => ({
              productName: item.productName,
              hsnSac: item.hsnSac,
              hsnMasterId: item.hsnMasterId,
              hsnDescription: item.hsnDescription,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountValue: item.discountValue,
              discountType: item.discountType,
              discountAmount: item.discountAmount,
              grossAmount: item.grossAmount,
              netAmount: item.netAmount,
              igstRate: item.igstRate,
              igstAmount: item.igstAmount,
              sgstRate: item.sgstRate,
              sgstAmount: item.sgstAmount,
              cgstRate: item.cgstRate,
              cgstAmount: item.cgstAmount,
              taxPercent: item.taxPercent,
              taxAmount: item.taxAmount,
              totalAmount: item.totalAmount,
              comments: item.comments,
              sortOrder: idx,
            })),
          },
        },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });

    const replay = (tx: Prisma.TransactionClient) =>
      tx.salesDocument.findFirst({
        where: { sourceQuotationId: quotationId, deletedAt: null },
        include: {
          customer: { include: { lead: true } },
          brochure: true,
          paymentMethod: true,
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
    const createdInvoice = isGstInvoice
      ? await this.gstSettings.createInvoice(
          (tx, settings, number) => create(tx, settings, number),
          replay,
        )
      : await this.nonGstSettings.createInvoice(
          (tx, settings, number) => create(tx, settings, number),
          replay,
        );
    return this.mapDocumentResponse(createdInvoice);
  }

  async listPaymentMethods(search?: string) {
    const where: any = { deletedAt: null };
    if (search?.trim()) {
      where.method = { contains: search.trim(), mode: 'insensitive' };
    }
    return this.prisma.paymentMethodMaster.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createPaymentMethod(dto: UpsertPaymentMethodDto) {
    if (dto.isDefault) {
      await this.prisma.paymentMethodMaster.updateMany({
        where: { deletedAt: null },
        data: { isDefault: false },
      });
    }
    return this.prisma.paymentMethodMaster.create({
      data: {
        method: dto.method.trim(),
        bankName: dto.bankName?.trim() || null,
        accountNo: dto.accountNo?.trim() || null,
        ifscCode: dto.ifscCode?.trim() || null,
        isDefault: Boolean(dto.isDefault),
      },
    });
  }

  async updatePaymentMethod(id: string, dto: UpsertPaymentMethodDto) {
    if (dto.isDefault) {
      await this.prisma.paymentMethodMaster.updateMany({
        where: { id: { not: id }, deletedAt: null },
        data: { isDefault: false },
      });
    }
    return this.prisma.paymentMethodMaster.update({
      where: { id },
      data: {
        method: dto.method.trim(),
        bankName: dto.bankName?.trim() || null,
        accountNo: dto.accountNo?.trim() || null,
        ifscCode: dto.ifscCode?.trim() || null,
        isDefault: Boolean(dto.isDefault),
        version: { increment: 1 },
      },
    });
  }

  async deletePaymentMethod(id: string) {
    await this.prisma.paymentMethodMaster.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    return { id, deleted: true };
  }

  async listBrochures(search?: string) {
    const where: any = { deletedAt: null };
    if (search?.trim()) {
      where.brochureName = { contains: search.trim(), mode: 'insensitive' };
    }
    return this.prisma.brochureMaster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBrochure(dto: UpsertBrochureDto) {
    return this.prisma.brochureMaster.create({
      data: {
        brochureName: dto.brochureName.trim(),
        type: dto.type.trim(),
        startAfter: dto.startAfter.trim(),
        fileUrl: dto.fileUrl?.trim() || null,
      },
    });
  }

  async updateBrochure(id: string, dto: UpsertBrochureDto) {
    return this.prisma.brochureMaster.update({
      where: { id },
      data: {
        brochureName: dto.brochureName.trim(),
        type: dto.type.trim(),
        startAfter: dto.startAfter.trim(),
        ...(dto.fileUrl === undefined
          ? {}
          : { fileUrl: dto.fileUrl.trim() || null }),
        version: { increment: 1 },
      },
    });
  }

  async deleteBrochure(id: string) {
    await this.prisma.brochureMaster.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    return { id, deleted: true };
  }

  private mapDocumentResponse(doc: any) {
    const lead = doc.customer?.lead;
    return {
      id: doc.id,
      documentNo: doc.documentNo,
      type: doc.type,
      status: doc.status,
      sourceQuotationId: doc.sourceQuotationId || null,
      customerId: doc.customerId,
      companyName:
        doc.companyNameSnapshot ||
        doc.customer?.companyName ||
        lead?.companyName ||
        '-',
      customerName:
        doc.customerNameSnapshot ||
        doc.customer?.name ||
        lead?.name ||
        'Unknown Customer',
      mobile:
        doc.customerPhoneSnapshot || doc.customer?.phone || lead?.phone || '-',
      email:
        doc.customerEmailSnapshot || doc.customer?.email || lead?.email || '',
      address:
        doc.customerAddressSnapshot ||
        doc.customer?.address ||
        lead?.address ||
        '',
      state:
        doc.customerStateSnapshot ||
        lead?.state ||
        '',
      issueDate: doc.issueDate.toISOString(),
      paymentDate: doc.paymentDate ? doc.paymentDate.toISOString() : null,
      nextPaymentDate: doc.nextPaymentDate
        ? doc.nextPaymentDate.toISOString()
        : null,
      gstMode: doc.gstMode,
      gstType: doc.gstMode, // backward-compatible alias
      inclusiveGst: Boolean(doc.inclusiveGst),
      currency: doc.currency,
      paymentStatus:
        doc.paymentStatus === 'HALF_PAID'
          ? 'PARTIALLY_PAID'
          : doc.paymentStatus,
      paymentMethodId: doc.paymentMethodId || null,
      paymentMethodName: doc.paymentMethod?.method || null,
      brochureId: doc.brochureId,
      brochureName: doc.brochure?.brochureName || null,
      termsAndConditions: doc.termsAndConditions,
      emailAutomation: doc.emailAutomation,
      whatsappAutomation: doc.whatsappAutomation,
      grossSubtotal: Number(doc.grossSubtotal ?? doc.subtotal),
      subtotal: Number(doc.subtotal),
      discountTotal: Number(doc.discountTotal),
      igstTotal: Number(doc.igstTotal ?? 0),
      sgstTotal: Number(doc.sgstTotal ?? 0),
      cgstTotal: Number(doc.cgstTotal ?? 0),
      taxTotal: Number(doc.taxTotal),
      grandTotal: Number(doc.grandTotal),
      paidAmount: Number(doc.paidAmount),
      dueAmount: Number(doc.dueAmount),
      sellerCompanyName: doc.sellerCompanyName,
      sellerPhone: doc.sellerPhone,
      sellerEmail: doc.sellerEmail,
      sellerAddress: doc.sellerAddress,
      companyProfileSnapshot: doc.companyProfileSnapshot ?? null,
      gstInvoiceSettingsSnapshot: doc.gstInvoiceSettingsSnapshot ?? null,
      nonGstInvoiceSettingsSnapshot: doc.nonGstInvoiceSettingsSnapshot ?? null,
      bankName: doc.bankName,
      bankAccountNo: doc.bankAccountNo,
      bankIfsc: doc.bankIfsc,
      signatoryName: doc.signatoryName,
      createdByName: doc.createdByName,
      version: doc.version,
      createdAt: doc.createdAt.toISOString(),
      items: (doc.items || []).map((item: any) => ({
        id: item.id,
        productName: item.productName,
        hsnSac: item.hsnSac || '',
        hsnMasterId: item.hsnMasterId || undefined,
        hsnDescription: item.hsnDescription || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountValue: Number(item.discountValue),
        discountType:
          item.discountType === 'OVERALL' ? 'FIXED' : item.discountType,
        discountAmount: Number(item.discountAmount),
        grossAmount: Number(item.grossAmount ?? item.unitPrice * item.quantity),
        netAmount: Number(item.netAmount),
        igstRate: Number(item.igstRate ?? 0),
        igstAmount: Number(item.igstAmount ?? 0),
        sgstRate: Number(item.sgstRate ?? 0),
        sgstAmount: Number(item.sgstAmount ?? 0),
        cgstRate: Number(item.cgstRate ?? 0),
        cgstAmount: Number(item.cgstAmount ?? 0),
        taxPercent: Number(item.taxPercent ?? 0),
        taxAmount: Number(item.taxAmount),
        totalAmount: Number(item.totalAmount),
        comments: item.comments || '',
      })),
    };
  }

  // Compatibility methods for lead-level routes if called
  async list(leadId: string, type: any, query: any) {
    const docs = await this.prisma.salesDocument.findMany({
      where: { leadId, deletedAt: null, type: type as any },
      include: {
        customer: { include: { lead: true } },
        brochure: true,
        items: { orderBy: { sortOrder: 'asc' } },
        payments: true,
      },
      skip: ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20),
      take: query?.pageSize ?? 20,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.salesDocument.count({
      where: { leadId, deletedAt: null, type: type as any },
    });
    return {
      items: docs.map((d) => this.mapDocumentResponse(d)),
      total,
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? 20,
    };
  }

  async one(leadId: string, id: string, type: any) {
    return this.getDocumentById(id);
  }

  async create(leadId: string, type: any, body: any, actor: any) {
    let customer = await this.prisma.customer.findUnique({ where: { leadId } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          leadId,
          convertedById: actor?.id ?? 'system',
          convertedByName: actor?.name ?? 'System',
        },
      });
    }
    return this.createDocument(
      {
        ...body,
        requestKey: body.requestKey || `lead-doc-${Date.now()}`,
        customerId: customer.id,
        type: type as any,
        items: (body.items || []).map((i: any) => ({
          productName: i.description || i.productName || 'Item',
          unitPrice: Number(i.unitPrice || 0),
          quantity: Number(i.quantity || 1),
          discountValue: Number(i.discountAmount || 0),
          discountType: DiscountTypeDto.FIXED,
          comments: '',
        })),
        gstMode: GstModeDto.NON_GST,
        paymentStatus: InvoicePaymentStatusDto.UNPAID,
        issueDate: body.documentDate || new Date().toISOString().slice(0, 10),
      },
      { userId: actor?.id, userName: actor?.name },
    );
  }

  async update(leadId: string, id: string, type: any, body: any, actor: any) {
    return this.updateDocument(id, body, {
      userId: actor?.id,
      userName: actor?.name,
    });
  }

  async action(
    leadId: string,
    id: string,
    type: any,
    action: string,
    body: any,
    actor: any,
  ) {
    if (action === 'delete') {
      return this.deleteDocument(id);
    }
    return this.getDocumentById(id);
  }

  async convert(leadId: string, id: string, body: any, actor: any) {
    return this.convertQuotationToInvoice(id, {
      userId: actor?.id,
      userName: actor?.name,
    });
  }

  async payments(leadId: string, id: string) {
    return this.prisma.invoicePayment.findMany({ where: { invoiceId: id } });
  }

  async pay(leadId: string, id: string, body: any, actor: any) {
    const payment = await this.prisma.invoicePayment.create({
      data: {
        invoiceId: id,
        amount: body.amount,
        method: body.method || 'CASH',
        paidAt: new Date(body.paidAt || Date.now()),
        reference: body.reference,
        note: body.note,
        createdById: actor?.id || 'system',
        createdByName: actor?.name || 'System User',
        requestKey: body.requestKey || `pay-${Date.now()}`,
        requestHash: 'hash',
      },
    });
    return payment;
  }

  async voidPayment(
    leadId: string,
    id: string,
    paymentId: string,
    body: any,
    actor: any,
  ) {
    return this.prisma.invoicePayment.update({
      where: { id: paymentId },
      data: {
        voidedAt: new Date(),
        voidedById: actor?.id,
        voidReason: body?.reason,
      },
    });
  }
}
