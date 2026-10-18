import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { ConvertQuotationDto, CreateDocumentDto, PaymentDto, UpdateDocumentDto } from './dto/document.dto';
import { SalesDocumentsService } from './sales-documents.service';
@UseGuards(JwtAuthGuard)
@Controller('leads/:leadId/quotations')
export class QuotationsController {
  constructor(private service: SalesDocumentsService) {}
  @Get() list(@Param('leadId', ParseUUIDPipe) leadId: string, @Query() q: ListQueryDto) { return this.service.list(leadId, 'QUOTATION', q); }
  @Get(':id') one(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.one(leadId, id, 'QUOTATION'); }
  @Post() create(@Param('leadId', ParseUUIDPipe) leadId: string, @Body() body: CreateDocumentDto, @Req() req: { user: Actor }) { return this.service.create(leadId, 'QUOTATION', body, req.user); }
  @Patch(':id') update(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateDocumentDto, @Req() req: { user: Actor }) { return this.service.update(leadId, id, 'QUOTATION', body, req.user); }
  @Delete(':id') remove(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'QUOTATION', 'delete', body, req.user); }
  @Post(':id/finalize') finalize(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'QUOTATION', 'finalize', body, req.user); }
  @Post(':id/accept') accept(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'QUOTATION', 'accept', body, req.user); }
  @Post(':id/reject') reject(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'QUOTATION', 'reject', body, req.user); }
  @Post(':id/cancel') cancel(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'QUOTATION', 'cancel', body, req.user); }
  @Post(':id/convert-to-invoice') convert(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: ConvertQuotationDto, @Req() req: { user: Actor }) { return this.service.convert(leadId, id, body, req.user); }
}
