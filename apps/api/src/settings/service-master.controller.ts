import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/permissions';
import { SaveServiceMasterDto } from './service-master.dto';
import { ServiceMasterService } from './service-master.service';

@Controller('settings/services')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class ServiceMasterController {
  constructor(private readonly services: ServiceMasterService) {}

  @Get() list() {
    return this.services.list();
  }

  @Post() create(@Body() data: SaveServiceMasterDto) {
    return this.services.save(data);
  }

  @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: SaveServiceMasterDto,
  ) {
    return this.services.save(data, id);
  }
}
