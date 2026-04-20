import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { ServiceEntity } from './entities/service.entity';
import { OrderEntity } from './entities/order.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CountryEntity } from './entities/country.entity';
import { FaqEntity } from './entities/faq.entity';
import { TestimonialEntity } from './entities/testimonial.entity';

config({ path: resolve(__dirname, '../../../.env') });

const entities = [
  UserEntity,
  ServiceEntity,
  OrderEntity,
  PaymentEntity,
  CountryEntity,
  FaqEntity,
  TestimonialEntity,
];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'khairat',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
