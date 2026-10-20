import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SaveCompanyProfileDto {
  @Transform(trim)
  @IsString()
  @Matches(/\S/, { message: 'Company Name is required.' })
  @MaxLength(200)
  companyName: string;

  @Transform(trim)
  @IsString()
  @Matches(/^(?=(?:\D*\d){4})[0-9 ()-]{4,25}$/, {
    message: 'Enter a valid company contact number.',
  })
  contactNumber: string;

  @IsString()
  @Matches(/^\+\d{1,4}$/)
  dialCode: string;

  @Transform(trim)
  @IsString()
  @MaxLength(30)
  gstNumber: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @Matches(/\S/, { message: 'Company Address is required.' })
  @MaxLength(2000)
  address: string;

  @IsString()
  @MaxLength(1500000)
  @Matches(
    /^(?:$|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$|https:\/\/[^\s]+$)/,
    { message: 'Choose a PNG, JPG, WEBP or GIF logo (maximum 1 MB).' },
  )
  logo: string;

  @Transform(trim)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  country: string;

  @Transform(trim)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  state: string;

  @Transform(trim)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  city: string;

  @Transform(trim)
  @IsString()
  @Matches(/\S/)
  @MaxLength(150)
  businessCategory: string;

  @IsString()
  @Matches(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/)
  openingTime: string;

  @IsString()
  @Matches(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/)
  closingTime: string;

  @IsBoolean()
  considerOvertime: boolean;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  themeColor: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  fontColor: string;

  @IsBoolean()
  missedFollowUpReminder: boolean;

  @IsBoolean()
  staffWhatsAppDeviceReconnect: boolean;
}
