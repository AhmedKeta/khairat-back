import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AuthModule } from './application/auth/auth.module';
import { UsersModule } from './application/users/users.module';
import { ServicesModule } from './application/services/services.module';
import { OrdersModule } from './application/orders/orders.module';
import { PaymentsModule } from './application/payments/payments.module';
import { CountriesModule } from './application/countries/countries.module';
import { FaqModule } from './application/faq/faq.module';
import { TestimonialsModule } from './application/testimonials/testimonials.module';
import { UploadModule } from './application/upload/upload.module';

import { UserEntity } from './infrastructure/database/entities/user.entity';
import { ServiceEntity } from './infrastructure/database/entities/service.entity';
import { OrderEntity } from './infrastructure/database/entities/order.entity';
import { PaymentEntity } from './infrastructure/database/entities/payment.entity';
import { CountryEntity } from './infrastructure/database/entities/country.entity';
import { FaqEntity } from './infrastructure/database/entities/faq.entity';
import { TestimonialEntity } from './infrastructure/database/entities/testimonial.entity';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'khairat'),
        entities: [
          UserEntity,
          ServiceEntity,
          OrderEntity,
          PaymentEntity,
          CountryEntity,
          FaqEntity,
          TestimonialEntity,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,
    UsersModule,
    ServicesModule,
    OrdersModule,
    PaymentsModule,
    CountriesModule,
    FaqModule,
    TestimonialsModule,
    UploadModule,
  ],
})
export class AppModule {}
