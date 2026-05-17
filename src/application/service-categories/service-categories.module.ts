import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategoriesController } from '../../presentation/controllers/service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoryEntity } from '../../infrastructure/database/entities/service-category.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCategoryEntity, ServiceEntity]),
    AuthModule,
  ],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
