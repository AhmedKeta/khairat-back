import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed Al-Rashidi' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+966501234567' })
  @IsString()
  whatsappNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms' })
  terms: boolean;

  @ApiPropertyOptional({ description: 'Guest id from website localStorage' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guestId?: string;

  @ApiPropertyOptional({ description: 'Latest tracking visit UUID' })
  @IsOptional()
  @IsUUID()
  trackingVisitId?: string;
}
