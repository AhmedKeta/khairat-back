import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceVoiceReviews1747000000000 implements MigrationInterface {
  name = 'AddServiceVoiceReviews1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_voice_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "service_id" uuid NOT NULL,
        "reviewer_name" character varying NOT NULL,
        "audio_url" text NOT NULL,
        "transcript" text,
        "transcript_ar" text,
        "rating" integer NOT NULL DEFAULT 5,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_visible" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_voice_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_voice_reviews_service"
          FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_service_voice_reviews_service_id" ON "service_voice_reviews" ("service_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service_voice_reviews"`);
  }
}
