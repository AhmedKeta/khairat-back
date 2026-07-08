import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AboutStatCardDto } from './about-stat-card.dto';
import { HeroSlideDto } from './hero-slide.dto';

const PHONE_PATTERN = /^\+?[\d\s-]+$/;

export class UpdateSiteSettingsDto {
  @ApiProperty({ example: '+966500000000', description: 'WhatsApp number 1 (Sales)' })
  @IsString()
  @MinLength(7)
  @Matches(PHONE_PATTERN, {
    message: 'whatsappNumber1 must contain only digits, spaces, dashes, and an optional leading +',
  })
  whatsappNumber1: string;

  @ApiProperty({ example: '+966500000001', description: 'WhatsApp number 2 (Support)' })
  @IsString()
  @MinLength(7)
  @Matches(PHONE_PATTERN, {
    message: 'whatsappNumber2 must contain only digits, spaces, dashes, and an optional leading +',
  })
  whatsappNumber2: string;

  @ApiProperty({ example: true, description: 'Show WhatsApp number 1 on the public site' })
  @IsBoolean()
  whatsappNumber1Enabled: boolean;

  @ApiProperty({ example: true, description: 'Show WhatsApp number 2 in the floating picker' })
  @IsBoolean()
  whatsappNumber2Enabled: boolean;

  @ApiProperty({
    example: '/uploads/videos/home-intro.mp4',
    description: 'Home page hero video URL or upload path (empty to hide)',
  })
  @IsString()
  @MaxLength(2048)
  homePageVideoUrl: string;

  @ApiProperty({ example: true, description: 'Show the home page video section' })
  @IsBoolean()
  homePageVideoEnabled: boolean;

  @ApiProperty({ example: false, description: 'Show the site-wide news ticker' })
  @IsBoolean()
  newsTickerEnabled: boolean;

  @ApiProperty({
    example: 'Eid offer: 10% off all Qurbani services this week!',
    description: 'News ticker text (English)',
  })
  @IsString()
  @MaxLength(500)
  newsTickerTextEn: string;

  @ApiProperty({
    example: 'عرض العيد: خصم 10% على جميع خدمات الأضحية هذا الأسبوع!',
    description: 'News ticker text (Arabic)',
  })
  @IsString()
  @MaxLength(500)
  newsTickerTextAr: string;

  @ApiProperty({
    type: [AboutStatCardDto],
    description: 'Who Are We section stat cards (exactly 4)',
  })
  @ValidateNested({ each: true })
  @Type(() => AboutStatCardDto)
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  aboutStats: AboutStatCardDto[];

  @ApiProperty({
    type: [HeroSlideDto],
    description: 'Home page hero carousel slides (0–8)',
  })
  @ValidateNested({ each: true })
  @Type(() => HeroSlideDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(8)
  heroSlides: HeroSlideDto[];
}
