import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly } from '../auth/permissions';
import { SaveHsnMasterDto } from './hsn-master.dto';
import { HsnMasterService } from './hsn-master.service';

@Controller('settings/hsn-master')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class HsnMasterController {
  constructor(private readonly master: HsnMasterService) {}

  @Get() list() {
    return this.master.list();
  }
  @Post() create(@Body() data: SaveHsnMasterDto) {
    return this.master.save(data);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() data: SaveHsnMasterDto,
  ) {
    return this.master.save(data, id);
  }
}
