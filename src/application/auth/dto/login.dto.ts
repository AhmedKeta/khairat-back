import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com or +966501234567' })
  @IsString()
  @MinLength(3)
  identifier: string;

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
