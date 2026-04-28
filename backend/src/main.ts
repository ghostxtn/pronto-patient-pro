import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const configService = app.get(ConfigService);
  const jwtSecret = configService.get<string>('JWT_SECRET') ?? '';
  const WEAK_JWT_SECRETS = [
    'changeme',
    'secret',
    'jwt_secret',
    'your-secret-key',
    'password',
    'mysecret',
    'topsecret',
    'supersecret',
  ];

  if (
    jwtSecret.length < 32 ||
    WEAK_JWT_SECRETS.includes(jwtSecret.toLowerCase())
  ) {
    process.stderr.write(
      '[FATAL] JWT_SECRET is missing, too short (min 32 chars), or a known weak value. ' +
        'Set a strong random secret in .env before starting the application.\n',
    );
    process.exit(1);
  }

  const encKey = configService.get<string>('ENCRYPTION_MASTER_KEY') ?? '';
  if (encKey.length < 64) {
    process.stderr.write(
      '[FATAL] ENCRYPTION_MASTER_KEY must be at least 64 hex characters.\n',
    );
    process.exit(1);
  }

  const port = configService.get<number>('API_PORT', 3000);
  const fallbackOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173',
  );

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'avatars'), {
    prefix: '/uploads/avatars/',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'clinics'), {
    prefix: '/uploads/clinics/',
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Clinic-Domain',
    ],
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
