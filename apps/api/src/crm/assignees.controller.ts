import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { hasPermission, RequirePermissions } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/permissions';
import { AssigneesService } from './assignees.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions()
@Controller('assignees')
export class AssigneesController {
  constructor(private readonly assignees: AssigneesService) {}

  @Get()
  list(@Req() req: { user: AuthenticatedUser }) {
    if (!(['lead', 'reminder', 'meeting'] as const).some(module => hasPermission(req.user, module))) {
      throw new ForbiddenException('You do not have permission to assign CRM records.');
    }
    return this.assignees.list();
  }
}
