import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/permissions';
import { ListQueryDto } from '../crm/crm.dto';
import { ActivitiesService } from './activities.service';
@UseGuards(JwtAuthGuard)
@RequirePermissions('lead')
@Controller('leads/:leadId')
export class ActivitySummaryController {
  constructor(private service: ActivitiesService) {}
  @Get('sections-summary') summary(@Param('leadId', ParseUUIDPipe) id: string, @Req() req: { user: AuthenticatedUser }) { return this.service.summary(id, req.user); }
  @Get('history') history(@Param('leadId', ParseUUIDPipe) id: string, @Query() query: ListQueryDto, @Req() req: { user: AuthenticatedUser }) { return this.service.history(id, query, req.user); }
}
