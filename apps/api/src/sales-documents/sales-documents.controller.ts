import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SalesDocumentsService } from './sales-documents.service';
import {
  CreateSalesDocumentDto,
  SalesDocumentQueryDto,
  UpdateSalesDocumentDto,
  UpsertBrochureDto,
  UpsertPaymentMethodDto,
} from './dto/sales-document.dto';

@Controller('sales-documents')
export class SalesDocumentsController {
  constructor(private readonly service: SalesDocumentsService) {}

  @Get()
  list(@Query() query: SalesDocumentQueryDto) {
    return this.service.listDocuments(query);
  }

  @Get('payment-methods')
  listPaymentMethods(@Query('search') search?: string) {
    return this.service.listPaymentMethods(search);
  }

  @Post('payment-methods')
  createPaymentMethod(@Body() dto: UpsertPaymentMethodDto) {
    return this.service.createPaymentMethod(dto);
  }

  @Patch('payment-methods/:id')
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpsertPaymentMethodDto,
  ) {
    return this.service.updatePaymentMethod(id, dto);
  }

  @Delete('payment-methods/:id')
  deletePaymentMethod(@Param('id') id: string) {
    return this.service.deletePaymentMethod(id);
  }

  @Get('brochures')
  listBrochures(@Query('search') search?: string) {
    return this.service.listBrochures(search);
  }

  @Post('brochures')
  createBrochure(@Body() dto: UpsertBrochureDto) {
    return this.service.createBrochure(dto);
  }

  @Patch('brochures/:id')
  updateBrochure(@Param('id') id: string, @Body() dto: UpsertBrochureDto) {
    return this.service.updateBrochure(id, dto);
  }

  @Delete('brochures/:id')
  deleteBrochure(@Param('id') id: string) {
    return this.service.deleteBrochure(id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getDocumentById(id);
  }

  @Post()
  create(@Body() dto: CreateSalesDocumentDto, @Req() req: any) {
    return this.service.createDocument(dto, {
      userId: req.user?.id,
      userName: req.user?.name || req.user?.userName || 'Subadmin',
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesDocumentDto,
    @Req() req: any,
  ) {
    return this.service.updateDocument(id, dto, {
      userId: req.user?.id,
      userName: req.user?.name || req.user?.userName || 'Subadmin',
    });
  }

  @Post(':id/convert-to-invoice')
  convertToInvoice(@Param('id') id: string, @Req() req: any) {
    return this.service.convertQuotationToInvoice(id, {
      userId: req.user?.id,
      userName: req.user?.name || req.user?.userName || 'Subadmin',
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteDocument(id);
  }
}
