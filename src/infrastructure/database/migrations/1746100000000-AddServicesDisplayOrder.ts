import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicesDisplayOrder1746100000000 implements MigrationInterface {
  name = 'AddServicesDisplayOrder1746100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "display_order" int NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS ord
        FROM services
      )
      UPDATE services s
      SET display_order = ranked.ord
      FROM ranked
      WHERE s.id = ranked.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "display_order"`,
    );
  }
}
