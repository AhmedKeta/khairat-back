import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class LocalizedTextDto {
  @ApiProperty()
  @IsString()
  ar: string;

  @ApiProperty()
  @IsString()
  en: string;
}

export class CreateFaqDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  question: LocalizedTextDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  answer: LocalizedTextDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
