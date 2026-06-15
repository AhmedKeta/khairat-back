import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class LocalizedTextDto {
  @ApiProperty()
  @IsString()
  ar: string;

  @ApiProperty()
  @IsString()
  en: string;
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class CreateServiceMarkDto {
  @ApiProperty({ example: { ar: 'الأكثر مبيعاً', en: 'Best seller' } })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name: LocalizedTextDto;

  @ApiProperty({ example: 'best-seller' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiProperty({ example: '#16a34a' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'backgroundColor must be a hex color (#RRGGBB)' })
  backgroundColor: string;

  @ApiProperty({ example: '#ffffff' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'textColor must be a hex color (#RRGGBB)' })
  textColor: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: false,
    description:
      'When true, services assigned this mark stay visible but cannot be purchased.',
  })
  @IsOptional()
  @IsBoolean()
  makesUnavailable?: boolean;
}
