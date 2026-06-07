import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappNumberEnabledFlags1746800000000 implements MigrationInterface {
  name = 'AddWhatsappNumberEnabledFlags1746800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('whatsapp_number_1_enabled', 'true', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );

    await queryRunner.query(
      `
      INSERT INTO "site_settings" ("key", "value", "updated_at")
      VALUES ('whatsapp_number_2_enabled', 'true', now())
      ON CONFLICT ("key") DO NOTHING
    `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "site_settings" WHERE "key" IN ('whatsapp_number_1_enabled', 'whatsapp_number_2_enabled')`,
    );
  }
}
