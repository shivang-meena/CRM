import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { CreateReminderDto, UpdateReminderDto } from './dto/activity.dto';
import { ActivitiesService } from './activities.service';
@UseGuards(JwtAuthGuard)
@Controller('leads/:leadId/reminders')
export class RemindersController {
  constructor(private service: ActivitiesService) {}
  @Get() list(@Param('leadId', ParseUUIDPipe) leadId: string, @Query() q: ListQueryDto) { return this.service.list('reminders', leadId, q); }
  @Get(':id') one(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.one('reminders', leadId, id); }
  @Post() create(@Param('leadId', ParseUUIDPipe) leadId: string, @Body() body: CreateReminderDto, @Req() req: { user: Actor }) { return this.service.create('reminders', leadId, body, req.user); }
  @Patch(':id') update(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateReminderDto, @Req() req: { user: Actor }) { return this.service.change('reminders', leadId, id, body, req.user, 'update'); }
  @Delete(':id') remove(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('reminders', leadId, id, body, req.user, 'delete'); }
  @Post(':id/dismiss') complete(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('reminders', leadId, id, body, req.user, 'dismiss'); }
  @Post(':id/cancel') cancel(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('reminders', leadId, id, body, req.user, 'cancel'); }
}
