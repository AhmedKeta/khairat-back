import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTestimonialsCountry1745800000000 implements MigrationInterface {
  name = 'DropTestimonialsCountry1745800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "country"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "country" varchar NULL`,
    );
  }
}
