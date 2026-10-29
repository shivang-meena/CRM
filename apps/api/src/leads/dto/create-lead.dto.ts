import { LeadSource } from '@prisma/client';
import {
  ArrayUnique, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateIf,
} from 'class-validator';

export class CreateLeadDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;

  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsUUID() serviceId?: string | null;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) serviceIds?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) productIds?: string[];
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() @IsNotEmpty() assignedToId?: string;

  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;

  @IsOptional() @IsNumber() @Min(0) estimatedAmount?: number;
  @IsOptional() @IsInt() @Min(0) @Max(5) rating?: number;
  @IsOptional() @IsDateString() nextFollowUpAt?: string | null;
}
