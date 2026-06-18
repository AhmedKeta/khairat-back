import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceMarkMakesUnavailable1746900000000
  implements MigrationInterface
{
  name = 'AddServiceMarkMakesUnavailable1746900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_marks" ADD COLUMN IF NOT EXISTS "makes_unavailable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "service_marks" SET "makes_unavailable" = true WHERE "slug" = 'unavailable'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_marks" DROP COLUMN IF EXISTS "makes_unavailable"`,
    );
  }
}
