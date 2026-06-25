import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_ABOUT_STATS } from '../../../application/site-settings/about-stats.defaults';

export class AddAboutStatsSiteSettings1747200000000 implements MigrationInterface {
  name = 'AddAboutStatsSiteSettings1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('about_stats', $1, now())
      ON CONFLICT ("key") DO NOTHING
    `,
      [JSON.stringify(DEFAULT_ABOUT_STATS)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" = 'about_stats'`,
    );
  }
}
