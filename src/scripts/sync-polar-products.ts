import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
import { AppDataSource } from '../infrastructure/database/data-source';
import { ServiceEntity } from '../infrastructure/database/entities/service.entity';
import { Polar } from '@polar-sh/sdk';

config({ path: resolve(__dirname, '../../.env') });

/**
 * One-off backfill: walk every row in `services` and make sure it has a
 * matching Polar Product. Run after switching to Polar so that existing
 * services (that were created before the adapter landed) get a product id.
 *
 *   npm run sync:polar
 *
 * Safe to re-run; idempotent. Services that already have polar_product_id
 * are updated in place; services without one get a fresh product.
 */
async function main() {
  const server = (process.env.POLAR_SERVER ?? 'sandbox') as
    | 'sandbox'
    | 'production';
  const accessToken = process.env.POLAR_ACCESS_TOKEN ?? '';
  const organizationId = process.env.POLAR_ORGANIZATION_ID;

  if (!accessToken || !organizationId) {
    console.error(
      'Missing POLAR_ACCESS_TOKEN or POLAR_ORGANIZATION_ID. Set them in backend/.env and retry.',
    );
    process.exit(1);
  }

  const polar = new Polar({ server, accessToken });

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ServiceEntity);

  try {
    const services = await repo.find();
    console.log(
      `Syncing ${services.length} service(s) to Polar (${server})...`,
    );

    for (const service of services) {
      const name =
        (service.title?.en || service.title?.ar) || `Service ${service.id}`;
      const description = [service.description?.en, service.description?.ar]
        .filter(Boolean)
        .join('\n\n');
      const currency = (service.currency || 'USD').toLowerCase();
      const priceAmount = Math.round(Number(service.price) * 100);

      try {
        if (!service.polarProductId) {
          const created: any = await polar.products.create({
            organizationId,
            name,
            description: description || undefined,
            recurringInterval: null,
            prices: [
              {
                amountType: 'fixed',
                priceAmount,
                priceCurrency: currency,
              },
            ],
          } as any);
          service.polarProductId = created?.id ?? null;
          await repo.save(service);
          console.log(`  + created ${created?.id} for service ${service.id}`);
        } else {
          await polar.products.update({
            id: service.polarProductId,
            productUpdate: {
              name,
              description: description || undefined,
            },
          } as any);
          console.log(
            `  = updated ${service.polarProductId} for service ${service.id}`,
          );
        }
      } catch (err: any) {
        console.error(
          `  ! failed for service ${service.id}: ${err?.message ?? err}`,
        );
      }
    }

    console.log('Done.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
