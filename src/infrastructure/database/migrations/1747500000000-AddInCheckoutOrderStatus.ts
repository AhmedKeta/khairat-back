import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInCheckoutOrderStatus1747500000000
  implements MigrationInterface
{
  name = 'AddInCheckoutOrderStatus1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "orders_status_enum" ADD VALUE IF NOT EXISTS 'IN_CHECKOUT'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values.
  }
}
