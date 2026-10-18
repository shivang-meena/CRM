import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { StandaloneTaskPriority, StandaloneTaskStatus, TaskRecurrenceFrequency } from '@prisma/client';
import { CreateRequestDto, VersionDto } from '../../crm/crm.dto';

class TaskFieldsDto {
  @IsString() @MaxLength(200) subject: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string | null;
  @IsEnum(StandaloneTaskPriority) priority: StandaloneTaskPriority;
  @IsEnum(StandaloneTaskStatus) status: StandaloneTaskStatus;
  @IsOptional() @IsUUID() labelId?: string | null;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) startAt: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) endAt: string;
  @IsOptional() @IsString() @MaxLength(200) assignedTo?: string;
  @IsOptional() @IsBoolean() recursive?: boolean;
  @IsOptional() @IsEnum(TaskRecurrenceFrequency) frequency?: TaskRecurrenceFrequency;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) interval?: number;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) recurrenceEndsAt?: string | null;
}

export class CreateStandaloneTaskDto extends IntersectionType(TaskFieldsDto, CreateRequestDto) {}
export class UpdateStandaloneTaskDto extends IntersectionType(PartialType(TaskFieldsDto, { skipNullProperties: false }), VersionDto) {}

export class ChangeTaskStatusDto extends VersionDto {
  @IsEnum(StandaloneTaskStatus) status: StandaloneTaskStatus;
}

export class TaskQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(StandaloneTaskStatus) status?: StandaloneTaskStatus;
  @IsOptional() @IsEnum(StandaloneTaskPriority) priority?: StandaloneTaskPriority;
  @IsOptional() @IsUUID() labelId?: string;
  @IsOptional() @IsString() @MaxLength(200) assignedTo?: string;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) from?: string;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) to?: string;
  @IsOptional() @Matches(/^(true|false)$/) overdue?: string;
}

export class CreateTaskLabelDto {
  @IsString() @MaxLength(80) name: string;
  @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) colour: string;
}

export class UpdateTaskRecurrenceSeriesDto extends VersionDto {
  @IsOptional() @IsEnum(TaskRecurrenceFrequency) frequency?: TaskRecurrenceFrequency;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) interval?: number;
  @IsOptional() @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) recurrenceEndsAt?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
}
