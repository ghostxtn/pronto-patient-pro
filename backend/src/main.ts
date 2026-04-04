import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);
  const fallbackOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173',
  );

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'avatars'), {
    prefix: '/uploads/avatars/',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'specializations'), {
    prefix: '/uploads/specializations/',
  });
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false,
    xContentTypeOptions: false,
    xFrameOptions: false,
    referrerPolicy: false,
    xXssProtection: false,
  }));
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin === fallbackOrigin) {
        callback(null, true);
        return;
      }

      if (origin.match(/^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/)) {
        callback(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        const drizzle = app.get('DRIZZLE');
        const { clinics } = require('./database/schema');
        const { eq } = require('drizzle-orm');

        drizzle
          .select({ domain: clinics.domain })
          .from(clinics)
          .where(eq(clinics.domain, hostname))
          .limit(1)
          .then((results: any[]) => {
            if (results.length > 0) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          })
          .catch(() => {
            callback(new Error('CORS check failed'));
          });
      } catch {
        callback(new Error('Invalid origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

void bootstrap();
