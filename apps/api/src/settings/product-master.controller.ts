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
import { SaveProductMasterDto } from './product-master.dto';
import { ProductMasterService } from './product-master.service';

@Controller('settings/products')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class ProductMasterController {
  constructor(private readonly products: ProductMasterService) {}

  @Get() list() {
    return this.products.list();
  }

  @Post() create(@Body() data: SaveProductMasterDto) {
    return this.products.save(data);
  }

  @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: SaveProductMasterDto,
  ) {
    return this.products.save(data, id);
  }
}
