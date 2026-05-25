import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Share purchase support:
 *   1) Add `services.share_prices` jsonb column for optional per-share pricing.
 *   2) Add `orders.purchase_type` varchar column (default 'FULL') to distinguish
 *      full-service orders from share orders.
 */
export class AddServiceSharePrices1746600000000 implements MigrationInterface {
  name = 'AddServiceSharePrices1746600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "share_prices" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "purchase_type" varchar NOT NULL DEFAULT 'FULL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "purchase_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "share_prices"`,
    );
  }
}
