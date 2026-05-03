import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { UserEntity } from "../entities/user.entity";
import { UserRole } from "../../../domain/user/value-objects/user-role.enum";

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.trim().length > 0) return v;
  return fallback ?? "";
}

function getAdminSeedConfig() {
  return {
    email: env("ADMIN_SEED_EMAIL", env("SEED_ADMIN_EMAIL", "admin@khairat.local")),
    password: env("ADMIN_SEED_PASSWORD", env("SEED_ADMIN_PASSWORD", "ChangeMe123!")),
    fullName: env("ADMIN_SEED_NAME", "Khairat Admin"),
    whatsappNumber: env("ADMIN_SEED_WHATSAPP", "+966500000000"),
  };
}

export async function seedAdminOnly(): Promise<{
  email: string;
  created: boolean;
  updated: boolean;
}> {
  const usersRepo = AppDataSource.getRepository(UserEntity);
  const cfg = getAdminSeedConfig();
  const passwordHash = await bcrypt.hash(cfg.password, 12);

  const existing = await usersRepo.findOne({ where: { email: cfg.email } });
  if (!existing) {
    await usersRepo.save(
      usersRepo.create({
        fullName: cfg.fullName,
        email: cfg.email,
        password: passwordHash,
        whatsappNumber: cfg.whatsappNumber,
        countryId: null,
        role: UserRole.ADMIN,
        isVerified: true,
        isBlocked: false,
      }),
    );
    return { email: cfg.email, created: true, updated: false };
  }

  existing.fullName = cfg.fullName;
  existing.password = passwordHash;
  existing.whatsappNumber = cfg.whatsappNumber;
  existing.role = UserRole.ADMIN;
  existing.isVerified = true;
  existing.isBlocked = false;
  await usersRepo.save(existing);
  return { email: cfg.email, created: false, updated: true };
}

async function main() {
  await AppDataSource.initialize();
  try {
    const result = await seedAdminOnly();
    console.log(
      `[seed:admin] done email=${result.email} created=${result.created} updated=${result.updated}`,
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[seed:admin] failed", err);
    process.exit(1);
  });
}
