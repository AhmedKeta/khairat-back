import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class HeroSlideDto {
  @ApiProperty({
    example: '/uploads/images/hero-slide-1.jpg',
    description: 'Uploaded image path or external URL',
  })
  @IsString()
  @MaxLength(2048)
  imageUrl: string;

  @ApiPropertyOptional({
    example: '/uploads/images/hero-slide-1-mobile.jpg',
    description: 'Optional mobile image path or URL (falls back to imageUrl)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrlMobile?: string;

  @ApiProperty({ example: 'Qurbani distribution in Africa' })
  @IsString()
  @MaxLength(200)
  altEn: string;

  @ApiProperty({ example: 'توزيع الأضاحي في أفريقيا' })
  @IsString()
  @MaxLength(200)
  altAr: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order (ascending)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
