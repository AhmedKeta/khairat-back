import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AuthModule } from './application/auth/auth.module';
import { UsersModule } from './application/users/users.module';
import { ServicesModule } from './application/services/services.module';
import { ServiceCategoriesModule } from './application/service-categories/service-categories.module';
import { OrdersModule } from './application/orders/orders.module';
import { PaymentsModule } from './application/payments/payments.module';
import { CountriesModule } from './application/countries/countries.module';
import { FaqModule } from './application/faq/faq.module';
import { TestimonialsModule } from './application/testimonials/testimonials.module';
import { WorksModule } from './application/works/works.module';
import { UploadModule } from './application/upload/upload.module';
import { SeedModule } from './application/seed/seed.module';
import { SiteSettingsModule } from './application/site-settings/site-settings.module';
import { UserEntity } from './infrastructure/database/entities/user.entity';
import { AuditLogEntity } from './infrastructure/database/entities/audit-log.entity';
import { UserTrackingEntity } from './infrastructure/database/entities/user-tracking.entity';
import { ServiceEntity } from './infrastructure/database/entities/service.entity';
import { ServiceCategoryEntity } from './infrastructure/database/entities/service-category.entity';
import { OrderEntity } from './infrastructure/database/entities/order.entity';
import { PaymentEntity } from './infrastructure/database/entities/payment.entity';
import { CountryEntity } from './infrastructure/database/entities/country.entity';
import { FaqEntity } from './infrastructure/database/entities/faq.entity';
import { TestimonialEntity } from './infrastructure/database/entities/testimonial.entity';
import { OurWorkEntity } from './infrastructure/database/entities/our-work.entity';
import { SiteSettingEntity } from './infrastructure/database/entities/site-setting.entity';
import { PasswordResetCodeEntity } from './infrastructure/database/entities/password-reset-code.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const synchronize =
          configService.get<string>('DB_SYNCHRONIZE') === 'true' || !isProduction;

        const baseConfig = {
          type: 'postgres' as const,
          entities: [
            UserEntity,
            ServiceEntity,
            ServiceCategoryEntity,
            OrderEntity,
            PaymentEntity,
            CountryEntity,
            FaqEntity,
            TestimonialEntity,
            OurWorkEntity,
            AuditLogEntity,
            UserTrackingEntity,
            SiteSettingEntity,
            PasswordResetCodeEntity,
          ],
          synchronize,
          logging: nodeEnv === 'development',
        };

        if (databaseUrl) {
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          ...baseConfig,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'khairat'),
        };
      },
    }),

    AuthModule,
    UsersModule,
    ServicesModule,
    ServiceCategoriesModule,
    OrdersModule,
    PaymentsModule,
    CountriesModule,
    FaqModule,
    TestimonialsModule,
    WorksModule,
    UploadModule,
    SeedModule,
    SiteSettingsModule,
  ],
})
export class AppModule {}
