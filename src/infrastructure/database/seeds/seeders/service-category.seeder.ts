import { DataSource } from 'typeorm';
import { ServiceCategoryEntity } from '../../entities/service-category.entity';
import { DEFAULT_SERVICE_CATEGORIES } from '../data/service-category-defaults';

export async function seedServiceCategories(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(ServiceCategoryEntity);

  for (const row of DEFAULT_SERVICE_CATEGORIES) {
    const exists = await repo.findOne({ where: { slug: row.slug } });
    if (!exists) {
      await repo.save(
        repo.create({
          name: row.name,
          slug: row.slug,
          displayOrder: row.displayOrder,
          isActive: true,
        }),
      );
    }
  }
}

export async function getCategoryIdBySlug(
  ds: DataSource,
  slug: string,
): Promise<string | null> {
  const repo = ds.getRepository(ServiceCategoryEntity);
  const cat = await repo.findOne({ where: { slug } });
  return cat?.id ?? null;
}
