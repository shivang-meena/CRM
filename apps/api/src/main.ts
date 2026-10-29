import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { PrismaErrorFilter } from './crm/prisma-error.filter';

function getCorsOrigins(): boolean | string[] {
  const rawOrigin = process.env.CORS_ORIGIN ?? process.env.CORS_ORIGINS;
  if (!rawOrigin) {
    return true;
  }

  const cleaned = rawOrigin.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned === '*' || cleaned.toLowerCase() === 'true') {
    return true;
  }

  const origins = cleaned
    .split(',')
    .map((o) => o.trim().replace(/^["']|["']$/g, '').replace(/\/$/, ''))
    .filter(Boolean);

  if (origins.includes('*')) {
    return true;
  }

  return origins.length > 0 ? origins : true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaErrorFilter());
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

