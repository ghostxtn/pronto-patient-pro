import { Module } from '@nestjs/common';
import { HomepagePreviewController } from './homepage-preview.controller';
import { HomepagePreviewService } from './homepage-preview.service';

@Module({
  controllers: [HomepagePreviewController],
  providers: [HomepagePreviewService],
})
export class HomepagePreviewModule {}
