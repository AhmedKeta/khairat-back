import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { CountriesService } from '../countries/countries.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly countriesService: CountriesService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('ENABLE_DATABASE_SEED') === 'true';
  }

  async run(): Promise<{
    message: string;
    countries: { message: string };
    admin: { email: string; created: boolean; updated: boolean };
  }> {
    if (!this.isEnabled()) {
      throw new ForbiddenException(
        'Database seed is disabled. Set ENABLE_DATABASE_SEED=true in your environment to run.',
      );
    }

    const countriesResult = await this.countriesService.seed();
    const adminResult = await this.seedAdminUser();

    this.logger.log(`Database seed completed (admin: ${adminResult.email})`);

    return {
      message: 'Database seed completed successfully',
      countries: countriesResult,
      admin: adminResult,
    };
  }

  private async seedAdminUser(): Promise<{
    email: string;
    created: boolean;
    updated: boolean;
  }> {
    const email = this.config.get<string>('ADMIN_SEED_EMAIL', 'admin@khairat.local');
    const password = this.config.get<string>('ADMIN_SEED_PASSWORD', 'ChangeMe123!');
    const fullName = this.config.get<string>('ADMIN_SEED_NAME', 'Khairat Admin');
    const whatsappNumber = this.config.get<string>(
      'ADMIN_SEED_WHATSAPP',
      '+966500000000',
    );

    const passwordHash = await bcrypt.hash(password, 12);

    let user = await this.usersRepo.findOne({ where: { email } });
    let created = false;
    let updated = false;

    if (!user) {
      await this.usersRepo.save(
        this.usersRepo.create({
          fullName,
          email,
          password: passwordHash,
          whatsappNumber,
          countryId: null,
          role: UserRole.ADMIN,
          isVerified: true,
          isBlocked: false,
        }),
      );
      created = true;
    } else {
      user.fullName = fullName;
      user.password = passwordHash;
      user.whatsappNumber = whatsappNumber;
      user.role = UserRole.ADMIN;
      user.isVerified = true;
      user.isBlocked = false;
      await this.usersRepo.save(user);
      updated = true;
    }

    return { email, created, updated };
  }
}
