import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsPositive,
  IsIn,
  ArrayMinSize,
  IsUUID,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SUPPORTED_CURRENCIES,
  POLAR_DEFAULT_CURRENCY,
} from '../../../shared/constants/currencies';

class LocalizedTextDto {
  @IsString()
  ar: string;

  @IsString()
  en: string;
}

export class ServicePriceDto {
  @ApiProperty({ enum: SUPPORTED_CURRENCIES, example: 'USD' })
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES as unknown as string[])
  currency: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

function HasUsdEntry(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'hasUsdEntry',
      target: object.constructor,
      propertyName,
      options: {
        message: `prices must include an entry for ${POLAR_DEFAULT_CURRENCY}`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!Array.isArray(value)) return false;
          return value.some(
            (p: any) =>
              typeof p === 'object' &&
              p !== null &&
              String(p.currency).toUpperCase() === POLAR_DEFAULT_CURRENCY,
          );
        },
        defaultMessage(_args: ValidationArguments) {
          return `prices must include an entry for ${POLAR_DEFAULT_CURRENCY}`;
        },
      },
    });
  };
}

export class CreateServiceDto {
  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: { ar: 'أضحية', en: 'Qurbani' } })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title: LocalizedTextDto;

  @ApiProperty({ example: { ar: 'وصف الأضحية', en: 'Qurbani description' } })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description: LocalizedTextDto;

  @ApiProperty({
    type: [ServicePriceDto],
    example: [
      { currency: 'USD', amount: 100 },
      { currency: 'EUR', amount: 92 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServicePriceDto)
  @HasUsdEntry()
  prices: ServicePriceDto[];

  @ApiPropertyOptional({
    example: 299.99,
    description:
      'Legacy field. Ignored when prices[] is provided; mirrored from the USD entry.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Legacy field.' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  feedsCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  videos?: string[];
}
