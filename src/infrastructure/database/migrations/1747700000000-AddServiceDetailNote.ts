import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceDetailNote1747700000000 implements MigrationInterface {
  name = 'AddServiceDetailNote1747700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "detail_note" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "detail_note"`,
    );
  }
}
