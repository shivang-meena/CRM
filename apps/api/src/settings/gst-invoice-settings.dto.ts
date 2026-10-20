import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SaveGstInvoiceSettingsDto {
  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9_\/-]{0,29}$/)
  invoicePrefix: string;

  @IsInt()
  @Min(1)
  @Max(2147483646)
  invoiceStart: number;

  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  gstPercentage: number;

  @Transform(trim)
  @IsString()
  @MaxLength(150)
  bankName: string;

  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9 -]{0,40}$/)
  accountNo: string;

  @Transform(trim)
  @IsString()
  @Matches(/^(?:|[A-Za-z]{4}0[A-Za-z0-9]{6})$/, {
    message: 'Enter a valid 11-character IFSC code.',
  })
  ifscCode: string;

  @Transform(trim)
  @IsString()
  @MaxLength(150)
  @Matches(/^(?:|[A-Za-z0-9._-]+@[A-Za-z0-9.-]+)$/, {
    message: 'Enter a valid payment UPI ID.',
  })
  paymentUpiId: string;

  @IsString()
  @MaxLength(1398200)
  @Matches(
    /^(?:$|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$|https:\/\/[^\s]+$)/,
  )
  signature: string;

  @Transform(trim)
  @IsString()
  @MaxLength(10000)
  termsAndConditions: string;
}
