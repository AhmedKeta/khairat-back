import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryEntity } from '../../infrastructure/database/entities/country.entity';
import { SEED_COUNTRIES } from '../../infrastructure/database/seeds/data/countries.seed-data';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly repo: Repository<CountryEntity>,
  ) {}

  async findAll() {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async seed() {
    for (const country of SEED_COUNTRIES) {
      const exists = await this.repo.findOne({ where: { code: country.code } });
      if (!exists) {
        await this.repo.save(this.repo.create(country));
      }
    }

    return { message: 'Countries seeded successfully' };
  }
}
