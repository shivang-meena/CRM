import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { CreateStandaloneMeetingDto, UpdateStandaloneMeetingDto } from './dto/standalone-activity.dto';
import { StandaloneActivitiesService } from './standalone-activities.service';

@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class StandaloneMeetingsController {
  constructor(private service: StandaloneActivitiesService) {}
  @Get() list(@Query() query: ListQueryDto) { return this.service.list('meetings', query); }
  @Get(':id') one(@Param('id', ParseUUIDPipe) id: string) { return this.service.one('meetings', id); }
  @Post() create(@Body() body: CreateStandaloneMeetingDto, @Req() req: { user: Actor }) { return this.service.create('meetings', body, req.user); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStandaloneMeetingDto, @Req() req: { user: Actor }) { return this.service.change('meetings', id, body, req.user, 'update'); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.remove('meetings', id, body, req.user); }
  @Post(':id/complete') complete(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('meetings', id, body, req.user, 'complete'); }
  @Post(':id/cancel') cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.change('meetings', id, body, req.user, 'cancel'); }
}
