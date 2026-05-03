import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedTestimonials } from './seeders/testimonial.seeder';

export async function seedTestimonialsOnly(): Promise<void> {
  await seedTestimonials(AppDataSource);
}

async function main() {
  await AppDataSource.initialize();
  try {
    if (process.env.SEED_SYNC_SCHEMA === 'true') {
      console.log('Synchronizing database schema before seeding...');
      await AppDataSource.synchronize();
    }
    await seedTestimonialsOnly();
    console.log('[seed:testimonials] done');
  } finally {
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (err) {
        console.warn(
          '[seed:testimonials] connection already closed:',
          err instanceof Error ? err.message : err,
        );
      }
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[seed:testimonials] failed', err);
    process.exit(1);
  });
}
