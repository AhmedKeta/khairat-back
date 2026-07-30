import { DataSource } from 'typeorm';
import { OrderEntity } from '../../entities/order.entity';
import { PaymentEntity } from '../../entities/payment.entity';
import { OrderStatus } from '../../../../domain/order/value-objects/order-status.enum';
import { PaymentStatus } from '../../../../domain/payment/value-objects/payment-status.enum';
import { SEED_ORDER_NOTE_PREFIX } from '../data/seed-tags';

function mapOrderStatusToPaymentStatus(orderStatus: OrderStatus): PaymentStatus {
  if (orderStatus === OrderStatus.PAID) {
    return PaymentStatus.SUCCESS;
  }
  if (orderStatus === OrderStatus.FAILED || orderStatus === OrderStatus.CANCELLED) {
    return PaymentStatus.FAILED;
  }
  return PaymentStatus.INITIATED;
}

export async function seedPayments(ds: DataSource): Promise<void> {
  const orderRepo = ds.getRepository(OrderEntity);
  const paymentRepo = ds.getRepository(PaymentEntity);

  const orders = await orderRepo
    .createQueryBuilder('o')
    .where('o.notes LIKE :prefix', { prefix: `${SEED_ORDER_NOTE_PREFIX}%` })
    .orderBy('o.notes', 'ASC')
    .getMany();
  if (orders.length === 0) {
    return;
  }

  for (const order of orders) {
    const paymentStatus = mapOrderStatusToPaymentStatus(order.status);
    const transactionId = `seed-payment-${order.id.slice(0, 8)}`;
    const webhookReceivedAt = paymentStatus === PaymentStatus.INITIATED ? null : new Date();
    const gatewayUrl =
      paymentStatus === PaymentStatus.INITIATED ? `https://pay.local/checkout/${order.id}` : null;
    await paymentRepo.upsert(
      {
        orderId: order.id,
        installmentNumber: 1,
        provider: 'Polar',
        transactionId,
        amount: Number(order.total),
        currency: 'USD',
        status: paymentStatus,
        gatewayUrl,
        responsePayload: { source: 'seed', orderStatus: order.status } as any,
        webhookReceivedAt,
      },
      ['orderId', 'installmentNumber'],
    );

    const payment = await paymentRepo.findOne({ where: { orderId: order.id }, select: ['id'] });
    if (payment) {
      await orderRepo.update(order.id, { paymentId: payment.id });
    }
  }
}
