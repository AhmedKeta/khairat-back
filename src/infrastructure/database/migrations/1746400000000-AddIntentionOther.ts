import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIntentionOther1746400000000 implements MigrationInterface {
  name = 'AddIntentionOther1746400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "intention_other" varchar(250) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "intention_other"`,
    );
  }
}
