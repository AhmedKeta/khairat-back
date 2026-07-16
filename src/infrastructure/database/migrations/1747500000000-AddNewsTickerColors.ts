import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewsTickerColors1747500000000 implements MigrationInterface {
  name = 'AddNewsTickerColors1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('news_ticker_bg_color', '#1B5E20', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('news_ticker_text_color', '#C9A84C', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" IN ('news_ticker_bg_color', 'news_ticker_text_color')`,
    );
  }
}
