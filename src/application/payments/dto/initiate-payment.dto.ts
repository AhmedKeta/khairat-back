import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ enum: ['en', 'ar'] })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}
