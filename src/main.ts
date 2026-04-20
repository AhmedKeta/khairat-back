import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { mkdirSync } from 'fs';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const uploadRoot = join(process.cwd(), 'uploads');
  for (const dir of ['images', 'videos']) {
    mkdirSync(join(uploadRoot, dir), { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.use('/uploads', express.static(uploadRoot));

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:3000'),
      configService.get('DASHBOARD_URL', 'http://localhost:3002'),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Khairat API')
    .setDescription('Khairat Islamic Services Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('services', 'Islamic services')
    .addTag('orders', 'Order management')
    .addTag('payments', 'Payment processing')
    .addTag('countries', 'Country management')
    .addTag('faq', 'Frequently asked questions')
    .addTag('testimonials', 'Customer testimonials')
    .addTag('upload', 'Media uploads (admin)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.log(`Khairat API running on port ${port}`, 'Bootstrap');
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
