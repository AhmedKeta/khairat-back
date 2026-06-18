import { PartialType } from '@nestjs/swagger';
import { CreateServiceVoiceReviewDto } from './create-service-voice-review.dto';

export class UpdateServiceVoiceReviewDto extends PartialType(
  CreateServiceVoiceReviewDto,
) {}
