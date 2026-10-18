import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListQueryDto } from '../crm/crm.dto';
import { ActivitiesService } from './activities.service';
@UseGuards(JwtAuthGuard)
@Controller('leads/:leadId')
export class ActivitySummaryController {
  constructor(private service: ActivitiesService) {}
  @Get('sections-summary') summary(@Param('leadId', ParseUUIDPipe) id: string) { return this.service.summary(id); }
  @Get('history') history(@Param('leadId', ParseUUIDPipe) id: string, @Query() query: ListQueryDto) { return this.service.history(id, query); }
}
