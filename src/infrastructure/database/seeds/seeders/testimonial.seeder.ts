import { DataSource } from 'typeorm';
import { TestimonialEntity } from '../../entities/testimonial.entity';

const TARGET_TESTIMONIAL_ROWS = 24;
const COUNTRIES = ['SA', 'EG', 'PK', 'AE', 'JO', 'QA', 'KW', 'BH'];

function buildTestimonialRows(): Partial<TestimonialEntity>[] {
  const rows: Partial<TestimonialEntity>[] = [
    {
      userName: 'Ahmad Al-Rashid',
      country: 'SA',
      content: 'Clear guidance and respectful communication throughout the process.',
      contentAr: 'إرشاد واضح وتواصل محترم طوال العملية.',
      rating: 5,
      isVisible: true,
    },
    {
      userName: 'Fatima Hassan',
      country: 'EG',
      content: 'The team answered every question about Zakat with patience.',
      contentAr: 'أجاب الفريق عن كل أسئلتي عن الزكاة بصبر.',
      rating: 5,
      isVisible: true,
    },
    {
      userName: 'Omar Khan',
      country: 'PK',
      content: 'Professional service; I would recommend Khairat to my family.',
      contentAr: 'خدمة احترافية؛ أنصح بخيرات لعائلتي.',
      rating: 4,
      isVisible: true,
    },
  ];

  for (let i = rows.length + 1; i <= TARGET_TESTIMONIAL_ROWS; i++) {
    const idx = String(i).padStart(2, '0');
    rows.push({
      userName: `Seed Testimonial User ${idx}`,
      country: COUNTRIES[(i - 1) % COUNTRIES.length],
      content: `Seed testimonial ${idx}: excellent support and clear Islamic consultation details.`,
      contentAr: `شهادة تجريبية ${idx}: دعم ممتاز وتفاصيل واضحة للاستشارات الإسلامية.`,
      rating: 3 + (i % 3),
      isVisible: i % 7 !== 0,
    });
  }

  return rows;
}

export async function seedTestimonials(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(TestimonialEntity);

  const rows = buildTestimonialRows();

  for (const row of rows) {
    const exists = await repo.findOne({
      where: { userName: row.userName, content: row.content },
    });
    if (!exists) {
      await repo.save(repo.create(row));
    }
  }
}
