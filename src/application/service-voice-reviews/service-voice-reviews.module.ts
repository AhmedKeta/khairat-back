import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceVoiceReviewsController } from '../../presentation/controllers/service-voice-reviews.controller';
import { ServiceVoiceReviewsService } from './service-voice-reviews.service';
import { ServiceVoiceReviewEntity } from '../../infrastructure/database/entities/service-voice-review.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { ServiceVoiceReviewRepository } from '../../infrastructure/repositories/service-voice-review.repository';
import { ServiceRepository } from '../../infrastructure/repositories/service.repository';
import { ServiceVoiceReviewRepositoryPort } from '../../domain/service-voice-review/ports/service-voice-review.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { UploadModule } from '../upload/upload.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceVoiceReviewEntity, ServiceEntity]),
    UploadModule,
    AuthModule,
  ],
  controllers: [ServiceVoiceReviewsController],
  providers: [
    ServiceVoiceReviewsService,
    {
      provide: ServiceVoiceReviewRepositoryPort,
      useClass: ServiceVoiceReviewRepository,
    },
    { provide: ServiceRepositoryPort, useClass: ServiceRepository },
  ],
  exports: [ServiceVoiceReviewsService],
})
export class ServiceVoiceReviewsModule {}
