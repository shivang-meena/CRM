import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { activityPermissions, assertPermissions, RequirePermissions } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/permissions';
import { ListQueryDto } from '../crm/crm.dto';
import { ActivitiesService, ActivityKind } from './activities.service';
import { StandaloneActivitiesService } from '../standalone-activities/standalone-activities.service';
@UseGuards(JwtAuthGuard)
@RequirePermissions()
@Controller('dashboard')
export class DashboardActivitiesController {
  constructor(private service: ActivitiesService, private standalone: StandaloneActivitiesService) {}
  @Get('lead-activities') list(@Query() query: ListQueryDto, @Req() req: { user: AuthenticatedUser }) {
    if (!['followups','reminders','meetings'].includes(query.type ?? '')) throw new BadRequestException('Choose an activity type.');
    const kind = query.type as ActivityKind;
    assertPermissions(req.user, activityPermissions[kind]);
    if (kind === 'followups') return this.service.list(kind, undefined, query);
    return Promise.all([
      this.service.listAll(kind, undefined, query),
      this.standalone.listAll(kind, query),
    ]).then(([linked, independent]) => {
      const timeKey = kind === 'meetings' ? 'startAt' : 'remindAt';
      const items = [...linked.items, ...independent.items].sort((a: any, b: any) => {
        const time = new Date(a[timeKey]).getTime() - new Date(b[timeKey]).getTime();
        return time || a.id.localeCompare(b.id);
      });
      const start = (query.page - 1) * query.pageSize;
      return {
        items: items.slice(start, start + query.pageSize),
        total: linked.total + independent.total,
        completed: linked.completed + independent.completed,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }
}
