import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('app.port') ?? 4000;
  const prefix = config.get<string>('app.apiPrefix') ?? 'api';
  const origins = config.get<string[]>('app.corsOrigins') ?? ['http://localhost:3000'];

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin/server-side calls have no Origin header.
      if (!origin) return callback(null, true);
      const allowed =
        origins.includes('*') ||
        origins.includes(origin) ||
        // The sandboxed preview proxies the storefront under *.e2b.app.
        /\.e2b\.app$/.test(new URL(origin).hostname) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin);
      callback(null, allowed);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Aabha Commerce API')
    .setDescription(
      'Beauty & Personal Care commerce platform for Bangladesh. Money values are integers in poisha (1 BDT = 100).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Unified login/register, OTP, OAuth, guest checkout')
    .addTag('theme', 'Runtime-editable design tokens')
    .addTag('navigation', 'Admin-editable header, category bar and mega-menus')
    .addTag('catalog', 'Categories and brands')
    .build();
  SwaggerModule.setup(`${prefix}/docs`, app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`Aabha API listening on http://0.0.0.0:${port}/${prefix}/v1`);
  logger.log(`API docs at http://0.0.0.0:${port}/${prefix}/docs`);
}

void bootstrap();
