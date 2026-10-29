import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { VersionDto } from '../crm/crm.dto';
import { CustomerListQueryDto } from './customers.dto';
import { CustomersService } from './customers.service';
import { UpdateCustomerSelectionsDto } from './customer-selections.dto';

@UseGuards(JwtAuthGuard)
@RequirePermissions('customer')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  findAll(@Query() query: CustomerListQueryDto) {
    return this.customers.findAll(query);
  }

  @Get('services') services() { return this.customers.listServices(); }
  @Get('products') products() { return this.customers.listProducts(); }

  @Patch(':id/selections') updateSelections(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerSelectionsDto,
    @Req() request: { user: Actor },
  ) { return this.customers.updateSelections(id, dto, request.user); }

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
