import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { CountryEntity } from '../../entities/country.entity';
import { UserRole } from '../../../../domain/user/value-objects/user-role.enum';

const TARGET_USER_ROWS = 50;

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export async function seedUsers(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(UserEntity);
  const rounds = 12;

  const sa = await ds.getRepository(CountryEntity).findOne({ where: { code: 'SA' } });
  const countryId = sa?.id ?? null;

  const adminEmail = env('SEED_ADMIN_EMAIL', 'admin@khairat.local');
  const adminPassword = env('SEED_ADMIN_PASSWORD', 'Admin123!');
  const demoEmail = env('SEED_USER_EMAIL', 'demo@khairat.local');
  const demoPassword = env('SEED_USER_PASSWORD', 'User123!');

  const rows: Array<{
    fullName: string;
    email: string;
    password: string;
    whatsappNumber: string;
    role: UserRole;
  }> = [
    {
      fullName: 'Seed Admin',
      email: adminEmail,
      password: adminPassword,
      whatsappNumber: '+966500000001',
      role: UserRole.ADMIN,
    },
    {
      fullName: 'Seed Demo User',
      email: demoEmail,
      password: demoPassword,
      whatsappNumber: '+966500000002',
      role: UserRole.USER,
    },
  ];

  for (let i = 1; i <= TARGET_USER_ROWS * 2 && rows.length < TARGET_USER_ROWS; i++) {
    const email = `seed.user${String(i).padStart(3, '0')}@khairat.local`;
    if (rows.some((row) => row.email === email)) {
      continue;
    }
    rows.push({
      fullName: `Seed User ${String(i).padStart(3, '0')}`,
      email,
      password: 'User123!',
      whatsappNumber: `+9665${String(1000000 + i).padStart(7, '0')}`,
      role: UserRole.USER,
    });
  }

  for (const row of rows) {
    await repo.upsert(
      {
        fullName: row.fullName,
        email: row.email,
        password: await bcrypt.hash(row.password, rounds),
        whatsappNumber: row.whatsappNumber,
        countryId,
        role: row.role,
        isVerified: true,
        isBlocked: false,
      },
      ['email'],
    );
  }
}
