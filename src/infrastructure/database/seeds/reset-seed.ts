import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { runSeed } from './run-seed';

async function resetSeed(): Promise<void> {
  await AppDataSource.initialize();
  try {
    console.log('Resetting seeded tables...');
    await AppDataSource.query(
      'TRUNCATE TABLE "payments", "orders", "our_works", "testimonials", "faqs", "services", "users" RESTART IDENTITY CASCADE',
    );
    await runSeed(AppDataSource);
  } finally {
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
      } catch (err) {
        console.warn(
          'Reset seed connection already closed:',
          err instanceof Error ? err.message : err,
        );
      }
    }
  }
}

resetSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
