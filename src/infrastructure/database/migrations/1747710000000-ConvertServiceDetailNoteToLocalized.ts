import { MigrationInterface, QueryRunner } from 'typeorm';

/** Converts legacy varchar detail_note to bilingual jsonb. */
export class ConvertServiceDetailNoteToLocalized1747710000000
  implements MigrationInterface
{
  name = 'ConvertServiceDetailNoteToLocalized1747710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'services'
            AND column_name = 'detail_note'
            AND udt_name = 'varchar'
        ) THEN
          ALTER TABLE "services"
            ALTER COLUMN "detail_note" TYPE jsonb
            USING CASE
              WHEN "detail_note" IS NULL OR btrim("detail_note") = '' THEN NULL
              ELSE jsonb_build_object('en', "detail_note", 'ar', "detail_note")
            END;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
        ALTER COLUMN "detail_note" TYPE varchar(250)
        USING CASE
          WHEN "detail_note" IS NULL THEN NULL
          ELSE COALESCE("detail_note"->>'en', "detail_note"->>'ar')
        END
    `);
  }
}
