import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedCountries } from './seeders/country.seeder';
import { seedUsers } from './seeders/user.seeder';
import { seedServices } from './seeders/service.seeder';
import { seedFaqs } from './seeders/faq.seeder';
import { seedTestimonials } from './seeders/testimonial.seeder';
import { seedOurWorks } from './seeders/our-work.seeder';
import { seedOrders } from './seeders/order.seeder';
import { seedPayments } from './seeders/payment.seeder';

export async function runSeed(ds = AppDataSource): Promise<void> {
  console.log('Seeding countries...');
  await seedCountries(ds);
  console.log('Seeding users...');
  await seedUsers(ds);
  console.log('Seeding services...');
  await seedServices(ds);
  console.log('Seeding FAQs...');
  await seedFaqs(ds);
  console.log('Seeding testimonials...');
  await seedTestimonials(ds);
  console.log('Seeding our works...');
  await seedOurWorks(ds);
  console.log('Seeding orders...');
  await seedOrders(ds);
  console.log('Seeding payments...');
  await seedPayments(ds);
  console.log('Done.');
}

async function main() {
  await AppDataSource.initialize();
  try {
    await runSeed(AppDataSource);
  } finally {
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (err) {
        console.warn('Seed connection already closed:', err instanceof Error ? err.message : err);
      }
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
