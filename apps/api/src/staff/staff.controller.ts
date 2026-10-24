import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, RequirePermissions } from '../auth/permissions';
import { CreateStaffDto, ListStaffQueryDto, UpdateStaffDto, UpdateStaffStatusDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(@Query() query: ListStaffQueryDto) { return this.staff.findAll(query); }

  @Get(':id')
  one(@Param('id', ParseUUIDPipe) id: string) { return this.staff.findOne(id); }

  @Post()
  @AdminOnly('staff')
  create(@Body() body: CreateStaffDto) { return this.staff.create(body); }

  @Patch(':id')
  @AdminOnly('staff')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStaffDto) {
    return this.staff.update(id, body);
  }

  @Patch(':id/status')
  @AdminOnly('staff')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateStaffStatusDto) {
    return this.staff.updateStatus(id, body);
  }
}
