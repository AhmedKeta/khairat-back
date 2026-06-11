import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteSettings1746500000000 implements MigrationInterface {
  name = 'AddSiteSettings1746500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "key" varchar(64) NOT NULL,
        "value" text NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_settings_key" PRIMARY KEY ("key")
      )
    `);

    const defaultNumber =
      process.env.SITE_WHATSAPP_NUMBER?.trim() || '+966500000000';

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('whatsapp_number_1', $1, now())
      ON CONFLICT ("key") DO NOTHING
    `,
      [defaultNumber],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_settings"`);
  }
}
