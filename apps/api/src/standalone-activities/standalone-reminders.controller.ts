import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { CreateStandaloneReminderDto, UpdateStandaloneReminderDto } from './dto/standalone-activity.dto';
import { StandaloneActivitiesService } from './standalone-activities.service';

@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class StandaloneRemindersController {
  constructor(private service: StandaloneActivitiesService) {}
  @Get() list(@Query() query: ListQueryDto) { return this.service.list('reminders', query); }
  @Get(':id') one(@Param('id', ParseUUIDPipe) id: string) { return this.service.one('reminders', id); }
  @Post() create(@Body() body: CreateStandaloneReminderDto, @Req() req: { user: Actor }) { return this.service.create('reminders', body, req.user); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStandaloneReminderDto, @Req() req: { user: Actor }) { return this.service.change('reminders', id, body, req.user, 'update'); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.remove('reminders', id, body, req.user); }
  @Post(':id/dismiss') dismiss(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('reminders', id, body, req.user, 'dismiss'); }
  @Post(':id/cancel') cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('reminders', id, body, req.user, 'cancel'); }
}
