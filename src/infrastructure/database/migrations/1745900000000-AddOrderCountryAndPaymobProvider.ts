import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema changes required by the multi-gateway router (Polar + Paymob):
 *   1) Add `orders.country` (nullable char(2), ISO-3166 alpha-2). Used as a
 *      fallback by `PaymentGatewayRouter` when currency alone is not enough
 *      to pick a gateway.
 *   2) Lowercase the `payments.provider` default to `polar` so new rows
 *      match the adapter id (`gateway.id`). Existing rows keep their value.
 */
export class AddOrderCountryAndPaymobProvider1745900000000
  implements MigrationInterface
{
  name = 'AddOrderCountryAndPaymobProvider1745900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "country" varchar(2) NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'polar'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'Polar'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "country"`,
    );
  }
}
