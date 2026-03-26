import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @Audit('VIEW_PROFILE', 'user')
  getMyProfile(@CurrentUser() user: { userId: string }) {
    return this.profilesService.getMyProfile(user.userId);
  }

  @Patch('me')
  @Audit('UPDATE_PROFILE', 'user')
  updateMyProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateMyProfile(user.userId, dto);
  }

  @Get()
  @Audit('LIST_USERS', 'user')
  @Roles('owner', 'admin')
  findAllByClinic(@CurrentUser() user: { clinicId: string }) {
    return this.profilesService.findAllByClinic(user.clinicId);
  }

  @Patch(':id/role')
  @Audit('UPDATE_ROLE', 'user')
  @Roles('owner')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.profilesService.updateRole(id, dto.role, user.clinicId);
  }
}
