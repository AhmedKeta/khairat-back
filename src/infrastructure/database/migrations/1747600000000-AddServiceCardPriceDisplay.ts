import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Controls which price is shown on service listing cards:
 *   FULL  — full service price (default)
 *   SHARE — share price (falls back to FULL when share_prices is empty)
 */
export class AddServiceCardPriceDisplay1747600000000
  implements MigrationInterface
{
  name = 'AddServiceCardPriceDisplay1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "card_price_display" varchar NOT NULL DEFAULT 'FULL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "card_price_display"`,
    );
  }
}
