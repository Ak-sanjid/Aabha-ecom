import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class IdentifyDto {
  @ApiProperty({
    description: 'Email address or Bangladeshi mobile number, from the single unified input.',
    example: '01712345678',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'shopper@example.com' })
  @IsString()
  identifier!: string;

  @ApiProperty({ example: 'Shopper@2026' })
  @IsString()
  @MinLength(4)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: '01712345678', description: 'Email or mobile number' })
  @IsString()
  identifier!: string;

  @ApiProperty({ example: 'Nusrat Jahan' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'Aabha@2026' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'nusrat@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['EN', 'BN'], default: 'EN' })
  @IsOptional()
  @IsEnum(['EN', 'BN'])
  locale?: 'EN' | 'BN';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

export class RequestOtpDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ enum: ['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'PHONE_VERIFY'] })
  @IsOptional()
  @IsEnum(['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'PHONE_VERIFY'])
  purpose?: 'LOGIN' | 'REGISTER' | 'PASSWORD_RESET' | 'PHONE_VERIFY';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code!: string;

  @ApiPropertyOptional({ example: 'Nusrat Jahan' })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class GuestCheckoutAccountDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'Nusrat Jahan' })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({ example: 'nusrat@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['EN', 'BN'] })
  @IsOptional()
  @IsEnum(['EN', 'BN'])
  locale?: 'EN' | 'BN';
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'shopper@example.com' })
  @IsString()
  identifier!: string;

  @ApiPropertyOptional({ enum: ['EMAIL', 'WHATSAPP'], default: 'EMAIL' })
  @IsOptional()
  @IsEnum(['EMAIL', 'WHATSAPP'])
  channel?: 'EMAIL' | 'WHATSAPP';
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewAabha@2026' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
