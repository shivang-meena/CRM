import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Actor } from '../crm/crm-core.service';
import { ListQueryDto } from '../crm/crm.dto';
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}
  @Get() async list(@Query() query: ListQueryDto, @Req() req: { user: Actor }) {
    const where = { recipientId: req.user.id, OR: [{ leadId: null }, { lead: { deletedAt: null } }], reminder: { deletedAt: null, status: { not: 'CANCELLED' as const } } };
    const [items, total, unread] = await Promise.all([
      this.prisma.crmNotification.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.crmNotification.count({ where }),
      this.prisma.crmNotification.count({ where: { ...where, readAt: null } }),
    ]);
    return { items, total, unread, page: query.page, pageSize: query.pageSize };
  }
  @Patch(':id/read') async read(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: Actor }) {
    const result = await this.prisma.crmNotification.updateMany({ where: { id, recipientId: req.user.id, OR: [{ leadId: null }, { lead: { deletedAt: null } }] }, data: { readAt: new Date() } });
    if (!result.count) throw new NotFoundException('Notification not found');
    return { success: true };
  }
}
