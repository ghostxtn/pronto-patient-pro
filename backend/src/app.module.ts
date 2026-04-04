import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuditModule } from './audit/audit.module';
import { AvailabilityModule } from './availability/availability.module';
import { AvailabilityOverridesModule } from './availability-overrides/availability-overrides.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ClinicsModule } from './clinics/clinics.module';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TenantGuard } from './common/guards/tenant.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantResolverService } from './common/services/tenant-resolver.service';
import { DatabaseModule } from './database/database.module';
import { DoctorsModule } from './doctors/doctors.module';
import { EmailModule } from './email/email.module';
import { EncryptionModule } from './encryption/encryption.module';
import { HealthModule } from './health/health.module';
import { HomepagePreviewModule } from './homepage-preview/homepage-preview.module';
import { PatientClinicalNotesModule } from './patient-clinical-notes/patient-clinical-notes.module';
import { PatientsModule } from './patients/patients.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RedisModule } from './redis/redis.module';
import { StaffModule } from './staff/staff.module';
import { SpecializationsModule } from './specializations/specializations.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 100 },
    ]),
    HealthModule,
    HomepagePreviewModule,
    DatabaseModule,
    AuditModule,
    EmailModule,
    EncryptionModule,
    RedisModule,
    AuthModule,
    ClinicsModule,
    ProfilesModule,
    SpecializationsModule,
    StaffModule,
    DoctorsModule,
    AvailabilityModule,
    AvailabilityOverridesModule,
    PatientsModule,
    PatientClinicalNotesModule,
    AppointmentsModule,
    StorageModule,
  ],
  providers: [
    TenantResolverService,
    TenantMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
