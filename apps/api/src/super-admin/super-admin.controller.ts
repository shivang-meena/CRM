import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/permissions';
import {
  CreateAdminDto, ListAdminsQueryDto, ResetAdminPasswordDto, SuperAdminLoginDto,
  UpdateAdminDto, UpdateAdminFeaturesDto, UpdateAdminLoginIdDto, UpdateAdminStatusDto,
} from './dto/super-admin.dto';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';

/** Public: only the login. */
@Controller('super-admin')
export class SuperAdminAuthController {
  constructor(private readonly auth: SuperAdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: SuperAdminLoginDto, @Req() req: { ip?: string }) {
    return this.auth.login(dto, req.ip ?? 'unknown');
  }
}

/** Everything else: super admin token required. */
@UseGuards(SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly admins: SuperAdminService) {}

  @Get('me')
  me(@Req() req: { user: AuthenticatedUser }) {
    return { id: req.user.id, name: req.user.name, role: req.user.role };
  }

  @Get('admins')
  list(@Query() query: ListAdminsQueryDto) { return this.admins.list(query); }

  @Post('admins')
  create(@Body() body: CreateAdminDto) { return this.admins.create(body); }

  @Get('admins/:id')
  one(@Param('id') id: string) { return this.admins.findOne(id); }

  @Patch('admins/:id')
  update(@Param('id') id: string, @Body() body: UpdateAdminDto) { return this.admins.update(id, body); }

  @Patch('admins/:id/features')
  features(@Param('id') id: string, @Body() body: UpdateAdminFeaturesDto) { return this.admins.updateFeatures(id, body); }

  @Patch('admins/:id/status')
  status(@Param('id') id: string, @Body() body: UpdateAdminStatusDto) { return this.admins.updateStatus(id, body); }

  @Patch('admins/:id/password')
  password(@Param('id') id: string, @Body() body: ResetAdminPasswordDto) { return this.admins.resetPassword(id, body); }

  @Patch('admins/:id/login-id')
  loginId(@Param('id') id: string, @Body() body: UpdateAdminLoginIdDto) { return this.admins.changeLoginId(id, body); }
}
