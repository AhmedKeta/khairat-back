import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { join } from "path";
import * as express from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";
import { TransformInterceptor } from "./shared/interceptors/transform.interceptor";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ensureUploadDir } from "./application/upload/upload.config";

async function bootstrap() {
  const uploadRoot = join(process.cwd(), "uploads");
  for (const dir of ["images", "videos", "audio"] as const) {
    ensureUploadDir(dir);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.use(
    "/uploads",
    (_req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
      next();
    },
    express.static(uploadRoot, {
      setHeaders: (res, filePath) => {
        const lower = filePath.toLowerCase();
        if (
          lower.endsWith(".html") ||
          lower.endsWith(".htm") ||
          lower.endsWith(".svg")
        ) {
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Content-Disposition", "attachment");
        }
      },
    }),
  );

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const nodeEnv = configService.get<string>("NODE_ENV", "development");
  const frontendUrl = configService.get<string>(
    "FRONTEND_URL",
    "http://localhost:3000",
  );
  const dashboardUrl = configService.get<string>(
    "DASHBOARD_URL",
    "http://localhost:3002",
  );
  const corsExtra = configService.get<string>("CORS_EXTRA_ORIGINS") ?? "";

  const corsOrigin =
    nodeEnv === "production"
      ? [
          ...new Set(
            [frontendUrl, dashboardUrl].concat(
              corsExtra
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          ),
        ]
      : true;

  app.enableCors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Seed-Secret",
      "x-seed-secret",
    ],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.setGlobalPrefix("api");

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
    .setTitle("Khairat API")
    .setDescription("Khairat Islamic Services Platform API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management")
    .addTag("services", "Islamic services")
    .addTag("orders", "Order management")
    .addTag("payments", "Payment processing")
    .addTag("countries", "Country management")
    .addTag("faq", "Frequently asked questions")
    .addTag("testimonials", "Customer testimonials")
    .addTag("works", "Our Works showcase items")
    .addTag("upload", "Media uploads (admin)")
    .addTag("seed", "Database seed (development / controlled bootstrap)")
    .addTag("tracking", "Website visits and marketing attribution")
    .build();

  const enableSwagger =
    nodeEnv !== "production" ||
    configService.get<string>("ENABLE_SWAGGER") === "true";

  if (enableSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = configService.get<number>("PORT", 3001);
  await app.listen(port);

  logger.log(`Khairat API running on port ${port}`, "Bootstrap");
  if (enableSwagger) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`, "Bootstrap");
  }
  logger.log(
    `Audit logs (admin): GET http://localhost:${port}/api/v1/users/admin/audit-logs`,
    "Bootstrap",
  );
}

bootstrap();
