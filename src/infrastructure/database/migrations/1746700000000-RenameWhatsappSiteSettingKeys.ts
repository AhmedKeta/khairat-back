import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameWhatsappSiteSettingKeys1746700000000 implements MigrationInterface {
  name = 'RenameWhatsappSiteSettingKeys1746700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "site_settings"
      SET "key" = 'whatsapp_number_1'
      WHERE "key" = 'whatsapp_number'
        AND NOT EXISTS (
          SELECT 1 FROM "site_settings" WHERE "key" = 'whatsapp_number_1'
        )
    `);

    await queryRunner.query(`
      UPDATE "site_settings"
      SET "key" = 'whatsapp_number_2'
      WHERE "key" = 'whatsapp_support_number'
        AND NOT EXISTS (
          SELECT 1 FROM "site_settings" WHERE "key" = 'whatsapp_number_2'
        )
    `);

    const number1Rows = await queryRunner.query(
      `SELECT "value" FROM "site_settings" WHERE "key" = 'whatsapp_number_1' LIMIT 1`,
    );
    const number1 =
      (number1Rows?.[0]?.value as string | undefined)?.trim() ||
      process.env.SITE_WHATSAPP_NUMBER_1?.trim() ||
      process.env.SITE_WHATSAPP_NUMBER?.trim() ||
      '+966500000000';

    const envNumber2 =
      process.env.SITE_WHATSAPP_NUMBER_2?.trim() ||
      process.env.SITE_WHATSAPP_SUPPORT_NUMBER?.trim() ||
      number1;

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('whatsapp_number_2', $1, now())
      ON CONFLICT ("key") DO NOTHING
    `,
      [envNumber2],
    );

    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" IN ('whatsapp_number', 'whatsapp_support_number')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "site_settings"
      SET "key" = 'whatsapp_number'
      WHERE "key" = 'whatsapp_number_1'
        AND NOT EXISTS (
          SELECT 1 FROM "site_settings" WHERE "key" = 'whatsapp_number'
        )
    `);

    await queryRunner.query(`
      UPDATE "site_settings"
      SET "key" = 'whatsapp_support_number'
      WHERE "key" = 'whatsapp_number_2'
        AND NOT EXISTS (
          SELECT 1 FROM "site_settings" WHERE "key" = 'whatsapp_support_number'
        )
    `);
  }
}
