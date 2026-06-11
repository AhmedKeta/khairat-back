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

function HasUsdEntryWhenNonEmpty(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'hasUsdEntryWhenNonEmpty',
      target: object.constructor,
      propertyName,
      options: {
        message: `sharePrices must include an entry for ${POLAR_DEFAULT_CURRENCY} when provided`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!Array.isArray(value) || value.length === 0) return true;
          return value.some(
            (p: any) =>
              typeof p === 'object' &&
              p !== null &&
              String(p.currency).toUpperCase() === POLAR_DEFAULT_CURRENCY,
          );
        },
        defaultMessage(_args: ValidationArguments) {
          return `sharePrices must include an entry for ${POLAR_DEFAULT_CURRENCY} when provided`;
        },
      },
    });
  };
}

export class CreateServiceDto {
  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

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
    type: [ServicePriceDto],
    example: [{ currency: 'USD', amount: 25 }],
    description:
      'Optional per-share prices. When omitted or empty, customers can only buy the full service.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceDto)
  @HasUsdEntryWhenNonEmpty()
  sharePrices?: ServicePriceDto[];

  @ApiPropertyOptional({
    example: { ar: 'تفاصيل الحصة', en: 'What this share covers' },
    description:
      'Optional bilingual rich-text explaining what a share purchase includes.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  shareDescription?: LocalizedTextDto;

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
  @IsUUID('4', { each: true })
  markIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  videos?: string[];
}
