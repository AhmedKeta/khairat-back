import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { PaymentGatewayPort } from '../../domain/payment/ports/payment-gateway.port';
import { PaymentStatus } from '../../domain/payment/value-objects/payment-status.enum';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(orderId: string, user: any) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id) throw new BadRequestException('Order does not belong to user');

    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Order already paid');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.configService.get('BACKEND_URL', 'http://localhost:3001');

    const gatewayResponse = await this.paymentGateway.initiatePayment({
      orderId: order.id,
      amount: order.total,
      currency: 'USD',
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.whatsappNumber,
      returnUrl: `${frontendUrl}/payment/status?orderId=${order.id}`,
      webhookUrl: `${backendUrl}/api/v1/payments/webhook`,
    });

    const payment = await this.paymentRepository.create({
      orderId: order.id,
      provider: 'EasyKash',
      transactionId: gatewayResponse.transactionId,
      amount: order.total,
      currency: 'USD',
      status: PaymentStatus.INITIATED,
      gatewayUrl: gatewayResponse.redirectUrl,
      responsePayload: gatewayResponse.rawResponse,
    });

    this.logger.log(`Payment initiated: ${payment.id} for order: ${orderId}`);

    return {
      paymentId: payment.id,
      redirectUrl: gatewayResponse.redirectUrl,
      transactionId: gatewayResponse.transactionId,
    };
  }

  async handleWebhook(payload: Record<string, any>, signature: string) {
    this.logger.log('EasyKash webhook received');

    const isValid = this.paymentGateway.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const { transaction_id, order_id, status } = payload;

    const payment = await this.paymentRepository.findByOrderId(order_id);
    if (!payment) {
      this.logger.warn(`Payment not found for order: ${order_id}`);
      return { received: true };
    }

    if (payment.webhookReceivedAt) {
      this.logger.log(`Webhook already processed for payment: ${payment.id}`);
      return { received: true };
    }

    if (status === 'success' || status === 'SUCCESS') {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId: transaction_id,
        responsePayload: payload,
        webhookReceivedAt: new Date(),
      });
      await this.orderRepository.update(order_id, {
        status: OrderStatus.PAID,
        paymentId: payment.id,
      });
      this.logger.log(`Payment succeeded: ${payment.id}`);
    } else {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        responsePayload: payload,
        webhookReceivedAt: new Date(),
      });
      await this.orderRepository.update(order_id, { status: OrderStatus.FAILED });
      this.logger.log(`Payment failed: ${payment.id}`);
    }

    return { received: true };
  }

  async findById(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
