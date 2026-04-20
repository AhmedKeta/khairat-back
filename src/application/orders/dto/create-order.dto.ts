import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Marketing visit id from POST /tracking/visit (ties order to traffic)',
  })
  @IsOptional()
  @IsUUID()
  trackingVisitId?: string;
}
