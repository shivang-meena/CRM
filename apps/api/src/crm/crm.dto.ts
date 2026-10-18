import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class ListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) from?: string;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) to?: string;
  @IsOptional() @Matches(/^(true|false)$/) overdue?: string;
  @IsOptional() @IsString() type?: string;
}

export class VersionDto {
  @IsInt() @Min(1) version: number;
  @IsOptional() @IsString() @MaxLength(4000) outcome?: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}

export class CreateRequestDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{8,100}$/) requestKey: string;
}

export class LinkedReminderDto {
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) reminderAt?: string;
  @IsOptional() @IsBoolean() updateLinkedReminder?: boolean;
}
