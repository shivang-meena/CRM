import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import type { AuthenticatedUser as Actor } from '../auth/permissions';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { CreateTaskDto, UpdateTaskDto } from './dto/activity.dto';
import { ActivitiesService } from './activities.service';
@UseGuards(JwtAuthGuard)
@RequirePermissions('task')
@Controller('leads/:leadId/tasks')
export class TasksController {
  constructor(private service: ActivitiesService) {}
  @Get() list(@Param('leadId', ParseUUIDPipe) leadId: string, @Query() q: ListQueryDto) { return this.service.list('tasks', leadId, q); }
  @Get(':id') one(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.one('tasks', leadId, id); }
  @Post() create(@Param('leadId', ParseUUIDPipe) leadId: string, @Body() body: CreateTaskDto, @Req() req: { user: Actor }) { return this.service.create('tasks', leadId, body, req.user); }
  @Patch(':id') update(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateTaskDto, @Req() req: { user: Actor }) { return this.service.change('tasks', leadId, id, body, req.user, 'update'); }
  @Delete(':id') remove(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('tasks', leadId, id, body, req.user, 'delete'); }
  @Post(':id/complete') complete(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('tasks', leadId, id, body, req.user, 'complete'); }
  @Post(':id/cancel') cancel(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('tasks', leadId, id, body, req.user, 'cancel'); }
}
