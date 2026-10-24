import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class SuperAdminLoginDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() password: string;
}

export class FeaturesDto {
  @IsOptional() @IsBoolean() lead?: boolean;
  @IsOptional() @IsBoolean() reminder?: boolean;
  @IsOptional() @IsBoolean() meeting?: boolean;
  @IsOptional() @IsBoolean() note?: boolean;
  @IsOptional() @IsBoolean() calendar?: boolean;
  @IsOptional() @IsBoolean() customer?: boolean;
  @IsOptional() @IsBoolean() invoice?: boolean;
  @IsOptional() @IsBoolean() staff?: boolean;
  @IsOptional() @IsBoolean() leave?: boolean;
}

export class CreateAdminDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,50}$/, { message: 'Login ID must be 3-50 characters: letters, numbers, dot, underscore or hyphen.' })
  loginId: string;

  @IsString() @MinLength(8) @MaxLength(100) password: string;
  @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(160) businessName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @ValidateNested() @Type(() => FeaturesDto) features?: FeaturesDto;
}

export class UpdateAdminDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(160) businessName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() email?: string;
}

export class UpdateAdminFeaturesDto {
  @ValidateNested() @Type(() => FeaturesDto) features: FeaturesDto;
}

export class UpdateAdminStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED']) status: 'ACTIVE' | 'BLOCKED';
}

export class ResetAdminPasswordDto {
  @IsString() @MinLength(8) @MaxLength(100) password: string;
}

export class ListAdminsQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['ACTIVE', 'BLOCKED']) status?: 'ACTIVE' | 'BLOCKED';
}
