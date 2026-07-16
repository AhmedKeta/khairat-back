import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { OrderRepositoryPort } from '../../domain/order/ports/order.repository.port';
import { PaymentStatus } from '../../domain/payment/value-objects/payment-status.enum';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';
import { OrderIntention } from '../../domain/order/value-objects/order-intention.enum';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { PaymentGatewayRouter } from './payment-gateway.router';

const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = new Set(['en', 'ar']);
const AMOUNT_TOLERANCE = 0.01;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly orderRepository: OrderRepositoryPort,
    private readonly gatewayRouter: PaymentGatewayRouter,
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(orderId: string, user: any, locale?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new BadRequestException('Order does not belong to user');

    const intentionComplete =
      !!order.intention &&
      (order.intention !== OrderIntention.OTHER ||
        !!order.intentionOther?.trim());

    if (
      !intentionComplete ||
      !order.onBehalfOf?.length ||
      !order.dedicationGender ||
      !order.beneficiaryStatus
    ) {
      throw new BadRequestException('Order details are incomplete');
    }

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

    const orderCurrency = (order.currency || 'USD').toUpperCase();
    const orderCountry =
      (order as any).country ??
      (order as any).user?.countryId ??
      null;

    const gateway = this.gatewayRouter.resolve({
      currency: orderCurrency,
      country: orderCountry,
    });

    const gatewayResponse = await gateway.initiatePayment({
      orderId: order.id,
      userId: user.id,
      serviceId: order.serviceId,
      quantity: order.quantity,
      amount: order.total,
      currency: orderCurrency,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.whatsappNumber,
      customerCountry: orderCountry ?? undefined,
      returnUrl: `${frontendUrl}/${safeLocale}/payment/success?orderId=${order.id}`,
      webhookUrl: `${backendUrl}/api/v1/payments/webhook/${gateway.id}`,
    });

    /**
     * Payment–Order is modeled as @OneToOne with JoinColumn on `order_id`, so that column is UNIQUE.
     * Retrying payment (pending or failed) must UPDATE the existing row, not INSERT another.
     */
    const refPayload =
      gatewayResponse.gatewayCustomerReference != null
        ? { gatewayCustomerReference: gatewayResponse.gatewayCustomerReference }
        : {};

    const payment = existingPayment
      ? await this.paymentRepository.update(existingPayment.id, {
          provider: gateway.id,
          transactionId: gatewayResponse.transactionId,
          amount: order.total,
          currency: orderCurrency,
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
          webhookReceivedAt: null,
          ...refPayload,
        })
      : await this.paymentRepository.create({
          orderId: order.id,
          provider: gateway.id,
          transactionId: gatewayResponse.transactionId,
          amount: order.total,
          currency: orderCurrency,
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
          ...refPayload,
        });

    if (!payment) {
      throw new BadRequestException('Could not persist payment');
    }

    if (order.status === OrderStatus.IN_CHECKOUT) {
      await this.orderRepository.update(order.id, {
        status: OrderStatus.PENDING,
      });
    }

    this.logger.log(
      `Payment initiated via ${gateway.id}: ${payment.id} for order: ${orderId}`,
    );

    return {
      paymentId: payment.id,
      provider: gateway.id,
      redirectUrl: gatewayResponse.redirectUrl,
      transactionId: gatewayResponse.transactionId,
    };
  }

  /**
   * Verify and apply an inbound webhook for the given gateway. Each adapter
   * returns a normalized `ParsedWebhookEvent` so this method stays gateway-
   * agnostic — the only branching is on the `outcome` field.
   */
  async handleWebhook(
    gatewayId: string,
    body: Buffer,
    headers: Record<string, string | string[] | undefined>,
    query: Record<string, string>,
  ) {
    this.logger.log(`Webhook received for gateway: ${gatewayId}`);

    const gateway = this.gatewayRouter.byId(gatewayId);
    const event = await gateway.verifyAndParseEvent(body, headers, query);

    if (event.outcome === 'IGNORE') {
      return { received: true };
    }

    const orderId = event.orderId;
    if (!orderId) {
      this.logger.warn(
        `Webhook from ${gatewayId} missing orderId; ignoring`,
      );
      return { received: true };
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      this.logger.warn(`Payment not found for order: ${orderId}`);
      return { received: true };
    }

    if (payment.provider !== gatewayId) {
      this.logger.warn(
        `Webhook provider mismatch for payment ${payment.id}: expected ${payment.provider}, got ${gatewayId}`,
      );
      return { received: true };
    }

    if (payment.webhookReceivedAt && payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(
        `Webhook already processed for payment: ${payment.id} (SUCCESS)`,
      );
      return { received: true };
    }

    if (event.outcome === 'SUCCESS') {
      if (!this.amountMatches(payment.amount, event.amount)) {
        this.logger.warn(
          `Webhook amount mismatch for payment ${payment.id}: expected ${payment.amount}, got ${event.amount}`,
        );
        return { received: true };
      }
      if (
        event.currency &&
        String(payment.currency || '').toUpperCase() !==
          String(event.currency).toUpperCase()
      ) {
        this.logger.warn(
          `Webhook currency mismatch for payment ${payment.id}: expected ${payment.currency}, got ${event.currency}`,
        );
        return { received: true };
      }
    }

    const transactionId = event.transactionId ?? payment.transactionId;

    if (event.outcome === 'SUCCESS') {
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

  async findById(id: string, user: { id: string; role: string }) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) throw new NotFoundException('Payment not found');

    const isAdmin = user.role === UserRole.ADMIN;
    if (!isAdmin && order.userId !== user.id) {
      throw new ForbiddenException('Payment does not belong to user');
    }

    if (!isAdmin) {
      const { responsePayload: _rp, ...safe } = payment as any;
      return safe;
    }

    return payment;
  }

  private amountMatches(
    expected: number,
    reported: number | null | undefined,
  ): boolean {
    // Some gateways omit amount; provider + signature already verified.
    if (reported == null || !Number.isFinite(Number(reported))) {
      return true;
    }
    return Math.abs(Number(expected) - Number(reported)) <= AMOUNT_TOLERANCE;
  }
}
