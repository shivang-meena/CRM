import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CalendarEventCategory } from '@prisma/client';
import { VersionDto } from '../../crm/crm.dto';

export class CalendarItemsQueryDto {
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) from!: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) to!: string;
  @IsOptional() @IsString() categories?: string;
}

export class CreateCalendarEventDto {
  @IsEnum(CalendarEventCategory) category: CalendarEventCategory = CalendarEventCategory.EVENT;
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string | null;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) startAt!: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) endAt!: string;
  @Type(() => Boolean) @IsBoolean() allDay = false;
  @IsOptional() @IsString() timezone?: string;
  @IsString() @IsNotEmpty() @Matches(/^[A-Za-z0-9_-]{8,100}$/) requestKey!: string;
}

export class UpdateCalendarEventDto extends IntersectionType(PartialType(CreateCalendarEventDto), VersionDto) {}
