import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
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
