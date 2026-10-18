import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDefined, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested, IsDateString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { CreateRequestDto, VersionDto } from '../../crm/crm.dto';

export class PartyDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(1000) address?: string;
  @IsOptional() @IsString() @MaxLength(100) phone?: string;
  @ValidateIf((_o, v) => v !== undefined && v !== '') @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(100) taxIdentifier?: string;
}
export class DocumentItemDto {
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(1000) description: string;
  @IsString() @Matches(/^\d{1,9}(\.\d{1,3})?$/) quantity: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsString() @Matches(/^\d{1,12}(\.\d{1,2})?$/) unitPrice: string;
  @IsString() @Matches(/^\d{1,14}(\.\d{1,2})?$/) discountAmount: string;
  @IsString() @Matches(/^\d{1,3}(\.\d{1,2})?$/) taxPercent: string;
}
export class DocumentFieldsDto {
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) documentDate: string;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) validUntil?: string | null;
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) dueDate?: string | null;
  @IsOptional() @Matches(/^INR$/) currency?: string;
  @IsDefined() @ValidateNested() @Type(() => PartyDto) customerSnapshot: PartyDto;
  @IsDefined() @ValidateNested() @Type(() => PartyDto) issuerSnapshot: PartyDto;
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => DocumentItemDto) items: DocumentItemDto[];
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(4000) terms?: string;
}
export class CreateDocumentDto extends IntersectionType(DocumentFieldsDto, CreateRequestDto) {}
export class UpdateDocumentDto extends IntersectionType(PartialType(DocumentFieldsDto, { skipNullProperties: false }), VersionDto) {}
export class ConvertQuotationDto extends IntersectionType(VersionDto, CreateRequestDto) {}
export class PaymentDto extends CreateRequestDto {
  @IsString() @Matches(/^\d{1,14}(\.\d{1,2})?$/) amount: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) paidAt: string;
  @IsEnum(PaymentMethod) method: PaymentMethod;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
