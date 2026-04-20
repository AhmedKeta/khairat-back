import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksController } from '../../presentation/controllers/works.controller';
import { WorksService } from './works.service';
import { OurWorkEntity } from '../../infrastructure/database/entities/our-work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OurWorkEntity])],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
