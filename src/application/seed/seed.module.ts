import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from '../../presentation/controllers/seed.controller';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { CountriesModule } from '../countries/countries.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), CountriesModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
