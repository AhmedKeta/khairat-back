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
import { OrderPurchaseType } from '../../domain/order/value-objects/order-purchase-type.enum';
import { OrderPaymentPlan } from '../../domain/order/value-objects/order-payment-plan.enum';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { PaymentGatewayRouter } from './payment-gateway.router';
import { Order } from '../../domain/order/entities/order.entity';

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

  async initiatePayment(
    orderId: string,
    user: any,
    locale?: string,
    paymentPlan?: OrderPaymentPlan,
  ) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new BadRequestException('Order does not belong to user');

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Order cannot accept payments');
    }

    if (order.status === OrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Second payment is not due until the service is marked complete',
      );
    }

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

    const isSecondInstallment =
      order.status === OrderStatus.PENDING_SECOND_PAYMENT;

    if (
      !isSecondInstallment &&
      ![
        OrderStatus.IN_CHECKOUT,
        OrderStatus.PENDING,
        OrderStatus.FAILED,
      ].includes(order.status)
    ) {
      throw new BadRequestException(
        'Order is not eligible for payment initiation',
      );
    }

    let plan = order.paymentPlan ?? OrderPaymentPlan.FULL;
    if (!isSecondInstallment && paymentPlan) {
      if (
        paymentPlan === OrderPaymentPlan.HALF &&
        order.purchaseType === OrderPurchaseType.SHARE
      ) {
        throw new BadRequestException(
          'Half payment plan is not available for share purchases',
        );
      }
      plan = paymentPlan;
      if (order.paymentPlan !== plan) {
        await this.orderRepository.update(order.id, { paymentPlan: plan });
        order.paymentPlan = plan;
      }
    }

    const installmentNumber = isSecondInstallment ? 2 : 1;
    const amount = this.resolveInstallmentAmount(order, plan, installmentNumber);

    const existingPayment =
      await this.paymentRepository.findByOrderIdAndInstallment(
        orderId,
        installmentNumber,
      );
    if (existingPayment?.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException(
        installmentNumber === 1
          ? 'First installment already paid'
          : 'Second installment already paid',
      );
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
      amount,
      currency: orderCurrency,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.whatsappNumber,
      customerCountry: orderCountry ?? undefined,
      returnUrl: `${frontendUrl}/${safeLocale}/payment/success?orderId=${order.id}`,
      webhookUrl: `${backendUrl}/api/v1/payments/webhook/${gateway.id}`,
    });

    const refPayload =
      gatewayResponse.gatewayCustomerReference != null
        ? { gatewayCustomerReference: gatewayResponse.gatewayCustomerReference }
        : {};

    const payment = existingPayment
      ? await this.paymentRepository.update(existingPayment.id, {
          provider: gateway.id,
          transactionId: gatewayResponse.transactionId,
          amount,
          currency: orderCurrency,
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
          webhookReceivedAt: null,
          installmentNumber,
          ...refPayload,
        })
      : await this.paymentRepository.create({
          orderId: order.id,
          installmentNumber,
          provider: gateway.id,
          transactionId: gatewayResponse.transactionId,
          amount,
          currency: orderCurrency,
          status: PaymentStatus.INITIATED,
          gatewayUrl: gatewayResponse.redirectUrl,
          responsePayload: gatewayResponse.rawResponse,
          ...refPayload,
        });

    if (!payment) {
      throw new BadRequestException('Could not persist payment');
    }

    if (
      order.status === OrderStatus.IN_CHECKOUT ||
      order.status === OrderStatus.FAILED
    ) {
      await this.orderRepository.update(order.id, {
        status: OrderStatus.PENDING,
      });
    }

    this.logger.log(
      `Payment initiated via ${gateway.id}: ${payment.id} (installment ${installmentNumber}) for order: ${orderId}`,
    );

    return {
      paymentId: payment.id,
      provider: gateway.id,
      redirectUrl: gatewayResponse.redirectUrl,
      transactionId: gatewayResponse.transactionId,
      installmentNumber,
      amount,
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

    let payment =
      await this.paymentRepository.findLatestInitiatedByOrderId(orderId);
    if (!payment) {
      // Fallback: latest payment for the order (retry / race cases)
      payment = await this.paymentRepository.findByOrderId(orderId);
    }
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
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      this.logger.warn(`Order not found for webhook: ${orderId}`);
      return { received: true };
    }

    const installmentNumber = payment.installmentNumber ?? 1;

    if (event.outcome === 'SUCCESS') {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        responsePayload: event.raw,
        webhookReceivedAt: new Date(),
      });

      const amountPaid =
        Math.round(
          (Number(order.amountPaid ?? 0) + Number(payment.amount)) * 100,
        ) / 100;

      const plan = order.paymentPlan ?? OrderPaymentPlan.FULL;
      let nextStatus: OrderStatus;
      if (installmentNumber === 1 && plan === OrderPaymentPlan.HALF) {
        nextStatus = OrderStatus.IN_PROGRESS;
      } else {
        nextStatus = OrderStatus.PAID;
      }

      await this.orderRepository.update(orderId, {
        status: nextStatus,
        amountPaid,
        paymentId: payment.id,
      });
      this.logger.log(
        `Payment succeeded: ${payment.id} (installment ${installmentNumber}) → ${nextStatus}`,
      );
    } else {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        responsePayload: event.raw,
        webhookReceivedAt: new Date(),
      });

      if (installmentNumber === 2) {
        await this.orderRepository.update(orderId, {
          status: OrderStatus.PENDING_SECOND_PAYMENT,
        });
        this.logger.log(
          `Second installment failed: ${payment.id}; order back to PENDING_SECOND_PAYMENT`,
        );
      } else {
        await this.orderRepository.update(orderId, {
          status: OrderStatus.FAILED,
        });
        this.logger.log(`Payment failed: ${payment.id}`);
      }
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

  private resolveInstallmentAmount(
    order: Order,
    plan: OrderPaymentPlan,
    installmentNumber: number,
  ): number {
    const total = Number(order.total);
    if (plan === OrderPaymentPlan.FULL || installmentNumber === 1) {
      if (plan === OrderPaymentPlan.HALF) {
        return Math.round((total / 2) * 100) / 100;
      }
      return total;
    }

    const amountPaid = Number(order.amountPaid ?? 0);
    const remaining = Math.round((total - amountPaid) * 100) / 100;
    if (remaining <= 0) {
      throw new BadRequestException('No remaining balance to pay');
    }
    return remaining;
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
