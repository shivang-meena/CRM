import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import type { AuthenticatedUser } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { VersionDto } from '../crm/crm.dto';
import { CalendarItemsQueryDto, CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar.dto';
import { CalendarService } from './calendar.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private service: CalendarService) {}
  @Get('items') items(@Query() query: CalendarItemsQueryDto, @Req() req: { user: AuthenticatedUser }) { return this.service.items(query, req.user); }
  @Post('events') create(@Body() body: CreateCalendarEventDto, @Req() req: { user: Actor }) { return this.service.create(body, req.user); }
  @Get('events/:id') one(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: Actor }) { return this.service.one(id, req.user); }
  @Patch('events/:id') update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCalendarEventDto, @Req() req: { user: Actor }) { return this.service.update(id, body, req.user); }
  @Delete('events/:id') remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.remove(id, body.version, req.user); }
}
