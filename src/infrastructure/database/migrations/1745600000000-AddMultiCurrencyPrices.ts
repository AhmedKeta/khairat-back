import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Multi-currency support:
 *   1) Add `services.prices` jsonb column storing [{currency, amount}, ...].
 *      Backfill every existing row with a one-entry array derived from the
 *      legacy `price` + `currency` columns so the application always has at
 *      least one valid price to pick.
 *   2) Add `orders.currency` varchar column (default 'USD') so each order
 *      persists the currency it was priced/charged in.
 *
 * Safe to re-run: all DDL uses IF [NOT] EXISTS; the backfill UPDATE is
 * scoped to empty prices arrays only.
 */
export class AddMultiCurrencyPrices1745600000000 implements MigrationInterface {
  name = 'AddMultiCurrencyPrices1745600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "prices" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );

    await queryRunner.query(
      `UPDATE "services"
         SET "prices" = jsonb_build_array(
           jsonb_build_object(
             'currency', UPPER(COALESCE("currency", 'USD')),
             'amount', ("price")::float
           )
         )
       WHERE "prices" = '[]'::jsonb`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "currency" varchar NOT NULL DEFAULT 'USD'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "prices"`,
    );
  }
}
