import { Module } from '@nestjs/common';
import { SpecializationsController } from './specializations.controller';
import { SpecializationsService } from './specializations.service';

@Module({
  controllers: [SpecializationsController],
  providers: [SpecializationsService],
  exports: [SpecializationsService],
})
export class SpecializationsModule {}
