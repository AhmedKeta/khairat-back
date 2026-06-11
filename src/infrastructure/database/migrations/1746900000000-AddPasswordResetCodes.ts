import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetCodes1746900000000 implements MigrationInterface {
  name = 'AddPasswordResetCodes1746900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "code_hash" varchar NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_codes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_codes_email"
      ON "password_reset_codes" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_codes"`);
  }
}
