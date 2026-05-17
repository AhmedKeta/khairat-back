export const DEFAULT_SERVICE_CATEGORIES = [
  {
    slug: 'qurbani',
    name: { en: 'Qurbani & Udhiyah', ar: 'أضاحي و أضحية' },
    displayOrder: 0,
  },
  {
    slug: 'feeding',
    name: { en: 'Food & Feeding', ar: 'إطعام' },
    displayOrder: 1,
  },
  {
    slug: 'zakat',
    name: { en: 'Zakat', ar: 'زكاة' },
    displayOrder: 2,
  },
  {
    slug: 'guidance',
    name: { en: 'Guidance & Consultation', ar: 'إرشاد واستشارات' },
    displayOrder: 3,
  },
  {
    slug: 'general',
    name: { en: 'General', ar: 'عام' },
    displayOrder: 4,
  },
] as const;

export type DefaultCategorySlug = (typeof DEFAULT_SERVICE_CATEGORIES)[number]['slug'];
