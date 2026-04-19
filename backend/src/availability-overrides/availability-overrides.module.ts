import { Module } from '@nestjs/common';
import { DoctorsModule } from '../doctors/doctors.module';
import { AvailabilityOverridesController } from './availability-overrides.controller';
import { AvailabilityOverridesService } from './availability-overrides.service';

@Module({
  imports: [DoctorsModule],
  controllers: [AvailabilityOverridesController],
  providers: [AvailabilityOverridesService],
  exports: [AvailabilityOverridesService],
})
export class AvailabilityOverridesModule {}
