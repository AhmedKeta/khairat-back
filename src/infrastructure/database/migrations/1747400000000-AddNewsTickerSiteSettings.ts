import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewsTickerSiteSettings1747400000000 implements MigrationInterface {
  name = 'AddNewsTickerSiteSettings1747400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('news_ticker_enabled', 'false', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('news_ticker_text_en', '', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('news_ticker_text_ar', '', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" IN ('news_ticker_enabled', 'news_ticker_text_en', 'news_ticker_text_ar')`,
    );
  }
}
