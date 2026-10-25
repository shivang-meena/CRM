import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, RequirePermissions } from '../auth/permissions';
import {
  ReorderLeadStatusDto,
  SaveLeadStatusMasterDto,
} from './lead-status-master.dto';
import { LeadStatusMasterService } from './lead-status-master.service';

@Controller('settings/lead-statuses')
@UseGuards(JwtAuthGuard)
export class LeadStatusMasterController {
  constructor(private readonly service: LeadStatusMasterService) {}

  @Get()
  @RequirePermissions('lead')
  list() {
    return this.service.list();
  }

  @Post()
  @AdminOnly()
  create(@Body() data: SaveLeadStatusMasterDto) {
    return this.service.save(data);
  }

  @Put('reorder')
  @AdminOnly()
  reorder(@Body() body: ReorderLeadStatusDto) {
    return this.service.reorder(body.ids);
  }

  @Patch(':id')
  @AdminOnly()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: SaveLeadStatusMasterDto,
  ) {
    return this.service.save(data, id);
  }

  @Delete(':id')
  @AdminOnly()
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }
}
