import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto, VersionDto } from '../crm/crm.dto';
import { ConvertQuotationDto, CreateDocumentDto, PaymentDto, UpdateDocumentDto } from './dto/document.dto';
import { SalesDocumentsService } from './sales-documents.service';
@UseGuards(JwtAuthGuard)
@RequirePermissions('invoice')
@Controller('leads/:leadId/invoices')
export class InvoicesController {
  constructor(private service: SalesDocumentsService) {}
  @Get() list(@Param('leadId', ParseUUIDPipe) leadId: string, @Query() q: ListQueryDto) { return this.service.list(leadId, 'INVOICE', q); }
  @Get(':id') one(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.one(leadId, id, 'INVOICE'); }
  @Post() create(@Param('leadId', ParseUUIDPipe) leadId: string, @Body() body: CreateDocumentDto, @Req() req: { user: Actor }) { return this.service.create(leadId, 'INVOICE', body, req.user); }
  @Patch(':id') update(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateDocumentDto, @Req() req: { user: Actor }) { return this.service.update(leadId, id, 'INVOICE', body, req.user); }
  @Delete(':id') remove(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'INVOICE', 'delete', body, req.user); }
  @Post(':id/issue') issue(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'INVOICE', 'issue', body, req.user); }
  @Post(':id/void') void(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.action(leadId, id, 'INVOICE', 'void', body, req.user); }
  @Get(':id/payments') payments(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.payments(leadId, id); }
  @Post(':id/payments') pay(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: PaymentDto, @Req() req: { user: Actor }) { return this.service.pay(leadId, id, body, req.user); }
  @Post(':id/payments/:paymentId/void') voidPayment(@Param('leadId', ParseUUIDPipe) leadId: string, @Param('id', ParseUUIDPipe) id: string, @Param('paymentId', ParseUUIDPipe) paymentId: string, @Body() body: VersionDto, @Req() req: { user: Actor }) { return this.service.voidPayment(leadId, id, paymentId, body, req.user); }
}
