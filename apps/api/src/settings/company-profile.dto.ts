import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SaveCompanyProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @ValidateIf((_, val) => Boolean(val))
  @Matches(/^(?=(?:\D*\d){4})[0-9 ()-]{4,25}$/, {
    message: 'Enter a valid company contact number.',
  })
  contactNumber?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_, val) => Boolean(val))
  @Matches(/^\+\d{1,4}$/)
  dialCode?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  gstNumber?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @ValidateIf((_, val) => Boolean(val))
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500000)
  @Matches(
    /^(?:$|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$|https:\/\/[^\s]+$)/,
    { message: 'Choose a PNG, JPG, WEBP or GIF logo (maximum 1 MB).' },
  )
  logo?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  businessCategory?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/)
  openingTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/)
  closingTime?: string;

  @IsOptional()
  @IsBoolean()
  considerOvertime?: boolean;

  @IsOptional()
  @IsString()
  @ValidateIf((_, val) => Boolean(val))
  @Matches(/^#[0-9a-fA-F]{6}$/)
  themeColor?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_, val) => Boolean(val))
  @Matches(/^#[0-9a-fA-F]{6}$/)
  fontColor?: string;

  @IsOptional()
  @IsBoolean()
  missedFollowUpReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  staffWhatsAppDeviceReconnect?: boolean;
}
