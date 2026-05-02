import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores merchant-side numeric/string refs for gateways that echo them in
 * callbacks (EasyKash Direct Pay `customerReference`) so webhooks can resolve
 * the local order even though EasyKash does not accept UUIDs in that field.
 */
export class AddPaymentGatewayCustomerReference1746000000000
  implements MigrationInterface
{
  name = 'AddPaymentGatewayCustomerReference1746000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "gateway_customer_reference" varchar(32) NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_gateway_customer_reference" ON "payments" ("gateway_customer_reference") WHERE "gateway_customer_reference" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_payments_gateway_customer_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN IF EXISTS "gateway_customer_reference"`,
    );
  }
}
