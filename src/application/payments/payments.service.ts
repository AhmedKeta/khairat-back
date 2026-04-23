import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { PaymentGatewayPort } from '../../domain/payment/ports/payment-gateway.port';
import { PaymentStatus } from '../../domain/payment/value-objects/payment-status.enum';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';

const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = new Set(['en', 'ar']);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(orderId: string, user: any, locale?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new BadRequestException('Order does not belong to user');

    const existingPayment =
      await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment?.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Order already paid');
    }

    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const backendUrl = this.configService.get(
      'BACKEND_URL',
      'http://localhost:3001',
    );
    const safeLocale =
      locale && SUPPORTED_LOCALES.has(locale) ? locale : DEFAULT_LOCALE;

    const gatewayResponse = await this.paymentGateway.initiatePayment({
      orderId: order.id,
      userId: user.id,
      serviceId: order.serviceId,
      quantity: order.quantity,
      amount: order.total,
      currency: 'USD',
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.whatsappNumber,
      returnUrl: `${frontendUrl}/${safeLocale}/payment/success?orderId=${order.id}`,
      webhookUrl: `${backendUrl}/api/v1/payments/webhook`,
    });

    /**
     * Payment–Order is modeled as @OneToOne with JoinColumn on `order_id`, so that column is UNIQUE.
     * Retrying payment (pending or failed) must UPDATE the existing row, not INSERT another.
     */
    const payment = existingPayment
      ? await this.paymentRepository.update(existingPayment.id, {
          provider: 'Polar',
          transactionId: gatewayResponse.transactionId,
          amount: order.total,
          currency: 'USD',
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
          webhookReceivedAt: null,
        })
      : await this.paymentRepository.create({
          orderId: order.id,
          provider: 'Polar',
          transactionId: gatewayResponse.transactionId,
          amount: order.total,
          currency: 'USD',
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
        });

    if (!payment) {
      throw new BadRequestException('Could not persist payment');
    }

    this.logger.log(`Payment initiated: ${payment.id} for order: ${orderId}`);

    return {
      paymentId: payment.id,
      redirectUrl: gatewayResponse.redirectUrl,
      transactionId: gatewayResponse.transactionId,
    };
  }

  /**
   * Standard Webhooks handler for Polar.sh.
   * Receives the raw request body + headers, validates the signature via the adapter,
   * then marks the matching local order PAID/FAILED using `metadata.orderId`.
   */
  async handleWebhook(
    body: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    this.logger.log('Polar webhook received');

    const event = this.paymentGateway.verifyAndParseEvent(body, headers);
    this.logger.log(`Polar event type: ${event.type}`);

    const data = event.data ?? {};
    const metadata: Record<string, any> = data.metadata ?? {};
    const orderId: string | undefined = metadata.orderId;

    if (!orderId) {
      this.logger.warn(
        `Polar event ${event.type} missing metadata.orderId; ignoring`,
      );
      return { received: true };
    }

    // Decide whether this event should transition the order.
    const outcome = this.resolveEventOutcome(event.type, data);
    if (outcome === 'IGNORE') {
      return { received: true };
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      this.logger.warn(`Payment not found for order: ${orderId}`);
      return { received: true };
    }

    if (payment.webhookReceivedAt && payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(
        `Webhook already processed for payment: ${payment.id} (SUCCESS)`,
      );
      return { received: true };
    }

    const transactionId: string | undefined =
      data.checkoutId ?? data.id ?? payment.transactionId;

    if (outcome === 'SUCCESS') {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        responsePayload: event.raw,
        webhookReceivedAt: new Date(),
      });
      await this.orderRepository.update(orderId, {
        status: OrderStatus.PAID,
        paymentId: payment.id,
      });
      this.logger.log(`Payment succeeded: ${payment.id}`);
    } else {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        responsePayload: event.raw,
        webhookReceivedAt: new Date(),
      });
      await this.orderRepository.update(orderId, {
        status: OrderStatus.FAILED,
      });
      this.logger.log(`Payment failed: ${payment.id}`);
    }

    return { received: true };
  }

  /**
   * Map a Polar event to a SUCCESS / FAILED / IGNORE outcome for the local order.
   *
   * Polar emits many events. We only act on a minimal, reliable subset:
   *  - `order.paid`, `order.created`      -> a paying order was created      (SUCCESS)
   *  - `checkout.updated` (status=succeeded|confirmed) -> checkout completed (SUCCESS)
   *  - `checkout.updated` (status=failed|expired)      -> checkout failed     (FAILED)
   * Everything else is IGNOREd so repeated webhooks are harmless.
   */
  private resolveEventOutcome(
    type: string,
    data: Record<string, any>,
  ): 'SUCCESS' | 'FAILED' | 'IGNORE' {
    if (type === 'order.paid' || type === 'order.created') {
      return 'SUCCESS';
    }

    if (type === 'checkout.updated' || type === 'checkout.created') {
      const status = String(data.status ?? '').toLowerCase();
      if (status === 'succeeded' || status === 'confirmed') return 'SUCCESS';
      if (status === 'failed' || status === 'expired') return 'FAILED';
      return 'IGNORE';
    }

    return 'IGNORE';
  }

  async findById(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
