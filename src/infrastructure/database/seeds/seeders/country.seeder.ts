import { DataSource } from 'typeorm';
import { CountryEntity } from '../../entities/country.entity';
import { SEED_COUNTRIES } from '../data/countries.seed-data';

export async function seedCountries(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(CountryEntity);

  for (const country of SEED_COUNTRIES) {
    const exists = await repo.findOne({ where: { code: country.code } });
    if (!exists) {
      await repo.save(repo.create(country));
    }
  }
}
