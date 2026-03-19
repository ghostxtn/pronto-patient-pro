import { Controller, Get, NotFoundException, Req } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { HomepagePreviewService } from './homepage-preview.service';

@Controller('homepage-preview')
export class HomepagePreviewController {
  constructor(
    private readonly homepagePreviewService: HomepagePreviewService,
  ) {}

  @Get()
  @Public()
  getHomepagePreview(@Req() request: TenantRequest) {
    const clinicId = request.tenant?.clinicId;

    if (!clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    return this.homepagePreviewService.getHomepagePreview(clinicId);
  }
}
