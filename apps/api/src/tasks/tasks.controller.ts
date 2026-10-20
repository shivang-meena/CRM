import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { VersionDto } from '../crm/crm.dto';
import {
  ChangeTaskStatusDto, CreateStandaloneTaskDto, CreateTaskLabelDto, TaskQueryDto,
  UpdateStandaloneTaskDto, UpdateTaskRecurrenceSeriesDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('task')
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Get('board') board(@Query() query: TaskQueryDto) { return this.service.board(query); }
  @Get('summary') summary(@Query() query: TaskQueryDto) { return this.service.summary(query); }
  @Get('reports/summary') reportSummary(@Query() query: TaskQueryDto) { return this.service.summary(query); }
  @Get() list(@Query() query: TaskQueryDto) { return this.service.list(query); }
  @Post() create(@Body() body: CreateStandaloneTaskDto, @Req() req: { user: Actor }) { return this.service.create(body, req.user); }
  @Get(':id/history') history(@Param('id', ParseUUIDPipe) id: string) { return this.service.history(id); }
  @Get(':id') one(@Param('id', ParseUUIDPipe) id: string) { return this.service.one(id); }
  @Patch(':id/status') status(@Param('id', ParseUUIDPipe) id: string, @Body() body: ChangeTaskStatusDto, @Req() req: { user: Actor }) { return this.service.changeStatus(id, body, req.user); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStandaloneTaskDto, @Req() req: { user: Actor }) { return this.service.update(id, body, req.user); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.remove(id, body.version, req.user); }
}

@UseGuards(JwtAuthGuard)
@RequirePermissions('task')
@Controller('task-labels')
export class TaskLabelsController {
  constructor(private service: TasksService) {}
  @Get() list() { return this.service.labels(); }
  @Post() create(@Body() body: CreateTaskLabelDto) { return this.service.createLabel(body); }
}

@UseGuards(JwtAuthGuard)
@RequirePermissions('task')
@Controller('task-recurrence-series')
export class TaskRecurrenceSeriesController {
  constructor(private service: TasksService) {}
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateTaskRecurrenceSeriesDto, @Req() req: { user: Actor }) { return this.service.updateSeries(id, body, req.user); }
  @Post(':id/stop') stop(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.stopSeries(id, body.version, req.user); }
}
