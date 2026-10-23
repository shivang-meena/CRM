import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Matches, MaxLength, ValidateNested } from 'class-validator';
import { FollowUpChannel, MeetingMode } from '@prisma/client';
import { CreateRequestDto, LinkedReminderDto, VersionDto } from '../../crm/crm.dto';

class ActivityBaseDto extends LinkedReminderDto {
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(200) title: string;
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(200) assignedTo: string;
}
export class FollowUpFieldsDto extends ActivityBaseDto {
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) scheduledAt: string;
  @IsEnum(FollowUpChannel) channel: FollowUpChannel;
}
class AttendeeDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @IsEmail() email?: string;
}
export class MeetingFieldsDto extends ActivityBaseDto {
  @IsOptional() @IsString() @MaxLength(4000) agenda?: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) startAt: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) endAt: string;
  @IsOptional() @IsIn(['Asia/Kolkata']) timezone?: string;
  @IsEnum(MeetingMode) mode: MeetingMode;
  @IsOptional() @IsString() @MaxLength(1000) location?: string;
  @IsOptional() @IsUrl({ protocols: ['https','http'], require_protocol: true }) meetingUrl?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => AttendeeDto) attendees?: AttendeeDto[];
}
export class ReminderFieldsDto {
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
  @IsDateString() @Matches(/(Z|[+-]\d{2}:\d{2})$/) remindAt: string;
  @IsOptional() @IsUUID() followUpId?: string | null;
  @IsOptional() @IsUUID() meetingId?: string | null;
}
export class CreateFollowUpDto extends IntersectionType(FollowUpFieldsDto, CreateRequestDto) {}
export class UpdateFollowUpDto extends IntersectionType(PartialType(FollowUpFieldsDto, { skipNullProperties: false }), VersionDto) {}
export class CreateMeetingDto extends IntersectionType(MeetingFieldsDto, CreateRequestDto) {}
export class UpdateMeetingDto extends IntersectionType(PartialType(MeetingFieldsDto, { skipNullProperties: false }), VersionDto) {}
export class CreateReminderDto extends IntersectionType(ReminderFieldsDto, CreateRequestDto) {}
export class UpdateReminderDto extends IntersectionType(PartialType(ReminderFieldsDto, { skipNullProperties: false }), VersionDto) {}
