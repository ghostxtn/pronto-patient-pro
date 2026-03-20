import { Module } from '@nestjs/common';
import { AvailabilityOverridesController } from './availability-overrides.controller';
import { AvailabilityOverridesService } from './availability-overrides.service';

@Module({
  controllers: [AvailabilityOverridesController],
  providers: [AvailabilityOverridesService],
  exports: [AvailabilityOverridesService],
})
export class AvailabilityOverridesModule {}
