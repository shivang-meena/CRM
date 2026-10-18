import { StaffStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function isValidCalendarDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function IsCalendarDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isCalendarDate',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidCalendarDateString(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in YYYY-MM-DD format`;
        },
      },
    });
  };
}

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const normalizeEmail = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const trimNullable = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  return value.trim() || null;
};

export class ListStaffQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

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

export class CreateStaffDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @IsCalendarDate()
  birthDate?: string | null;

  @Transform(trim)
  @IsString()
  @IsCalendarDate()
  joiningDate!: string;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(100)
  department?: string | null;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(100)
  designation?: string | null;

  @IsOptional()
  @Transform(trimNullable)
  @IsString()
  @MaxLength(50)
  employeeCode?: string | null;
}

// Edit sends the complete form plus the version that was loaded by the client.
export class UpdateStaffDto extends CreateStaffDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class UpdateStaffStatusDto {
  @IsEnum(StaffStatus)
  status!: StaffStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
