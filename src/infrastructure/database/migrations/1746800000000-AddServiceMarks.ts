import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_MARKS = [
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    slug: 'best-seller',
    nameEn: 'Best seller',
    nameAr: 'الأكثر مبيعاً',
    backgroundColor: '#16a34a',
    textColor: '#ffffff',
    displayOrder: 0,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    slug: 'unavailable',
    nameEn: 'Unavailable',
    nameAr: 'غير متاح',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    displayOrder: 1,
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    slug: 'exceptional',
    nameEn: 'Exceptional',
    nameAr: 'استثنائي',
    backgroundColor: '#d97706',
    textColor: '#ffffff',
    displayOrder: 2,
  },
] as const;

export class AddServiceMarks1746800000000 implements MigrationInterface {
  name = 'AddServiceMarks1746800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_marks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" jsonb NOT NULL,
        "slug" character varying NOT NULL,
        "background_color" character varying(7) NOT NULL,
        "text_color" character varying(7) NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_marks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_marks_slug" UNIQUE ("slug")
      )
    `);

    for (const mark of DEFAULT_MARKS) {
      const nameJson = JSON.stringify({ en: mark.nameEn, ar: mark.nameAr });
      await queryRunner.query(
        `INSERT INTO "service_marks" ("id", "name", "slug", "background_color", "text_color", "display_order", "is_active")
         VALUES ($1, $2::jsonb, $3, $4, $5, $6, true)
         ON CONFLICT ("slug") DO NOTHING`,
        [
          mark.id,
          nameJson,
          mark.slug,
          mark.backgroundColor,
          mark.textColor,
          mark.displayOrder,
        ],
      );
    }

    await queryRunner.query(`
      CREATE TABLE "service_mark_assignments" (
        "service_id" uuid NOT NULL,
        "mark_id" uuid NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_service_mark_assignments" PRIMARY KEY ("service_id", "mark_id"),
        CONSTRAINT "FK_service_mark_assignments_service_id"
          FOREIGN KEY ("service_id") REFERENCES "services"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_service_mark_assignments_mark_id"
          FOREIGN KEY ("mark_id") REFERENCES "service_marks"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service_mark_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_marks"`);
  }
}
