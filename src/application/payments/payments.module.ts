import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from '../../presentation/controllers/payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { PaymentGatewayPort } from '../../domain/payment/ports/payment-gateway.port';
import { EasyKashAdapter } from '../../infrastructure/external/easykash.adapter';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, OrderEntity]),
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentRepositoryPort, useClass: PaymentRepository },
    { provide: OrderRepositoryPort, useClass: OrderRepository },
    { provide: PaymentGatewayPort, useClass: EasyKashAdapter },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
