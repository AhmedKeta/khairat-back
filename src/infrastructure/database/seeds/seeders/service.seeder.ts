import { DataSource } from 'typeorm';
import { ServiceEntity } from '../../entities/service.entity';

const TARGET_SERVICE_ROWS = 16;
const BASE_SERVICE_TITLES_EN = ['Zakat Guidance', 'Hajj Support', 'Islamic Will (Wasiyya)'];

// Rough reference rates used for seed data only. Admins override real
// prices per-currency from the dashboard; these just give sensible demo values.
const SEED_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.8,
  EGP: 48.5,
  SAR: 3.75,
  KWD: 0.31,
  QAR: 3.64,
  AED: 3.67,
  BHD: 0.38,
  OMR: 0.38,
};

function buildSeedPrices(usd: number): { currency: string; amount: number }[] {
  return Object.entries(SEED_RATES).map(([currency, rate]) => ({
    currency,
    amount: Number((usd * rate).toFixed(2)),
  }));
}

function buildServiceRows(): Partial<ServiceEntity>[] {
  const rows: Partial<ServiceEntity>[] = [
    {
      title: { en: 'Zakat Guidance', ar: 'إرشادات الزكاة' },
      description: {
        en: 'Personal consultation to calculate and distribute Zakat according to Islamic principles.',
        ar: 'استشارة شخصية لحساب وتوزيع الزكاة وفق المبادئ الإسلامية.',
      },
      price: 49.99,
      currency: 'USD',
      prices: buildSeedPrices(49.99),
      feedsCount: 1,
      images: [],
      videos: [],
      isActive: true,
    },
    {
      title: { en: 'Hajj Support', ar: 'دعم الحج' },
      description: {
        en: 'Step-by-step guidance and checklist for Hajj preparations.',
        ar: 'إرشادات خطوة بخطوة وقائمة تحقق للتحضير للحج.',
      },
      price: 79.0,
      currency: 'USD',
      prices: buildSeedPrices(79.0),
      feedsCount: 2,
      images: [],
      videos: [],
      isActive: true,
    },
    {
      title: { en: 'Islamic Will (Wasiyya)', ar: 'الوصية الإسلامية' },
      description: {
        en: 'Structured assistance to document your Islamic will and inheritance wishes.',
        ar: 'مساعدة منظمة لتوثيق وصيتك الإسلامية وإرثك.',
      },
      price: 120.0,
      currency: 'USD',
      prices: buildSeedPrices(120.0),
      feedsCount: null,
      images: [],
      videos: [],
      isActive: true,
    },
  ];

  for (let i = BASE_SERVICE_TITLES_EN.length + 1; i <= TARGET_SERVICE_ROWS; i++) {
    const idx = String(i).padStart(2, '0');
    const usd = 35 + i * 7;
    rows.push({
      title: { en: `Islamic Service ${idx}`, ar: `خدمة إسلامية ${idx}` },
      description: {
        en: `Seeded service package ${idx} for consultations and guidance.`,
        ar: `حزمة خدمة تجريبية رقم ${idx} للاستشارات والإرشاد.`,
      },
      price: usd,
      currency: 'USD',
      prices: buildSeedPrices(usd),
      feedsCount: i % 4 === 0 ? null : (i % 5) + 1,
      images: [],
      videos: [],
      isActive: true,
    });
  }

  return rows;
}

export async function seedServices(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(ServiceEntity);

  const rows = buildServiceRows();
  for (const row of rows) {
    const en = row.title?.en;
    if (!en) {
      continue;
    }
    const exists = await repo
      .createQueryBuilder('s')
      .where("s.title->>'en' = :en", { en })
      .getOne();
    if (!exists) {
      await repo.save(repo.create(row));
    }
  }
}
