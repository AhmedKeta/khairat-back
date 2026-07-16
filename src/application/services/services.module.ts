import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from '../../presentation/controllers/services.controller';
import { ServicesService } from './services.service';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { ServiceMarkAssignmentEntity } from '../../infrastructure/database/entities/service-mark-assignment.entity';
import { ServiceVoiceReviewEntity } from '../../infrastructure/database/entities/service-voice-review.entity';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { ServiceRepository } from '../../infrastructure/repositories/service.repository';
import { ServiceVoiceReviewRepository } from '../../infrastructure/repositories/service-voice-review.repository';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { ServiceVoiceReviewRepositoryPort } from '../../domain/service-voice-review/ports/service-voice-review.repository.port';
import { AuthModule } from '../auth/auth.module';
import { ServiceCategoriesModule } from '../service-categories/service-categories.module';
import { ServiceMarksModule } from '../service-marks/service-marks.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceEntity,
      ServiceMarkAssignmentEntity,
      ServiceVoiceReviewEntity,
      OrderEntity,
    ]),
    AuthModule,
    ServiceCategoriesModule,
    ServiceMarksModule,
    UploadModule,
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    { provide: ServiceRepositoryPort, useClass: ServiceRepository },
    {
      provide: ServiceVoiceReviewRepositoryPort,
      useClass: ServiceVoiceReviewRepository,
    },
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
