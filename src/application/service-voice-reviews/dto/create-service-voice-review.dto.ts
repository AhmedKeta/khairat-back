import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { STORED_AUDIO_PATH } from '../../upload/upload-path.util';

export class CreateServiceVoiceReviewDto {
  @ApiProperty()
  @IsString()
  reviewerName: string;

  @ApiProperty({ example: '/uploads/audio/uuid.mp3' })
  @IsString()
  @Matches(STORED_AUDIO_PATH, {
    message: 'audioUrl must be a stored upload path under /uploads/audio/',
  })
  audioUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcriptAr?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
