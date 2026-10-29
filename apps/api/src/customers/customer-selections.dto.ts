import { ArrayUnique, IsArray, IsInt, IsUUID, Min, ValidateIf } from 'class-validator';

export class UpdateCustomerSelectionsDto {
  @IsInt() @Min(1) version: number;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) serviceIds?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) productIds?: string[];
}
