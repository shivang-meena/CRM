import {
  Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { VersionDto } from '../crm/crm.dto';
import { CustomerListQueryDto } from './customers.dto';
import { CustomersService } from './customers.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('customer')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  findAll(@Query() query: CustomerListQueryDto) {
    return this.customers.findAll(query);
  }

  @Get('by-lead/:leadId')
  async findByLead(@Param('leadId', ParseUUIDPipe) leadId: string) {
    return { customer: await this.customers.findByLead(leadId) };
  }

  @Post('from-lead/:leadId')
  convert(
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() body: VersionDto,
    @Req() request: { user: Actor },
  ) {
    return this.customers.convert(leadId, body.version, request.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customers.findOne(id);
  }
}
