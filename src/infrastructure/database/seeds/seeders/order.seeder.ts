import { DataSource } from 'typeorm';
import { OrderEntity } from '../../entities/order.entity';
import { UserEntity } from '../../entities/user.entity';
import { ServiceEntity } from '../../entities/service.entity';
import { OrderStatus } from '../../../../domain/order/value-objects/order-status.enum';
import { SEED_ORDER_NOTE_PREFIX, buildSeedOrderNote } from '../data/seed-tags';

const TARGET_ORDER_ROWS = 92;

function pickStatus(index: number): OrderStatus {
  if (index % 5 === 0) {
    return OrderStatus.FAILED;
  }
  if (index % 2 === 0) {
    return OrderStatus.PAID;
  }
  return OrderStatus.PENDING;
}

export async function seedOrders(ds: DataSource): Promise<void> {
  const orderRepo = ds.getRepository(OrderEntity);
  const userRepo = ds.getRepository(UserEntity);
  const serviceRepo = ds.getRepository(ServiceEntity);

  const users = await userRepo.find({ select: ['id'] });
  const services = await serviceRepo.find({ select: ['id', 'price'] });
  if (users.length === 0 || services.length === 0) {
    return;
  }

  const existingSeedNotesRows = await orderRepo
    .createQueryBuilder('o')
    .select('o.notes', 'notes')
    .where('o.notes LIKE :prefix', { prefix: `${SEED_ORDER_NOTE_PREFIX}%` })
    .getRawMany<{ notes: string }>();
  const existingSeedNotes = new Set(existingSeedNotesRows.map((row) => row.notes));

  const newOrders: OrderEntity[] = [];
  for (let i = 1; i <= TARGET_ORDER_ROWS; i++) {
    const note = buildSeedOrderNote(i);
    if (existingSeedNotes.has(note)) {
      continue;
    }
    const user = users[(i - 1) % users.length];
    const service = services[(i - 1) % services.length];
    const quantity = (i % 3) + 1;
    const unitPrice = Number(service.price);
    const subtotal = Number((unitPrice * quantity).toFixed(2));
    const status = pickStatus(i);
    newOrders.push(
      orderRepo.create({
        userId: user.id,
        serviceId: service.id,
        quantity,
        unitPrice,
        subtotal,
        total: subtotal,
        status,
        notes: note,
      }),
    );
  }

  if (newOrders.length > 0) {
    await orderRepo.save(newOrders);
  }
}
