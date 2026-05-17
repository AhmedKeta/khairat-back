import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_CATEGORIES = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'qurbani',
    nameEn: 'Qurbani & Udhiyah',
    nameAr: 'أضاحي و أضحية',
    displayOrder: 0,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'feeding',
    nameEn: 'Food & Feeding',
    nameAr: 'إطعام',
    displayOrder: 1,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'zakat',
    nameEn: 'Zakat',
    nameAr: 'زكاة',
    displayOrder: 2,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'guidance',
    nameEn: 'Guidance & Consultation',
    nameAr: 'إرشاد واستشارات',
    displayOrder: 3,
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'general',
    nameEn: 'General',
    nameAr: 'عام',
    displayOrder: 4,
  },
] as const;

const GENERAL_CATEGORY_ID = 'a1000000-0000-4000-8000-000000000005';

export class AddServiceCategories1746200000000 implements MigrationInterface {
  name = 'AddServiceCategories1746200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" jsonb NOT NULL,
        "slug" character varying NOT NULL,
        "description" jsonb,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_categories_slug" UNIQUE ("slug")
      )
    `);

    for (const cat of DEFAULT_CATEGORIES) {
      const nameJson = JSON.stringify({ en: cat.nameEn, ar: cat.nameAr });
      await queryRunner.query(
        `INSERT INTO "service_categories" ("id", "name", "slug", "display_order", "is_active")
         VALUES ($1, $2::jsonb, $3, $4, true)
         ON CONFLICT ("slug") DO NOTHING`,
        [cat.id, nameJson, cat.slug, cat.displayOrder],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "category_id" uuid`,
    );

    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "FK_services_category_id"
      FOREIGN KEY ("category_id") REFERENCES "service_categories"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `UPDATE "services"
       SET "category_id" = $1
       WHERE "category_id" IS NULL`,
      [GENERAL_CATEGORY_ID],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_services_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "category_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "service_categories"`);
  }
}
