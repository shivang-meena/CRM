import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsInt, Min } from 'class-validator';

export class UpdateLeadDto extends PartialType(CreateLeadDto, { skipNullProperties: false }) {
  @IsInt() @Min(1) version: number;
}
