import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from '../../presentation/controllers/services.controller';
import { ServicesService } from './services.service';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { ServiceRepository } from '../../infrastructure/repositories/service.repository';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { AuthModule } from '../auth/auth.module';
import { ServiceCategoriesModule } from '../service-categories/service-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceEntity]),
    AuthModule,
    ServiceCategoriesModule,
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    { provide: ServiceRepositoryPort, useClass: ServiceRepository },
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
