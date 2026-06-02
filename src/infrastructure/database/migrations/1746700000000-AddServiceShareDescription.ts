import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional bilingual rich-text description explaining what a share purchase covers.
 */
export class AddServiceShareDescription1746700000000
  implements MigrationInterface
{
  name = 'AddServiceShareDescription1746700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "share_description" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "share_description"`,
    );
  }
}
