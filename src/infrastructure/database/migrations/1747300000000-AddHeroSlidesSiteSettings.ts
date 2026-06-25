import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_HERO_SLIDES } from '../../../application/site-settings/hero-slides.defaults';

export class AddHeroSlidesSiteSettings1747300000000 implements MigrationInterface {
  name = 'AddHeroSlidesSiteSettings1747300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('hero_slides', $1, now())
      ON CONFLICT ("key") DO NOTHING
    `,
      [JSON.stringify(DEFAULT_HERO_SLIDES)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" = 'hero_slides'`,
    );
  }
}
