import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, AuthenticatedUser, RequirePermissions } from '../auth/permissions';
import { ApplyLeaveDto, ListLeaveQueryDto, ReviewLeaveDto, UpdateLeaveDto } from './dto/leave.dto';
import { LeaveService } from './leave.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('leave')
@Controller('leave')
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Get()
  list(@Query() query: ListLeaveQueryDto, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.findAll(query, req.user);
  }

  @Get(':id')
  one(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.findOne(id, req.user);
  }

  @Post()
  apply(@Body() body: ApplyLeaveDto, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.apply(body, req.user);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateLeaveDto, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.update(id, body, req.user);
  }

  @Patch(':id/review')
  @AdminOnly()
  review(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReviewLeaveDto, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.review(id, body, req.user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: { version: number }, @Req() req: { user: AuthenticatedUser }) {
    return this.leave.cancel(id, body.version, req.user);
  }
}
