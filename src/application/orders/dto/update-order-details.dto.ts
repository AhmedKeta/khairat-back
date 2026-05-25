import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  MaxLength,
  IsOptional,
  IsNotEmpty,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderIntention } from '../../../domain/order/value-objects/order-intention.enum';
import { DedicationGender } from '../../../domain/order/value-objects/dedication-gender.enum';
import { BeneficiaryStatus } from '../../../domain/order/value-objects/beneficiary-status.enum';

const STORED_IMAGE_PATH = /^\/uploads\/images\/[^/]+$/;

export class UpdateOrderDetailsDto {
  @ApiProperty({ enum: OrderIntention })
  @IsEnum(OrderIntention)
  intention: OrderIntention;

  @ApiPropertyOptional({ maxLength: 250, description: 'Required when intention is other' })
  @ValidateIf((o) => o.intention === OrderIntention.OTHER)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  intentionOther?: string;

  @ApiProperty({ type: [String], example: ['Ahmed', 'Fatima'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: string) => String(v).trim()).filter(Boolean)
      : value,
  )
  onBehalfOf: string[];

  @ApiProperty({ enum: DedicationGender })
  @IsEnum(DedicationGender)
  dedicationGender: DedicationGender;

  @ApiProperty({ enum: BeneficiaryStatus })
  @IsEnum(BeneficiaryStatus)
  beneficiaryStatus: BeneficiaryStatus;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  shortDuaa?: string;

  @ApiPropertyOptional({ example: '/uploads/images/abc.jpg' })
  @IsOptional()
  @ValidateIf((o) => o.photoUrl != null && o.photoUrl !== '')
  @IsString()
  @Matches(STORED_IMAGE_PATH, {
    message: 'photoUrl must be a stored upload path under /uploads/images/',
  })
  photoUrl?: string;
}
