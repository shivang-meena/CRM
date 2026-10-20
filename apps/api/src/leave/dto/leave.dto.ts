import { LeaveStatus, LeaveType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const trimNullable = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  return value.trim() || null;
};

export class ListLeaveQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @Transform(trim)
  @IsString()
  staffId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
}

export class ApplyLeaveDto {
  @IsEnum(LeaveType)
  type!: LeaveType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  startDate!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  endDate!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(2000)
  leaveDetail?: string | null;
}

export class UpdateLeaveDto extends ApplyLeaveDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class ReviewLeaveDto {
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(1000)
  rejectionNote?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
