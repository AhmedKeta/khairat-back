import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHalfPaymentPlan1747800000000 implements MigrationInterface {
  name = 'AddHalfPaymentPlan1747800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "orders_status_enum" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `ALTER TYPE "orders_status_enum" ADD VALUE IF NOT EXISTS 'PENDING_SECOND_PAYMENT'`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_plan" varchar(16) NOT NULL DEFAULT 'FULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "amount_paid" numeric(10,2) NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "installment_number" integer NOT NULL DEFAULT 1`,
    );

    // Drop OneToOne unique constraint on payments.order_id so an order can
    // have multiple installment payment rows.
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'payments'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = 'order_id'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "payments" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);

    // Also drop any unique index on payments.order_id (TypeORM sometimes uses indexes).
    await queryRunner.query(`
      DO $$
      DECLARE
        idx_name text;
      BEGIN
        SELECT i.relname INTO idx_name
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
          AND t.relname = 'payments'
          AND a.attname = 'order_id'
          AND ix.indisunique = true
          AND NOT ix.indisprimary
          AND array_length(ix.indkey, 1) = 1
        LIMIT 1;

        IF idx_name IS NOT NULL THEN
          EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payments_order_installment" ON "payments" ("order_id", "installment_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_payments_order_installment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN IF EXISTS "installment_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "amount_paid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_plan"`,
    );
    // PostgreSQL does not support removing enum values.
  }
}
