import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Guest id from website localStorage (links all visits)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guestId?: string;

  @ApiPropertyOptional({ description: 'Latest tracking visit UUID from POST /tracking/visit' })
  @IsOptional()
  @IsUUID()
  trackingVisitId?: string;
}
