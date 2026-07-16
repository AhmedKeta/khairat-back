import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksController } from '../../presentation/controllers/works.controller';
import { WorksService } from './works.service';
import { OurWorkEntity } from '../../infrastructure/database/entities/our-work.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([OurWorkEntity]), UploadModule],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
