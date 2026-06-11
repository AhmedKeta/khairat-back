import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMarksController } from '../../presentation/controllers/service-marks.controller';
import { ServiceMarksService } from './service-marks.service';
import { ServiceMarkEntity } from '../../infrastructure/database/entities/service-mark.entity';
import { ServiceMarkAssignmentEntity } from '../../infrastructure/database/entities/service-mark-assignment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceMarkEntity, ServiceMarkAssignmentEntity]),
    AuthModule,
  ],
  controllers: [ServiceMarksController],
  providers: [ServiceMarksService],
  exports: [ServiceMarksService],
})
export class ServiceMarksModule {}
