import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  Length,
} from 'class-validator';
import { SUPPORTED_CURRENCIES } from '../../../shared/constants/currencies';

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    enum: SUPPORTED_CURRENCIES,
    example: 'USD',
    description: 'Currency the customer wants to be charged in. Defaults to USD if omitted.',
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES as unknown as string[])
  currency?: string;

  @ApiPropertyOptional({
    example: 'EG',
    description:
      'ISO-3166 alpha-2 country code of the donor. Used as a fallback to route the payment to the right gateway when currency mapping is ambiguous.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

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
