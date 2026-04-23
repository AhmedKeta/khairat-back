import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema changes required by the Polar.sh migration:
 *   1) Add `services.polar_product_id` (nullable varchar) used by PolarProductSyncService.
 *   2) Set `payments.provider` default to 'Polar' (was 'EasyKash'). Existing EasyKash rows
 *      are preserved so historical payments keep their original provider name.
 *
 * Safe to run in production (synchronize is off there, per DB_SYNCHRONIZE flag).
 */
export class AddPolarProductIdAndProviderDefault1745000000000
  implements MigrationInterface
{
  name = 'AddPolarProductIdAndProviderDefault1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "polar_product_id" varchar NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'Polar'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'EasyKash'`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "polar_product_id"`,
    );
  }
}
