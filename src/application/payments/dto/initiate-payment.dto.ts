import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OrderPaymentPlan } from '../../../domain/order/value-objects/order-payment-plan.enum';

export class InitiatePaymentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ enum: ['en', 'ar'] })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @ApiPropertyOptional({ enum: OrderPaymentPlan })
  @IsOptional()
  @IsEnum(OrderPaymentPlan)
  paymentPlan?: OrderPaymentPlan;
}
