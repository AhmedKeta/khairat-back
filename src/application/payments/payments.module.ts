import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from '../../presentation/controllers/payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { ServiceRepository } from '../../infrastructure/repositories/service.repository';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { PolarAdapter } from '../../infrastructure/external/polar.adapter';
import { PaymobAdapter } from '../../infrastructure/external/paymob.adapter';
import { PaymentGatewayRouter } from './payment-gateway.router';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, OrderEntity, ServiceEntity]),
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentRepositoryPort, useClass: PaymentRepository },
    { provide: OrderRepositoryPort, useClass: OrderRepository },
    { provide: ServiceRepositoryPort, useClass: ServiceRepository },
    PolarAdapter,
    PaymobAdapter,
    PaymentGatewayRouter,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
