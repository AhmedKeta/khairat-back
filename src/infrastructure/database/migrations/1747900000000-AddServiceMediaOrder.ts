import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceMediaOrder1747900000000 implements MigrationInterface {
  name = 'AddServiceMediaOrder1747900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "media_order" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `UPDATE "services" SET "media_order" = coalesce("images", '{}') || coalesce("videos", '{}') WHERE "media_order" = '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "media_order"`,
    );
  }
}
