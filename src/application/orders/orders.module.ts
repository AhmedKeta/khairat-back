import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from '../../presentation/controllers/orders.controller';
import { OrdersService } from './orders.service';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { ServiceRepository } from '../../infrastructure/repositories/service.repository';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, ServiceEntity]),
    AuthModule,
    TrackingModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: OrderRepositoryPort, useClass: OrderRepository },
    { provide: ServiceRepositoryPort, useClass: ServiceRepository },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
