import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');

        const pool = new Pool({
          connectionString,
        });

        return drizzle(pool, { schema });
      },
    },
    {
      provide: 'AUDIT_DRIZZLE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('AUDIT_DATABASE_URL');
        if (!connectionString) {
          throw new Error('AUDIT_DATABASE_URL is not configured');
        }
        const pool = new Pool({ connectionString });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: ['DRIZZLE', 'AUDIT_DRIZZLE'],
})
export class DatabaseModule {}
