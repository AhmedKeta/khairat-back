import { DataSource } from 'typeorm';
import { OurWorkEntity } from '../../entities/our-work.entity';

const SEED_ROWS: Partial<OurWorkEntity>[] = [
  {
    title: 'Umrah Service in Mecca',
    titleAr: 'خدمة العمرة في مكة',
    imageUrl:
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&auto=format&fit=crop',
    sortOrder: 0,
    isVisible: true,
  },
  {
    title: 'Qurbani Distribution',
    titleAr: 'توزيع الأضاحي',
    imageUrl:
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=1200&auto=format&fit=crop',
    sortOrder: 1,
    isVisible: true,
  },
  {
    title: 'Aqiqah Ceremony',
    titleAr: 'مراسم العقيقة',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop',
    sortOrder: 2,
    isVisible: true,
  },
  {
    title: 'Hajj Assistance Program',
    titleAr: 'برنامج مساعدة الحج',
    imageUrl:
      'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1200&auto=format&fit=crop',
    sortOrder: 3,
    isVisible: true,
  },
  {
    title: 'Community Outreach',
    titleAr: 'التواصل المجتمعي',
    imageUrl:
      'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&auto=format&fit=crop',
    sortOrder: 4,
    isVisible: true,
  },
];

export async function seedOurWorks(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(OurWorkEntity);

  for (const row of SEED_ROWS) {
    const exists = await repo.findOne({
      where: { title: row.title!, imageUrl: row.imageUrl! },
    });
    if (!exists) {
      await repo.save(repo.create(row));
    }
  }
}
