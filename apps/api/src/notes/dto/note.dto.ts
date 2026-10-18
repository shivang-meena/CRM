import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CreateRequestDto, VersionDto } from '../../crm/crm.dto';

export class CreateNoteDto extends CreateRequestDto {
  @IsString() @MaxLength(10000) content: string;
}

export class UpdateNoteDto extends VersionDto {
  @IsString() @MaxLength(10000) content: string;
}

export class DeleteNoteDto extends VersionDto {}

export class NoteQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 10;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}
