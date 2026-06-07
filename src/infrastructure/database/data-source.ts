import "reflect-metadata";
import { config } from "dotenv";
import { resolve, join } from "path";
import { DataSource } from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { ServiceEntity } from "./entities/service.entity";
import { ServiceCategoryEntity } from "./entities/service-category.entity";
import { ServiceMarkEntity } from "./entities/service-mark.entity";
import { ServiceMarkAssignmentEntity } from "./entities/service-mark-assignment.entity";
import { OrderEntity } from "./entities/order.entity";
import { PaymentEntity } from "./entities/payment.entity";
import { CountryEntity } from "./entities/country.entity";
import { FaqEntity } from "./entities/faq.entity";
import { TestimonialEntity } from "./entities/testimonial.entity";
import { OurWorkEntity } from "./entities/our-work.entity";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { UserTrackingEntity } from "./entities/user-tracking.entity";
import { PasswordResetCodeEntity } from "./entities/password-reset-code.entity";

config({ path: resolve(__dirname, "../../../.env") });

const entities = [
  UserEntity,
  ServiceEntity,
  ServiceCategoryEntity,
  ServiceMarkEntity,
  ServiceMarkAssignmentEntity,
  OrderEntity,
  PaymentEntity,
  CountryEntity,
  FaqEntity,
  TestimonialEntity,
  OurWorkEntity,
  AuditLogEntity,
  UserTrackingEntity,
  PasswordResetCodeEntity,
];

const isProd = !!process.env.DATABASE_URL;
const shouldSynchronize = process.env.DB_SYNCHRONIZE === "true";

export const AppDataSource = new DataSource(
  isProd
    ? {
        type: "postgres",
        url: process.env.DATABASE_URL, // ✅ FULL URL here
        ssl: {
          rejectUnauthorized: false,
        },
        synchronize: shouldSynchronize,
        logging: false,
        entities,
        migrations: [join(__dirname, "migrations", "*.{ts,js}")],
      }
    : {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_DATABASE || "khairat",
        synchronize: true,
        logging: true,
        entities,
        migrations: [join(__dirname, "migrations", "*.{ts,js}")],
      },
);
