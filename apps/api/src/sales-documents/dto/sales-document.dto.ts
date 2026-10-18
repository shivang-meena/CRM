import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SalesDocumentTypeDto {
  QUOTATION = 'QUOTATION',
  INVOICE = 'INVOICE',
}

export enum GstModeDto {
  NON_GST = 'NON_GST',
  IGST = 'IGST',
  SGST_CGST = 'SGST_CGST',
}

export const GstTypeDto = GstModeDto;
export type GstTypeDto = GstModeDto;

export enum DiscountTypeDto {
  FIXED = 'FIXED',
  OVERALL = 'OVERALL',
  PERCENTAGE = 'PERCENTAGE',
  FLAT_PER_UNIT = 'FLAT_PER_UNIT',
}

export enum InvoicePaymentStatusDto {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  HALF_PAID = 'HALF_PAID',
  PAID = 'PAID',
}

export class SalesDocumentItemInputDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsOptional()
  @IsString()
  hsnSac?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  unitPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  discountValue!: number;

  @IsEnum(DiscountTypeDto)
  discountType!: DiscountTypeDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  igstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  sgstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  cgstRate?: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateSalesDocumentDto {
  @IsString()
  @IsNotEmpty()
  requestKey!: string;

  @IsEnum(SalesDocumentTypeDto)
  type!: SalesDocumentTypeDto;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  issueDate!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  paymentDate?: string | null;

  @IsOptional()
  @IsString()
  nextPaymentDate?: string | null;

  @IsOptional()
  @IsEnum(GstModeDto)
  gstMode?: GstModeDto;

  // Backward-compatible alias if older client sends gstType
  @IsOptional()
  @IsEnum(GstModeDto)
  gstType?: GstModeDto;

  @IsOptional()
  @IsBoolean()
  inclusiveGst?: boolean;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(InvoicePaymentStatusDto)
  paymentStatus?: InvoicePaymentStatusDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethodId?: string | null;

  @IsOptional()
  @IsString()
  brochureId?: string | null;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @IsOptional()
  @IsBoolean()
  emailAutomation?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappAutomation?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesDocumentItemInputDto)
  items!: SalesDocumentItemInputDto[];
}

export class UpdateSalesDocumentDto extends CreateSalesDocumentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class RecordInvoicePaymentDto {
  @IsString()
  @IsNotEmpty()
  requestKey!: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  nextPaymentDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SalesDocumentQueryDto {
  @IsOptional()
  @IsEnum(SalesDocumentTypeDto)
  type?: SalesDocumentTypeDto;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  gstMode?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpsertPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  requestKey!: string;

  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;
}

export class UpsertBrochureDto {
  @IsString()
  @IsNotEmpty()
  requestKey!: string;

  @IsString()
  @IsNotEmpty()
  brochureName!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  startAfter!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;
}
