import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AboutStatCardDto {
  @ApiProperty({
    example: 'GiSheep',
    description: 'Preset icon key (e.g. GiSheep) or uploaded image path',
  })
  @IsString()
  @MaxLength(2048)
  icon: string;

  @ApiProperty({ example: 85000 })
  @IsInt()
  @Min(0)
  @Max(999_999_999)
  value: number;

  @ApiProperty({ example: '+' })
  @IsString()
  @MaxLength(10)
  suffix: string;

  @ApiProperty({ example: 'Heads of sheep' })
  @IsString()
  @MaxLength(200)
  labelEn: string;

  @ApiProperty({ example: 'رأس من الخراف' })
  @IsString()
  @MaxLength(200)
  labelAr: string;
}
