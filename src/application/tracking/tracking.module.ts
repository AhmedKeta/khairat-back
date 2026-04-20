import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTrackingEntity } from '../../infrastructure/database/entities/user-tracking.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from '../../presentation/controllers/tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserTrackingEntity])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
