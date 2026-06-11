import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappSupportNumber1746600000000 implements MigrationInterface {
  name = 'AddWhatsappSupportNumber1746600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const envNumber2 =
      process.env.SITE_WHATSAPP_NUMBER_2?.trim() ||
      process.env.SITE_WHATSAPP_SUPPORT_NUMBER?.trim() ||
      null;

    const number1Rows = await queryRunner.query(
      `SELECT "value" FROM "site_settings" WHERE "key" IN ('whatsapp_number_1', 'whatsapp_number') LIMIT 1`,
    );
    const number1 =
      (number1Rows?.[0]?.value as string | undefined)?.trim() ||
      process.env.SITE_WHATSAPP_NUMBER_1?.trim() ||
      process.env.SITE_WHATSAPP_NUMBER?.trim() ||
      '+966500000000';

    const number2 = envNumber2 || number1;

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('whatsapp_number_2', $1, now())
      ON CONFLICT ("key") DO NOTHING
    `,
      [number2],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" = 'whatsapp_number_2'`,
    );
  }
}
