import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';
import { VersionDto } from '../crm/crm.dto';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private leads: LeadsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.leads.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leads.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.leads.create(dto, req.user);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto, @Req() req: any) {
    return this.leads.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: any) {
    return this.leads.remove(id, body.version, req.user);
  }
}
